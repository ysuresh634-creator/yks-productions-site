# yks-follow-check

`POST /check {"handle":"@name"}` → `{"follows": true | false | null}` — does the handle follow @yks_photoworks.
CORS: only https://yksproductions.com. Rate limit: 8 checks / IP / minute (Cache API). Results cached
(true ~10 min, false 20 s so a new follower can retry straight away; null never cached).

Deploy (needs `wrangler login` or CLOUDFLARE_API_TOKEN on the box):

    cd workers/follow-check
    npx wrangler@3 deploy
    printf %s "$IG_SESSIONID" | npx wrangler@3 secret put IG_SESSIONID      # required
    printf %s "$IG_DS_USER_ID" | npx wrangler@3 secret put IG_DS_USER_ID    # optional
    printf %s "$IG_CSRFTOKEN"  | npx wrangler@3 secret put IG_CSRFTOKEN     # optional

The session must be a logged-in web session of @yks_photoworks (or any account that can see its
followers list). When the session expires or Instagram challenges it, the worker returns null and the
site lets applications through marked [REVIEW] "Follow check unavailable".
