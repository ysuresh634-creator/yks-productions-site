-- yks-stats D1 schema. Anonymous, aggregate-only: no IP, no user agent string, no cookies, no form contents.
CREATE TABLE IF NOT EXISTS ev (
  id      INTEGER PRIMARY KEY,
  ts      INTEGER NOT NULL,      -- epoch ms
  day     TEXT    NOT NULL,      -- YYYY-MM-DD in India time (IST)
  site    TEXT    NOT NULL,      -- 'main' | 'mkt'
  k       TEXT    NOT NULL,      -- 'pv' pageview, 'lv' page left (time/scroll), 'ev' event
  name    TEXT,                  -- event name (k='ev')
  prop    TEXT,                  -- event detail (form type, platform, cta kind)
  path    TEXT,
  ref     TEXT,                  -- referrer domain only
  us      TEXT, um TEXT, uc TEXT,-- utm_source / utm_medium / utm_campaign
  country TEXT, city TEXT,
  device  TEXT, browser TEXT, os TEXT, screen TEXT, lang TEXT, tzr TEXT,
  sid     TEXT,                  -- daily-rotating salted hash (salt deleted after the day) -> no persistent ID
  dur     INTEGER,               -- seconds of visible time (k='lv')
  scroll  INTEGER,               -- max scroll depth % (k='lv')
  test    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ev_ts   ON ev(ts);
CREATE INDEX IF NOT EXISTS ev_site ON ev(site, ts);
CREATE TABLE IF NOT EXISTS salt (day TEXT PRIMARY KEY, v TEXT NOT NULL);
