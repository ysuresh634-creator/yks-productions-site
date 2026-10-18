/* YKS follow check — POST /check {handle} → {follows: true|false|null}
   Does @handle follow @yks_photoworks? Asked of Instagram's web API with the
   owner's own logged-in session (Worker secrets). null = the check itself
   couldn't run (no secret, Instagram refused, rate-limited, timeout; the reason code is in `why` and in the log) — the
   site then lets the application through marked for review.
   Never logs or echoes the session. */
const IG_APP_ID = '936619743392459';
// www.instagram.com web endpoints want a desktop browser UA; the i.instagram.com
// users/search endpoint answers "useragent mismatch" unless it sees the Android app UA.
const WEB_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const APP_UA = 'Instagram 309.0.0.40.113 Android (31/12; 420dpi; 1080x2340; samsung; SM-G991B; o1s; exynos2100; en_US; 541635890)';
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

// The secret may be pasted URL-encoded (%3A) or decoded (:). The cookie wants the encoded form.
function sessionCookie(env) {
  let s = String(env.IG_SESSIONID || '').trim().replace(/^sessionid=/, '').replace(/;.*$/, '');
  try { s = encodeURIComponent(decodeURIComponent(s)); } catch (e) {}
  return s;
}
export function dsUserId(env) {
  if (env.IG_DS_USER_ID && /^\d+$/.test(String(env.IG_DS_USER_ID).trim())) return String(env.IG_DS_USER_ID).trim();
  let s = String(env.IG_SESSIONID || ''); try { s = decodeURIComponent(s); } catch (e) {}
  return (/^\d+/.exec(s) || [''])[0];
}
function igHeaders(env, kind, csrf) {
  const cookie = ['sessionid=' + sessionCookie(env), 'ds_user_id=' + dsUserId(env), 'csrftoken=' + csrf].join('; ');
  return {
    'User-Agent': kind === 'app' ? APP_UA : WEB_UA, 'X-IG-App-ID': IG_APP_ID, 'X-ASBD-ID': '129477', 'X-IG-WWW-Claim': '0',
    'X-CSRFToken': csrf, 'X-Requested-With': 'XMLHttpRequest', Accept: '*/*',
    Referer: 'https://www.instagram.com/', Cookie: cookie,
  };
}
// One Instagram call. Returns {data} or {err:'<step>_<reason>'}; reasons are status codes / short codes only.
async function ig(env, step, url, kind, csrf, fetcher) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3000);
  try {
    const r = await fetcher(url, { headers: igHeaders(env, kind, csrf), signal: ctl.signal, redirect: 'manual' });
    if (r.status !== 200) return { err: step + '_' + r.status, status: r.status };
    const ct = r.headers.get('content-type') || '';
    if (ct.indexOf('json') < 0) return { err: step + '_nonjson' };   // login wall / checkpoint page
    const data = await r.json();
    if (data && data.status === 'fail') return { err: step + '_fail' + (data.message === 'checkpoint_required' ? '_checkpoint' : data.message === 'login_required' ? '_login' : '') };
    return { data };
  } catch (e) { return { err: step + (e && e.name === 'AbortError' ? '_timeout' : '_network') }; }
  finally { clearTimeout(t); }
}
const WWW = 'https://www.instagram.com', API = 'https://i.instagram.com';
const uname = u => String((u && u.username) || '').toLowerCase();

/* The session IS @yks_photoworks, so:
   1. fast yes: search my own followers list for the handle (exact username match → true).
      Instagram's follower search misses some people, so a miss proves nothing.
   2. user id: i.instagram.com users/search (app UA), exact username match.
      (web_profile_info is the obvious endpoint, but it answers 429 to datacenter / Cloudflare IPs.)
   3. authoritative: www friendships/show/<id> → followed_by. */
export async function checkFollow(env, handle, fetcher = fetch, log = () => {}) {
  if (!env.IG_SESSIONID) return { follows: null, why: 'no_session' };
  const me = dsUserId(env);
  if (!me) return { follows: null, why: 'no_ds_user_id' };
  if (handle === String(env.TARGET).toLowerCase()) return { follows: true, why: 'self' };
  const csrf = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');

  const fl = await ig(env, 'followers', WWW + '/api/v1/friendships/' + me + '/followers/?count=12&search_surface=follow_list_page&query=' + encodeURIComponent(handle), 'web', csrf, fetcher);
  if (fl.err) log(fl.err);
  else if (((fl.data && fl.data.users) || []).some(u => uname(u) === handle)) return { follows: true, why: 'followers_search' };

  let id = '';
  const sr = await ig(env, 'search', API + '/api/v1/users/search/?count=10&q=' + encodeURIComponent(handle), 'app', csrf, fetcher);
  if (sr.err) log(sr.err);
  else { const u = ((sr.data && sr.data.users) || []).find(x => uname(x) === handle); if (u) id = String(u.pk || u.pk_id || u.id || ''); }
  if (!id) {
    const wp = await ig(env, 'profile', WWW + '/api/v1/users/web_profile_info/?username=' + encodeURIComponent(handle), 'web', csrf, fetcher);
    if (wp.status === 404) return { follows: false, why: 'no_such_user' };
    const pid = wp.data && wp.data.data && wp.data.data.user && wp.data.data.user.id;
    if (pid) id = String(pid);
    else return { follows: null, why: [sr.err || 'search_nomatch', wp.err || 'profile_empty'].join(',') };
  }

  const rel = await ig(env, 'show', WWW + '/api/v1/friendships/show/' + id + '/', 'web', csrf, fetcher);
  if (rel.err) return { follows: null, why: rel.err };
  if (typeof rel.data.followed_by === 'boolean') return { follows: rel.data.followed_by, why: 'friendship' };
  return { follows: null, why: 'show_shape' };
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

    const ck = new Request('https://cache.yks-follow-check.internal/v2/' + handle);
    const cached = await caches.default.match(ck);
    if (cached) { const v = await cached.json(); return json({ follows: v.follows, handle, cached: true }, 200, H); }

    const res = await checkFollow(env, handle, fetch, step => console.log('follow-check step failed:', step));
    console.log('follow-check', JSON.stringify({ handle, follows: res.follows, why: res.why }));   // codes only — never the session
    if (res.follows !== null) {
      ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify({ follows: res.follows }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=' + (res.follows ? TRUE_TTL : FALSE_TTL) } })));
    }
    return json(res.follows === null ? { follows: null, handle, why: res.why } : { follows: res.follows, handle }, 200, H);
  }
};
