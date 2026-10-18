/* YKS follow check — POST /check {handle} → {follows: true|false|null}
   Does @handle follow @yks_photoworks? Asked of Instagram's web API with the
   owner's own logged-in session (Worker secrets). null = the check itself
   couldn't run (no secret, Instagram refused, rate-limited, timeout) — the
   site then lets the application through marked for review.
   Never logs or echoes the session. */
const IG_APP_ID = '936619743392459';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const TRUE_TTL = 600;    // a confirmed follow is cached ~10 min
const FALSE_TTL = 20;    // a "no" is cached briefly, so someone who just followed can retry at once
const HANDLE_RE = /^(?!.*\.\.)(?!\.)[a-z0-9._]{1,30}$/;

export function normaliseHandle(raw) {
  let s = String(raw || '').trim();
  const m = /instagram\.com\/([A-Za-z0-9._]{1,30})/i.exec(s);
  if (m) s = m[1];
  s = s.replace(/^@+/, '').replace(/[/?#].*$/, '').replace(/\.+$/, '').toLowerCase();
  return HANDLE_RE.test(s) ? s : '';
}

function cors(env, origin) {
  const h = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origin === env.ALLOW_ORIGIN) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}
const json = (obj, status, headers) => new Response(JSON.stringify(obj), { status, headers });

function igHeaders(env) {
  const c = ['sessionid=' + env.IG_SESSIONID];
  if (env.IG_DS_USER_ID) c.push('ds_user_id=' + env.IG_DS_USER_ID);
  if (env.IG_CSRFTOKEN) c.push('csrftoken=' + env.IG_CSRFTOKEN);
  const h = { 'User-Agent': UA, 'X-IG-App-ID': IG_APP_ID, Accept: 'application/json', Cookie: c.join('; '), Referer: 'https://www.instagram.com/' };
  if (env.IG_CSRFTOKEN) h['X-CSRFToken'] = env.IG_CSRFTOKEN;
  return h;
}
async function ig(env, path, fetcher) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3500);
  try {
    const r = await fetcher('https://i.instagram.com' + path, { headers: igHeaders(env), signal: ctl.signal, redirect: 'manual' });
    if (r.status !== 200) return { err: 'ig_' + r.status };
    const ct = r.headers.get('content-type') || '';
    if (ct.indexOf('json') < 0) return { err: 'ig_nonjson' };   // login wall / checkpoint page
    return { data: await r.json() };
  } catch (e) { return { err: e && e.name === 'AbortError' ? 'ig_timeout' : 'ig_network' }; }
  finally { clearTimeout(t); }
}
async function userId(env, handle, fetcher) {
  const r = await ig(env, '/api/v1/users/web_profile_info/?username=' + encodeURIComponent(handle), fetcher);
  if (r.err) return r;
  const id = r.data && r.data.data && r.data.data.user && r.data.data.user.id;
  return id ? { id: String(id) } : { notFound: true };
}

/* The core question. If the session IS @yks_photoworks, friendships/show
   answers it directly (followed_by). Otherwise search the target's
   followers list for the handle. */
export async function checkFollow(env, handle, fetcher = fetch) {
  if (!env.IG_SESSIONID) return { follows: null, why: 'no_session' };
  if (handle === String(env.TARGET).toLowerCase()) return { follows: true };
  const who = await userId(env, handle, fetcher);
  if (who.err) return { follows: null, why: who.err };
  if (who.notFound) return { follows: false, why: 'no_such_user' };
  let me = env.IG_DS_USER_ID ? String(env.IG_DS_USER_ID) : '';
  const target = await userId(env, String(env.TARGET).toLowerCase(), fetcher);
  if (target.err || !target.id) return { follows: null, why: target.err || 'target_missing' };
  if (!me || me === target.id) {
    const rel = await ig(env, '/api/v1/friendships/show/' + who.id + '/', fetcher);
    if (rel.err) return { follows: null, why: rel.err };
    if (typeof rel.data.followed_by === 'boolean') return { follows: rel.data.followed_by };
    return { follows: null, why: 'ig_shape' };
  }
  const list = await ig(env, '/api/v1/friendships/' + target.id + '/followers/?count=50&search_surface=follow_list_page&query=' + encodeURIComponent(handle), fetcher);
  if (list.err) return { follows: null, why: list.err };
  const users = (list.data && list.data.users) || [];
  return { follows: users.some(u => String(u.pk || u.pk_id || u.id) === who.id || String(u.username || '').toLowerCase() === handle) };
}

async function rateLimited(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const win = Math.floor(Date.now() / 60000);
  const key = new Request('https://rl.yks-follow-check.internal/' + encodeURIComponent(ip) + '/' + win);
  const cache = caches.default, hit = await cache.match(key);
  const n = hit ? (+(await hit.text()) || 0) : 0;
  if (n >= (+env.RATE_PER_MIN || 8)) return true;
  await cache.put(key, new Response(String(n + 1), { headers: { 'Cache-Control': 'max-age=70' } }));
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url), origin = request.headers.get('Origin') || '';
    const H = cors(env, origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: origin === env.ALLOW_ORIGIN ? 204 : 403, headers: H });
    if (url.pathname !== '/check') return json({ error: 'not_found' }, 404, H);
    if (request.method !== 'POST') return json({ error: 'method' }, 405, H);
    if (origin !== env.ALLOW_ORIGIN) return json({ error: 'origin' }, 403, H);
    let body = {}; try { body = await request.json(); } catch (e) {}
    const handle = normaliseHandle(body && body.handle);
    if (!handle) return json({ follows: null, error: 'bad_handle' }, 400, H);
    if (await rateLimited(request, env)) return json({ follows: null, error: 'rate_limited' }, 429, H);

    const ck = new Request('https://cache.yks-follow-check.internal/v1/' + handle);
    const cached = await caches.default.match(ck);
    if (cached) { const v = await cached.json(); return json({ follows: v.follows, handle, cached: true }, 200, H); }

    const res = await checkFollow(env, handle);
    if (res.follows !== null) {
      ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify({ follows: res.follows }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + (res.follows ? TRUE_TTL : FALSE_TTL) } })));
    } else {
      console.log('follow-check unavailable:', res.why);   // reason code only — never the session
    }
    return json({ follows: res.follows, handle }, 200, H);
  }
};
