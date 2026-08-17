# Profile copy — make every platform say the same thing

The reason nothing corroborates you is that four sources describe four
different people. Paste these verbatim so a machine can match them.

Name is always **Yedukrishna Suresh** — never "YK S", never initials.

---

## Instagram — @yks_photoworks

**Name field** (this is the one that's currently wrong — it says "YK S"):
```
Yedukrishna Suresh
```

**Bio:**
```
Photographer · Videographer · Cinematographer
Film stills — Soothravakyam, Baby Girl · FEFKA
Dubai 🇦🇪 · Bangalore 🇮🇳
Property films · Weddings · Fashion · Brands
```

**Link:**
```
yksproductions.com/links
```
Your own bio page, on your own domain — everything Linktree did, one hop
shorter, and the traffic and the ranking signal stay with you. Add
`?utm_source=instagram&utm_medium=bio` on the end if you want to see it
separated out in GA4.

---

## Behance — BOTH profiles

You have two accounts. Give them the same headline and the same link so
they resolve to one person instead of two.

- behance.net/yedusuresha14c
- behance.net/ysuresh634f0a1

**Headline:**
```
Photographer, Videographer & Cinematographer — YKS Productions
```

**Location:** `Bangalore, India`

**Website:** `https://yksproductions.com`  ← not linktr.ee, on both

**About:**
```
Film-trained photographer, videographer and cinematographer working
between Bangalore and Dubai. Unit still photographer on the Malayalam
features Soothravakyam and Baby Girl; member, FEFKA Still Photographers
Union. Shoots cinematic real-estate films, weddings, fashion editorial,
brand campaigns and portraits across India and the UAE.
```

---

## Vimeo — vimeo.com/yksproductions

**Name:** `Yedukrishna Suresh`
**Bio:** same About paragraph as Behance
**Link:** `https://yksproductions.com`

---

## Why the exact wording matters

Search engines and AI build a person-entity by matching a consistent
name, role and set of cross-linked profiles. The site now declares all
five profiles as the same person via schema `sameAs` — but that only
holds if the profiles agree back. Paraphrasing breaks the match; pasting
verbatim makes it.

---

## Link architecture — everything points at the website

The site is the hub. Every other profile is a spoke that points back to it.
Right now Behance points at Linktree, so the signal stops at an aggregator
that has nothing your site doesn't.

```
                    yksproductions.com
                    (the only hub)
                          ▲
        ┌─────────┬───────┴───────┬─────────┐
        │         │               │         │
   Instagram   Behance A      Behance B   Vimeo
                                            
                     Linktree ──────────────┘
                (a spoke, not a hub — point it
                 at the site and stop feeding it)
```

**Change on each platform — the website URL, nothing else:**

| Platform | Set the link to |
|---|---|
| Instagram bio | `yksproductions.com/links` |
| Behance A (yedusuresha14c) | `https://yksproductions.com` |
| Behance B (ysuresh634f0a1) | `https://yksproductions.com` |
| Vimeo | `https://yksproductions.com` |
| Linktree — top link | `https://yksproductions.com/links` |

**Already done on the site:** it no longer links out to Linktree from the
social row or the footer — those were sending visitors away to a page
that only sends them back. Linktree stays in the schema `sameAs`, which
is correct: that declares the profile as yours without feeding it traffic.
Vimeo took its place in the social row.

**Keep Linktree or not?** Keep it — it costs nothing and it's another
profile carrying your name. Just make its first link the website, so
anyone arriving from an old bio link lands on the real thing.
