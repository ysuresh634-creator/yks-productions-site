# yks-stats — anonymous visit counting + private dashboard

Cloudflare Worker `yks-stats` (free tier) at https://yks-stats.ysuresh634.workers.dev

- `POST /c` receives beacons from `/js/stats.js` (yksproductions.com and marketing.yksproductions.com only).
- `GET /dashboard` is the private dashboard. The data API needs the access key (worker secret `DASH_KEY`);
  the full dashboard link with the key is kept outside the repo.
- Storage: D1 database `yks-stats` (`schema.sql`). Rows hold page path, referrer domain, UTM tags,
  country/city (Cloudflare edge geo), device/browser/OS family, screen bucket, language, timezone region,
  time on page, scroll depth and event names. **No IP, no user-agent string, no cookies, no form contents,
  no search terms, no chat text.** Visitors are counted with a hash of (daily random salt, IP, UA, site); the
  salt is deleted after the IST day (cron), so the hash can't be reversed or linked across days.
- Off for Do Not Track / Global Privacy Control, bots, and when the privacy page's "Turn it off" is used
  (`localStorage.yks_smart_off = '1'`, or `?personalise=off` on any page).

Exclude your own devices: open any page once with `?yks_stats=me` (rows are then flagged `test=1`,
hidden from the dashboard unless "show test traffic" is ticked). `?yks_stats_test=1` flags one tab session.

Events (`k='ev'`, `name` / `prop`): `wa`, `call`, `email`, `form` (`client` | `talent_routed` | `talent` | `waitlist`),
`chat_open`, `chat_msg`, `search`, `adsim` (platform or `planner`), `adsim_brand`, `exit_shown`, `exit_click`,
`cta` (`sticky` | `rec` | `hero`). Other scripts can call `YKSStats.track(name, prop)` or dispatch
`yks:adsim` with `{platform, brand:true}` when the brand simulator runs.

Deploy (mirrors worker/):

    cd stats-worker && mkdir -p node_modules && echo '{}' > package.json && npx --yes wrangler deploy

First-time setup (already done): `npx wrangler d1 create yks-stats`,
`npx wrangler d1 execute yks-stats --remote --file schema.sql`, `npx wrangler secret put DASH_KEY`.

Clean test rows: `npx wrangler d1 execute yks-stats --remote --command "DELETE FROM ev WHERE test=1"`.
