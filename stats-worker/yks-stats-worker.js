/* ═══════════════════════════════════════════════════════════════
   yks-stats — cookieless, anonymous visit counting for
   yksproductions.com + marketing.yksproductions.com
   ───────────────────────────────────────────────────────────────
   POST /c            beacon from /js/stats.js (text/plain JSON)
   GET  /dashboard    private dashboard shell (data needs the key)
   GET  /api/summary  aggregates for a date range   (X-Key header)
   GET  /api/live     last 30 minutes                (X-Key header)

   Stored per row: page path, referrer DOMAIN, utm tags, country/city
   (Cloudflare edge geo), device/browser/OS family, screen bucket,
   language, timezone region, time on page, scroll depth, event name.
   Never stored: IP address, user-agent string, cookies, query strings,
   form contents, search terms, chat text. Visitors are counted with a
   salted hash of (salt of the day, IP, UA, site); the salt is random,
   kept only for that IST day and then deleted, so a hash can't be
   reversed or linked across days.
   ═══════════════════════════════════════════════════════════════ */

const ORIGINS = {
  'https://yksproductions.com': 'main',
  'https://www.yksproductions.com': 'main',
  'https://marketing.yksproductions.com': 'mkt',
};
const IST = 19800000; // +05:30 in ms
const EVENTS = new Set(['wa', 'call', 'email', 'form', 'chat_open', 'chat_msg', 'search', 'adsim', 'adsim_brand', 'exit_shown', 'exit_click', 'cta']);
const CTA = ['wa', 'call', 'email', 'cta', 'exit_click', 'chat_open'];
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview|python|curl|wget|go-http|java\/|axios|node-fetch|phantom|puppeteer|playwright|scrapy|facebookexternalhit|whatsapp\//i;

const istDay = (ts) => new Date(ts + IST).toISOString().slice(0, 10);
const cut = (v, n) => (typeof v === 'string' && v ? v.slice(0, n) : null);

function ua(s) {
  s = s || '';
  const device = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s) ? 'tablet' : /Mobi|iPhone|iPod|Android|IEMobile|Opera Mini/i.test(s) ? 'mobile' : 'desktop';
  const browser = /SamsungBrowser/.test(s) ? 'Samsung Internet' : /Edg\//.test(s) ? 'Edge' : /OPR\/|Opera/.test(s) ? 'Opera'
    : /FBAN|FBAV|Instagram|LinkedInApp|Snapchat|; wv\)/.test(s) ? (/Instagram/.test(s) ? 'Instagram app' : /FBAN|FBAV/.test(s) ? 'Facebook app' : /LinkedInApp/.test(s) ? 'LinkedIn app' : 'In-app browser')
    : /Firefox|FxiOS/.test(s) ? 'Firefox' : /CriOS|Chrome\//.test(s) ? 'Chrome' : /Safari\//.test(s) ? 'Safari' : 'Other';
  const os = /iPhone|iPad|iPod/.test(s) ? 'iOS' : /Android/.test(s) ? 'Android' : /Windows/.test(s) ? 'Windows'
    : /Mac OS X|Macintosh/.test(s) ? 'macOS' : /CrOS/.test(s) ? 'ChromeOS' : /Linux/.test(s) ? 'Linux' : 'Other';
  return { device, browser, os };
}

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

let saltCache = { day: '', v: '' };
async function saltFor(env, day) {
  if (saltCache.day === day) return saltCache.v;
  let r = await env.DB.prepare('SELECT v FROM salt WHERE day=?').bind(day).first();
  if (!r) {
    const v = [...crypto.getRandomValues(new Uint8Array(24))].map((x) => x.toString(16).padStart(2, '0')).join('');
    await env.DB.prepare('INSERT OR IGNORE INTO salt(day,v) VALUES(?,?)').bind(day, v).run();
    r = await env.DB.prepare('SELECT v FROM salt WHERE day=?').bind(day).first();
  }
  saltCache = { day, v: r.v };
  return r.v;
}

function cors(origin) {
  return { 'Access-Control-Allow-Origin': ORIGINS[origin] ? origin : 'https://yksproductions.com', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}

async function collect(req, env, ctx) {
  const origin = req.headers.get('Origin') || '';
  const h = cors(origin);
  const site = ORIGINS[origin];
  const uaStr = req.headers.get('User-Agent') || '';
  if (!site || BOT.test(uaStr) || req.headers.get('DNT') === '1' || req.headers.get('Sec-GPC') === '1') return new Response(null, { status: 204, headers: h });
  const ip = req.headers.get('CF-Connecting-IP') || '';
  if (env.BEACON_RL) { try { const { success } = await env.BEACON_RL.limit({ key: ip || 'x' }); if (!success) return new Response(null, { status: 204, headers: h }); } catch (e) {} }
  let b;
  try { const t = await req.text(); if (t.length > 2000) throw 0; b = JSON.parse(t); } catch (e) { return new Response(null, { status: 204, headers: h }); }
  const k = b.k === 'pv' || b.k === 'lv' ? b.k : 'ev';
  const name = k === 'ev' ? String(b.n || '') : null;
  if (k === 'ev' && !EVENTS.has(name)) return new Response(null, { status: 204, headers: h });
  const ts = Date.now(), day = istDay(ts);
  const cf = req.cf || {};
  const u = ua(uaStr);
  const salt = await saltFor(env, day);
  const sid = (await sha(salt + '|' + ip + '|' + uaStr + '|' + site)).slice(0, 16);
  let path = cut(String(b.p || '/'), 160).replace(/[?#].*$/, '') || '/';
  let ref = cut(String(b.r || '').toLowerCase().replace(/^www\./, ''), 80);
  if (ref && /(^|\.)yksproductions\.com$/.test(ref)) ref = null;
  const u3 = Array.isArray(b.u) ? b.u : [];
  const clamp = (v, a, z) => { v = Math.round(Number(v)); return isFinite(v) ? Math.max(a, Math.min(z, v)) : null; };
  const row = [ts, day, site, k, name, cut(b.v != null ? String(b.v) : '', 40), path, ref,
    cut(u3[0] && String(u3[0]).toLowerCase(), 60), cut(u3[1] && String(u3[1]).toLowerCase(), 60), cut(u3[2] && String(u3[2]).toLowerCase(), 80),
    cut(cf.country || '', 2), cut(cf.city || '', 60), u.device, u.browser, u.os, cut(String(b.s || ''), 12), cut(String(b.l || '').toLowerCase(), 8),
    ['India', 'UAE', 'Other'].includes(b.z) ? b.z : null, sid,
    k === 'lv' ? clamp(b.d, 0, 3600) : null, k === 'lv' ? clamp(b.sc, 0, 100) : null, b.t ? 1 : 0];
  ctx.waitUntil(env.DB.prepare('INSERT INTO ev(ts,day,site,k,name,prop,path,ref,us,um,uc,country,city,device,browser,os,screen,lang,tzr,sid,dur,scroll,test) VALUES(' + row.map(() => '?').join(',') + ')').bind(...row).run().catch(() => {}));
  return new Response(null, { status: 204, headers: h });
}

/* ---------- auth ---------- */
async function authed(req, env) {
  const got = req.headers.get('X-Key') || '';
  if (!env.DASH_KEY || !got) return false;
  const a = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(got)));
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env.DASH_KEY)));
  return crypto.subtle.timingSafeEqual(a, b);
}
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

function where(q, fromTs, toTs) {
  const parts = ['ts>=?', 'ts<?'], args = [fromTs, toTs];
  if (q.site === 'main' || q.site === 'mkt') { parts.push('site=?'); args.push(q.site); }
  if (!q.test) parts.push('test=0');
  return { w: parts.join(' AND '), a: args };
}
const dayStart = (d) => Date.parse(d + 'T00:00:00Z') - IST;

async function summary(env, url) {
  const q = { site: url.searchParams.get('site') || 'all', test: url.searchParams.get('test') === '1' };
  const today = istDay(Date.now());
  const re = /^\d{4}-\d{2}-\d{2}$/;
  let from = url.searchParams.get('from'), to = url.searchParams.get('to');
  if (!re.test(to || '')) to = today;
  if (!re.test(from || '')) from = istDay(dayStart(to) - 6 * 864e5);
  if (from > to) [from, to] = [to, from];
  const F = dayStart(from), T = dayStart(to) + 864e5;
  const { w, a } = where(q, F, T);
  const VIS = "COUNT(DISTINCT day||sid)";
  const st = (sql, args = a) => env.DB.prepare(sql).bind(...args);
  const grp = (col, lim = 12, extra = '') => st(`SELECT ${col} AS key, COUNT(*) AS pv, ${VIS} AS vis FROM ev WHERE ${w} AND k='pv' ${extra} GROUP BY ${col} ORDER BY vis DESC, pv DESC LIMIT ${lim}`);
  // fixed windows for headline cards (respect site/test filters, not the picker)
  const now = Date.now(), t0 = dayStart(today);
  const win = (f) => { const x = where(q, f, now + 1); return st(`SELECT COUNT(*) AS pv, ${VIS} AS vis FROM ev WHERE ${x.w} AND k='pv'`, x.a); };
  const res = await env.DB.batch([
    st(`SELECT COUNT(*) AS pv, ${VIS} AS vis FROM ev WHERE ${w} AND k='pv'`),
    st(`SELECT day, COUNT(*) AS pv, COUNT(DISTINCT sid) AS vis FROM ev WHERE ${w} AND k='pv' GROUP BY day ORDER BY day`),
    grp('path', 20),
    st(`SELECT path AS key, SUM(dur) AS dur, AVG(scroll) AS sc FROM ev WHERE ${w} AND k='lv' GROUP BY path`),
    grp('country', 15),
    grp("city||', '||country", 15, "AND city IS NOT NULL AND city<>''"),
    grp('device', 5), grp('browser', 8), grp('os', 8), grp('screen', 6), grp('lang', 8), grp('tzr', 4),
    grp('ref', 15, 'AND ref IS NOT NULL'),
    grp("us||' / '||COALESCE(um,'-')||' / '||COALESCE(uc,'-')", 15, 'AND us IS NOT NULL'),
    st(`SELECT name, COALESCE(prop,'') AS prop, COUNT(*) AS n, ${VIS} AS vis FROM ev WHERE ${w} AND k='ev' GROUP BY name, prop ORDER BY n DESC`),
    st(`SELECT
          (SELECT ${VIS} FROM ev WHERE ${w} AND k='pv') AS visits,
          (SELECT ${VIS} FROM ev WHERE ${w} AND k='ev' AND name IN (${CTA.map(() => '?').join(',')})) AS cta,
          (SELECT ${VIS} FROM ev WHERE ${w} AND k='ev' AND name='form' AND COALESCE(prop,'')<>'waitlist') AS enq`, [...a, ...a, ...CTA, ...a]),
    st(`SELECT SUM(dur) AS dur, AVG(scroll) AS sc FROM ev WHERE ${w} AND k='lv'`),
    win(t0), win(t0 - 6 * 864e5), win(t0 - 29 * 864e5),
    grp('site', 2),
  ]);
  const r = (i) => res[i].results;
  const lv = Object.fromEntries(r(3).map((x) => [x.key, x]));
  const pages = r(2).map((p) => ({ ...p, avg: lv[p.key] && p.pv ? Math.round(lv[p.key].dur / p.pv) : null, sc: lv[p.key] ? Math.round(lv[p.key].sc) : null }));
  const tot = r(0)[0], L = r(16)[0];
  return {
    from, to, site: q.site, test: q.test,
    totals: { ...tot, avg: tot.pv ? Math.round((L.dur || 0) / tot.pv) : 0, sc: L.sc ? Math.round(L.sc) : null },
    cards: { today: r(17)[0], d7: r(18)[0], d30: r(19)[0] },
    trend: r(1), pages, countries: r(4), cities: r(5), devices: r(6), browsers: r(7), os: r(8), screens: r(9), langs: r(10), tz: r(11),
    refs: r(12), utm: r(13), events: r(14), funnel: r(15)[0], sites: r(20),
  };
}

async function live(env, url) {
  const q = { site: url.searchParams.get('site') || 'all', test: url.searchParams.get('test') === '1' };
  const now = Date.now(), { w, a } = where(q, now - 30 * 60000, now + 1);
  const st = (sql) => env.DB.prepare(sql).bind(...a);
  const res = await env.DB.batch([
    st(`SELECT COUNT(DISTINCT sid) AS vis, SUM(k='pv') AS pv, SUM(k='ev') AS ev FROM ev WHERE ${w}`),
    st(`SELECT path AS key, COUNT(*) AS pv FROM ev WHERE ${w} AND k='pv' GROUP BY path ORDER BY pv DESC LIMIT 8`),
    st(`SELECT country AS key, COUNT(DISTINCT sid) AS vis FROM ev WHERE ${w} GROUP BY country ORDER BY vis DESC LIMIT 8`),
    st(`SELECT ts, site, k, name, prop, path, country, city, device FROM ev WHERE ${w} AND k IN ('pv','ev') ORDER BY ts DESC LIMIT 25`),
  ]);
  return { now, totals: res[0].results[0], pages: res[1].results, countries: res[2].results, recent: res[3].results };
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req.headers.get('Origin') || '') });
    if (p === '/c' && req.method === 'POST') return collect(req, env, ctx);
    if (p === '/dashboard' || p === '/dashboard/') return new Response(DASH, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' } });
    if (p.startsWith('/api/')) {
      if (!(await authed(req, env))) return J({ error: 'unauthorised' }, 401);
      try {
        if (p === '/api/summary') return J(await summary(env, url));
        if (p === '/api/live') return J(await live(env, url));
      } catch (e) { return J({ error: 'query failed' }, 500); }
    }
    if (p === '/robots.txt') return new Response('User-agent: *\nDisallow: /\n');
    return new Response('yks-stats', { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  },
  async scheduled(ev, env) {
    const today = istDay(Date.now());
    await env.DB.batch([
      env.DB.prepare('DELETE FROM salt WHERE day<?').bind(today),
      env.DB.prepare('DELETE FROM ev WHERE ts<?').bind(Date.now() - 400 * 864e5),
    ]);
  },
};

/* ---------- private dashboard (static shell; every number comes from /api/* with the key) ---------- */
const DASH = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer">
<title>YKS Stats</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--ink:#16161a;--mut:#6b6b74;--line:#e7e5e0;--acc:#ff7a1a;--acc2:#1f8a70;--soft:#fff3ea}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14.5px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif}
header{position:sticky;top:0;z-index:5;background:rgba(246,245,242,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.bar{max-width:1180px;margin:0 auto;padding:10px 14px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
h1{font-size:17px;margin:0 8px 0 0;letter-spacing:-.01em}h1 b{color:var(--acc)}
.seg{display:inline-flex;background:#ebe9e4;border-radius:10px;padding:3px}
.seg button{border:0;background:none;padding:6px 10px;border-radius:8px;font:inherit;font-size:13px;color:var(--mut);cursor:pointer}
.seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}
select,input[type=date]{font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:#fff}
.sp{flex:1}.mut{color:var(--mut)}.sm{font-size:12px}
main{max-width:1180px;margin:0 auto;padding:14px}
.grid{display:grid;gap:12px;grid-template-columns:repeat(12,1fr)}
.c{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;grid-column:span 12;min-width:0}
@media(min-width:760px){.s6{grid-column:span 6}.s4{grid-column:span 4}.s8{grid-column:span 8}.s3{grid-column:span 3}}
@media(min-width:520px) and (max-width:759px){.s3{grid-column:span 6}}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin:0 0 10px;font-weight:600}
.big{font-size:28px;font-weight:700;letter-spacing:-.02em;line-height:1.1}.big small{font-size:13px;font-weight:500;color:var(--mut);margin-left:4px}
.kv{display:flex;gap:18px;flex-wrap:wrap}
table{width:100%;border-collapse:collapse;font-size:13.5px}td,th{padding:6px 4px;border-bottom:1px solid #f0eee9;text-align:right;white-space:nowrap}
td:first-child,th:first-child{text-align:left;white-space:normal;word-break:break-all;width:100%}th{font-size:11px;color:var(--mut);font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.rowbar{position:relative}.rowbar i{position:absolute;left:0;top:3px;bottom:3px;background:var(--soft);border-radius:4px;z-index:0}.rowbar span{position:relative;z-index:1}
tr.hl td{font-weight:600}tr.hl td:first-child span:after{content:" ★";color:var(--acc)}
.ev{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.ev div{background:#faf9f7;border:1px solid var(--line);border-radius:12px;padding:10px}.ev b{display:block;font-size:22px}.ev span{font-size:12px;color:var(--mut)}
.fun .st{margin:8px 0}.fun .tr{height:26px;background:#f0eee9;border-radius:7px;overflow:hidden}.fun .tr i{display:block;height:100%;background:linear-gradient(90deg,var(--acc),#ffb37a);border-radius:7px}
.fun .lb{display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px}
.live{border-color:#bfe3d6}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--acc2);margin-right:6px;animation:p 1.6s infinite}@keyframes p{50%{opacity:.3}}
.feed{max-height:260px;overflow:auto;font-size:13px}.feed div{padding:5px 0;border-bottom:1px dashed #eee;display:flex;gap:8px}.feed time{color:var(--mut);min-width:44px}
.tag{display:inline-block;font-size:11px;padding:1px 6px;border-radius:6px;background:#eef6f3;color:var(--acc2)}.tag.e{background:var(--soft);color:#b5530c}
svg{width:100%;height:auto;display:block}.empty{color:var(--mut);font-size:13px;padding:6px 0}
#gate{max-width:380px;margin:12vh auto;padding:20px;text-align:center}#gate input{width:100%;padding:10px;border:1px solid var(--line);border-radius:10px;font:inherit;margin:10px 0}
#gate button,.btn{background:var(--ink);color:#fff;border:0;border-radius:10px;padding:9px 16px;font:inherit;cursor:pointer}
.note{font-size:12px;color:var(--mut);margin-top:14px;text-align:center}
</style></head><body>
<div id="gate" hidden><h1>YKS <b>Stats</b></h1><p class="mut">Private dashboard. Enter the access key.</p><input id="gk" type="password" autocomplete="off"><button id="gb">Open</button><p id="ge" class="mut sm"></p></div>
<div id="app" hidden>
<header><div class="bar">
<h1>YKS <b>Stats</b></h1>
<div class="seg" id="site"><button data-v="all" class="on">All</button><button data-v="main">yksproductions.com</button><button data-v="mkt">marketing.</button></div>
<div class="sp"></div>
<select id="rng"><option value="0">Today</option><option value="y">Yesterday</option><option value="6" selected>Last 7 days</option><option value="29">Last 30 days</option><option value="89">Last 90 days</option><option value="c">Custom…</option></select>
<span id="cust" hidden><input type="date" id="df"> – <input type="date" id="dt"></span>
</div></header>
<main><div class="grid">
<div class="c s4"><h2>Today</h2><div class="kv"><div><div class="big" id="t_v">–</div><span class="mut sm">visitors</span></div><div><div class="big" id="t_p">–</div><span class="mut sm">pageviews</span></div></div></div>
<div class="c s4"><h2>Last 7 days</h2><div class="kv"><div><div class="big" id="w_v">–</div><span class="mut sm">visitors</span></div><div><div class="big" id="w_p">–</div><span class="mut sm">pageviews</span></div></div></div>
<div class="c s4"><h2>Last 30 days</h2><div class="kv"><div><div class="big" id="m_v">–</div><span class="mut sm">visitors</span></div><div><div class="big" id="m_p">–</div><span class="mut sm">pageviews</span></div></div></div>
<div class="c s8"><h2 id="rl">Visitors &amp; pageviews</h2><div class="kv" style="margin-bottom:8px"><div><div class="big" id="r_v">–</div><span class="mut sm">visitors</span></div><div><div class="big" id="r_p">–</div><span class="mut sm">pageviews</span></div><div><div class="big" id="r_t">–</div><span class="mut sm">avg time / page</span></div><div><div class="big" id="r_s">–</div><span class="mut sm">avg scroll</span></div></div><div id="chart"></div></div>
<div class="c s4 live"><h2><span class="dot"></span>Last 30 minutes</h2><div class="kv"><div><div class="big" id="l_v">–</div><span class="mut sm">visitors</span></div><div><div class="big" id="l_p">–</div><span class="mut sm">pageviews</span></div><div><div class="big" id="l_e">–</div><span class="mut sm">actions</span></div></div><div id="l_c" class="sm mut" style="margin:8px 0"></div><div class="feed" id="l_f"></div></div>
<div class="c"><h2>Actions</h2><div class="ev" id="evs"></div></div>
<div class="c s6 fun"><h2>Conversion funnel</h2><div id="fun"></div><p class="sm mut">Visitors (daily) → clicked WhatsApp / Call / Email / a smart CTA / opened chat → sent an enquiry or application.</p></div>
<div class="c s6"><h2>Simulator &amp; smart features</h2><div id="sim"></div></div>
<div class="c s8"><h2>Top pages</h2><div id="pages"></div></div>
<div class="c s4"><h2>Site</h2><div id="sites"></div><h2 style="margin-top:14px">Timezone region</h2><div id="tz"></div></div>
<div class="c s6"><h2>Countries</h2><div id="countries"></div></div>
<div class="c s6"><h2>Cities</h2><div id="cities"></div></div>
<div class="c s3"><h2>Devices</h2><div id="devices"></div></div>
<div class="c s3"><h2>Browsers</h2><div id="browsers"></div></div>
<div class="c s3"><h2>OS</h2><div id="os"></div></div>
<div class="c s3"><h2>Screen &amp; language</h2><div id="screens"></div><div id="langs" style="margin-top:10px"></div></div>
<div class="c s6"><h2>Referrers</h2><div id="refs"></div></div>
<div class="c s6"><h2>Campaigns (UTM source / medium / campaign)</h2><div id="utm"></div></div>
</div>
<p class="note">Cookieless and anonymous: no IP addresses, no personal data, no form contents. Visitors are counted per day. Times are India time (IST). <label><input type="checkbox" id="tst"> show test traffic</label> · <a href="#" id="lo">forget key on this device</a></p>
</main></div>
<script>
(function(){
var API=location.origin,K='',S={site:'all',from:'',to:'',test:0},$=function(i){return document.getElementById(i)};
var NAMES={IN:'India',AE:'UAE',US:'United States',GB:'United Kingdom',SA:'Saudi Arabia',QA:'Qatar',OM:'Oman',KW:'Kuwait',BH:'Bahrain',SG:'Singapore',AU:'Australia',CA:'Canada',DE:'Germany',FR:'France',NL:'Netherlands',PK:'Pakistan',LK:'Sri Lanka',NP:'Nepal',BD:'Bangladesh',MY:'Malaysia',IE:'Ireland',XX:'Unknown',T1:'Tor'};
function flag(c){if(!c||c.length!==2||c==='XX'||c==='T1')return '';return String.fromCodePoint.apply(null,c.toUpperCase().split('').map(function(x){return 127397+x.charCodeAt(0)}))}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function n(x){x=+x||0;return x>=1e4?(x/1e3).toFixed(1)+'k':x.toLocaleString('en-IN')}
function secs(s){if(s==null)return '–';s=Math.round(s);return s<60?s+'s':Math.floor(s/60)+'m '+(s%60)+'s'}
function ist(ts){return new Date(ts+19800000).toISOString()}
function today(){return ist(Date.now()).slice(0,10)}
function shift(d,k){var t=Date.parse(d+'T12:00:00Z')+k*864e5;return new Date(t).toISOString().slice(0,10)}
function get(p){var q='site='+S.site+'&test='+S.test+(S.from?'&from='+S.from+'&to='+S.to:'');return fetch(API+p+'?'+q,{headers:{'X-Key':K},cache:'no-store'}).then(function(r){if(r.status===401){gate('That key did not work.');throw 0}return r.json()})}
function tbl(rows,o){o=o||{};if(!rows||!rows.length)return '<div class="empty">No data yet</div>';var mx=Math.max.apply(null,rows.map(function(r){return r.vis||r.pv||0}))||1;
 var h='<table><tr><th>'+(o.h||'')+'</th><th>Visitors</th><th>Views</th>'+(o.x?'<th>Avg time</th><th>Scroll</th>':'')+'</tr>';
 rows.forEach(function(r){var k=r.key==null||r.key===''?'(none)':r.key,lab=o.f?o.f(k):esc(k),hl=o.hl&&o.hl(k);
  h+='<tr'+(hl?' class="hl"':'')+'><td class="rowbar"><i style="width:'+Math.max(2,Math.round((r.vis||r.pv)/mx*100))+'%"></i><span>'+lab+'</span></td><td>'+n(r.vis)+'</td><td>'+n(r.pv)+'</td>'+(o.x?'<td>'+secs(r.avg)+'</td><td>'+(r.sc==null?'–':r.sc+'%')+'</td>':'')+'</tr>'});
 return h+'</table>'}
function chart(tr,from,to){var days=[],d=from,i=0;while(d<=to&&i<400){days.push(d);d=shift(d,1);i++}
 var m={};tr.forEach(function(r){m[r.day]=r});var W=720,H=200,P=28,mx=1;days.forEach(function(x){var r=m[x];if(r)mx=Math.max(mx,r.pv,r.vis)});
 var bw=(W-P*2)/days.length,s='<svg viewBox="0 0 '+W+' '+(H+24)+'" role="img" aria-label="trend">';
 for(var g=0;g<=4;g++){var y=P/2+(H-P)*(g/4);s+='<line x1="'+P+'" x2="'+(W-P)+'" y1="'+y+'" y2="'+y+'" stroke="#eee"/><text x="'+(P-6)+'" y="'+(y+4)+'" font-size="10" fill="#999" text-anchor="end">'+Math.round(mx*(1-g/4))+'</text>'}
 var pts=[];days.forEach(function(x,j){var r=m[x]||{pv:0,vis:0},bh=(H-P)*(r.pv/mx),cx=P+bw*j+bw/2;
  s+='<rect x="'+(P+bw*j+bw*.18)+'" y="'+(P/2+(H-P)-bh)+'" width="'+(bw*.64)+'" height="'+bh+'" rx="2" fill="#ffd9bd"><title>'+x+': '+r.pv+' views, '+r.vis+' visitors</title></rect>';
  pts.push(cx+','+(P/2+(H-P)*(1-r.vis/mx)));
  var every=Math.ceil(days.length/8);if(j%every===0)s+='<text x="'+cx+'" y="'+(H+12)+'" font-size="10" fill="#888" text-anchor="middle">'+x.slice(5)+'</text>'});
 s+='<polyline fill="none" stroke="#ff7a1a" stroke-width="2.5" stroke-linejoin="round" points="'+pts.join(' ')+'"/>';
 pts.forEach(function(p){var a=p.split(',');s+='<circle cx="'+a[0]+'" cy="'+a[1]+'" r="'+(days.length>45?1.5:3)+'" fill="#ff7a1a"/>'});
 return s+'<text x="'+(W-P)+'" y="'+(H+24)+'" font-size="10" fill="#888" text-anchor="end">bars = pageviews · line = visitors</text></svg>'}
var EVL=[['wa','','WhatsApp clicks'],['call','','Call clicks'],['email','','Email clicks'],['form','client','Client enquiries'],['form','talent','Talent applications'],['form','talent_routed','Enquiries routed to talent'],['form','waitlist','Waitlist sign-ups'],['chat_open','','Chat opened'],['chat_msg','','Chat messages'],['search','','Searches'],['adsim','*','Simulator used'],['adsim_brand','*','Brand sim run'],['exit_shown','','Exit nudge shown'],['exit_click','','Exit nudge clicked'],['cta','*','Smart CTA clicks']];
function evsum(evs,name,prop){var t=0,v=0;evs.forEach(function(e){if(e.name===name&&(prop==='*'||prop===''||e.prop===prop)){t+=e.n;v+=e.vis}});return{n:t,v:v}}
function render(d){
 $('t_v').textContent=n(d.cards.today.vis);$('t_p').textContent=n(d.cards.today.pv);$('w_v').textContent=n(d.cards.d7.vis);$('w_p').textContent=n(d.cards.d7.pv);$('m_v').textContent=n(d.cards.d30.vis);$('m_p').textContent=n(d.cards.d30.pv);
 $('rl').textContent='Visitors & pageviews · '+(d.from===d.to?d.from:d.from+' → '+d.to);
 $('r_v').textContent=n(d.totals.vis);$('r_p').textContent=n(d.totals.pv);$('r_t').textContent=secs(d.totals.avg);$('r_s').textContent=d.totals.sc==null?'–':d.totals.sc+'%';
 $('chart').innerHTML=chart(d.trend,d.from,d.to);
 $('evs').innerHTML=EVL.map(function(x){var s=evsum(d.events,x[0],x[1]);return '<div><b>'+n(s.n)+'</b><span>'+x[2]+(s.v?' · '+s.v+' visitor'+(s.v>1?'s':''):'')+'</span></div>'}).join('');
 var f=d.funnel||{},V=f.visits||0,st=[['Visitors',V],['Clicked a CTA',f.cta||0],['Sent enquiry / application',f.enq||0]];
 $('fun').innerHTML=st.map(function(x){var p=V?Math.round(x[1]/V*1000)/10:0;return '<div class="st"><div class="lb"><span>'+x[0]+'</span><b>'+n(x[1])+' <span class="mut sm">'+(V?p+'%':'')+'</span></b></div><div class="tr"><i style="width:'+(V?Math.max(1,p):0)+'%"></i></div></div>'}).join('');
 var sim=d.events.filter(function(e){return /^adsim|^cta$|^exit/.test(e.name)}).map(function(e){return{key:({adsim:'Simulator',adsim_brand:'Brand sim',cta:'Smart CTA',exit_shown:'Exit nudge shown',exit_click:'Exit nudge clicked'}[e.name]||e.name)+(e.prop?' · '+e.prop:''),vis:e.vis,pv:e.n}});
 $('sim').innerHTML=sim.length?tbl(sim,{h:'Feature'}).replace('<th>Views</th>','<th>Times</th>'):'<div class="empty">No simulator or smart-feature use yet</div>';
 $('pages').innerHTML=tbl(d.pages,{h:'Page',x:1});
 $('sites').innerHTML=tbl(d.sites,{h:'Site',f:function(k){return k==='mkt'?'marketing.yksproductions.com':'yksproductions.com'}});
 $('tz').innerHTML=tbl(d.tz,{h:'Region',hl:function(k){return k==='India'||k==='UAE'}});
 var cf=function(k){return flag(k)+' '+esc(NAMES[k]||k)};
 $('countries').innerHTML=tbl(d.countries,{h:'Country',f:cf,hl:function(k){return k==='AE'||k==='IN'}});
 $('cities').innerHTML=tbl(d.cities,{h:'City',f:function(k){var a=k.split(', ');return esc(a[0])+' <span class="mut sm">'+flag(a[1])+'</span>'},hl:function(k){return / (AE|IN)$/.test(k)}});
 $('devices').innerHTML=tbl(d.devices,{h:'Device'});$('browsers').innerHTML=tbl(d.browsers,{h:'Browser'});$('os').innerHTML=tbl(d.os,{h:'OS'});
 $('screens').innerHTML=tbl(d.screens,{h:'Screen width'});$('langs').innerHTML=tbl(d.langs,{h:'Language'});
 $('refs').innerHTML=tbl(d.refs,{h:'Referrer (direct not shown)'});$('utm').innerHTML=tbl(d.utm,{h:'Campaign'});
}
var LBL={wa:'WhatsApp click',call:'Call click',email:'Email click',form:'Form sent',chat_open:'Chat opened',chat_msg:'Chat message',search:'Search',adsim:'Simulator',adsim_brand:'Brand sim',exit_shown:'Exit nudge shown',exit_click:'Exit nudge clicked',cta:'Smart CTA'};
function renderLive(d){$('l_v').textContent=n(d.totals.vis);$('l_p').textContent=n(d.totals.pv||0);$('l_e').textContent=n(d.totals.ev||0);
 $('l_c').innerHTML=d.countries.map(function(c){return flag(c.key)+' '+esc(NAMES[c.key]||c.key||'?')+' '+c.vis}).join(' · ');
 $('l_f').innerHTML=d.recent.length?d.recent.map(function(r){return '<div><time>'+ist(r.ts).slice(11,16)+'</time><span>'+(r.k==='pv'?'<span class="tag">view</span> ':'<span class="tag e">'+esc(LBL[r.name]||r.name)+(r.prop?' · '+esc(r.prop):'')+'</span> ')+esc((r.site==='mkt'?'marketing.':'')+r.path)+' <span class="mut sm">'+flag(r.country)+' '+esc(r.city||'')+' · '+esc(r.device||'')+'</span></span></div>'}).join(''):'<div class="empty">Nobody in the last 30 minutes</div>'}
function load(){get('/api/summary').then(render).catch(function(){});loadLive()}
function loadLive(){get('/api/live').then(renderLive).catch(function(){})}
function setRange(){var v=$('rng').value,t=today();$('cust').hidden=v!=='c';
 if(v==='c'){if(!$('df').value){$('df').value=shift(t,-13);$('dt').value=t}S.from=$('df').value;S.to=$('dt').value}
 else if(v==='y'){S.from=S.to=shift(t,-1)}else{S.from=shift(t,-(+v));S.to=t}load()}
function gate(msg){$('app').hidden=true;$('gate').hidden=false;$('ge').textContent=msg||''}
function start(){$('gate').hidden=true;$('app').hidden=false;setRange();setInterval(loadLive,30000)}
var u=new URL(location.href),qk=u.searchParams.get('key');
if(qk){try{sessionStorage.setItem('yks_dk',qk)}catch(e){}u.searchParams.delete('key');history.replaceState(null,'',u.pathname+u.search)}
try{K=qk||sessionStorage.getItem('yks_dk')||localStorage.getItem('yks_dk')||''}catch(e){K=qk||''}
try{if(K)localStorage.setItem('yks_dk',K)}catch(e){}
$('gb').onclick=function(){K=$('gk').value.trim();try{localStorage.setItem('yks_dk',K)}catch(e){}start()};
$('lo').onclick=function(e){e.preventDefault();try{localStorage.removeItem('yks_dk');sessionStorage.removeItem('yks_dk')}catch(x){}K='';gate('Key forgotten on this device.')};
[].forEach.call(document.querySelectorAll('#site button'),function(b){b.onclick=function(){[].forEach.call(document.querySelectorAll('#site button'),function(x){x.classList.toggle('on',x===b)});S.site=b.getAttribute('data-v');load()}});
$('rng').onchange=setRange;$('df').onchange=$('dt').onchange=setRange;$('tst').onchange=function(){S.test=this.checked?1:0;load()};
if(K)start();else gate();
})();
</script></body></html>
`;

