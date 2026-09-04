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

**Bio** (Instagram's limit is 150 characters and it counts emoji generously —
this is 146. Measure before editing; the previous version shipped at 161 and
would have been truncated):
```
Photographer · Videographer · Cinematographer
Film stills: Soothravakyam · Baby Girl · FEFKA
Dubai · Bangalore
Property films · Fashion · Weddings
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

---
---

# Meta & WhatsApp — copy to paste

Same rule as above: **paste verbatim.** These are citation sources, and a
citation only counts when the name, number and description match what the
site says. Paraphrasing breaks the match.

---

## Facebook Page

| Field | Value |
|---|---|
| **Page name** | `YKS Productions` |
| **Username** | `@yksproductions` |
| **Category** | Photographer *(add second: Videographer)* |
| **Website** | `https://yksproductions.com` |
| **Phone** | `+971 50 195 5122` |
| **Email** | `ysuresh634@gmail.com` |
| **Button** | WhatsApp — or "Book Now" → `https://yksproductions.com/quote.html` |

**Short description** (255 char limit):
```
Film-trained photographer, videographer and cinematographer working between Dubai and Bangalore. Property films, weddings, fashion editorial, brand campaigns and portraits.
```

**About / long description:**
```
Yedukrishna Suresh — photographer, videographer and cinematographer, working between Dubai and Bangalore.

Unit still photographer on the Malayalam features Soothravakyam and Baby Girl; member, FEFKA Still Photographers Union.

I shoot both the stills and the film myself, so a shoot comes back looking like one piece of work rather than two. Cinematic real-estate films, weddings, fashion editorial, brand campaigns, portraits and events across India and the UAE.

Every project is quoted as one all-in number covering the shoot and the edit — no hidden extras.

yksproductions.com
```

**Service area:** Dubai · Abu Dhabi · Bangalore · Mumbai · Kochi — not a
street address. You're a service-area business; a fake address is what
gets a page flagged.

---

## WhatsApp Business — profile

| Field | Value |
|---|---|
| **Business name** | `YKS Productions` |
| **Category** | Photographer |
| **Website** | `https://yksproductions.com` |
| **Email** | `ysuresh634@gmail.com` |
| **Address** | leave blank — set a service area instead |

**Description** (139 char limit — this is tight, it's counted):
```
Photographer & videographer, Dubai + Bangalore. Property films, weddings, fashion, brand. Film stills: Soothravakyam, Baby Girl.
```

**Away message:**
```
Thanks for messaging — I'm likely on a shoot. I'll reply as soon as I'm off set, usually within a few hours. If it's urgent, say so and I'll jump on it.
```

**Greeting message** (first-time contacts):
```
Hi, Yedukrishna here. Tell me what you're shooting, where, and roughly when — and I'll come back with one all-in number covering the shoot and the edit.
```

---

## WhatsApp catalogue

Browsable like a menu. **No prices** — every item ends the same way, so the
conversation stays where you quote it.

| Item | Description |
|---|---|
| **Real estate film** | Cinematic walkthrough, twilight exteriors and vertical cuts for the portals. Shot to make a listing sell faster. |
| **Real estate photography** | Listing stills with corrected verticals and true-to-life light. Furnished or empty. |
| **Wedding photography** | Candid, ceremony and couple work — Indian, expat, multicultural and destination. |
| **Wedding film** | A cinematic film of the day, plus a same-day edit to play at the reception. |
| **Brand & corporate film** | Company films, product and explainer videos, founder and testimonial films. Concept and scripting included. |
| **Corporate headshots** | On-site, portable studio brought to the office. Roughly 5–10 minutes per person, everyone matched. |
| **Fashion & editorial** | Lookbooks, campaigns and portfolios — styled like a campaign, lit like a film. |
| **Portraits** | Personal branding, actor and model portfolios. |
| **Event coverage** | Conferences, launches, galas and award nights. Same-day highlights available. |
| **Food & hospitality** | Full menus, hero dishes and delivery-app imagery. Shot on location before service. |
| **Social content** | Monthly content batches, cinema-grade reels and UGC-style ad content. |

Closing line on every item:
```
Quoted as one all-in number covering the shoot and the edit. Message me what you're planning.
```

---

## WhatsApp Channel

Channels are **publicly searchable inside WhatsApp** — a discovery surface
almost no photographer uses.

| Field | Value |
|---|---|
| **Name** | `YKS Productions — Photography` |
| **Description** | `New work from Yedukrishna Suresh — property films, weddings and brand shoots across Dubai and Bangalore. yksproductions.com` |

Post the same reels you put on Instagram. It costs one extra upload and
puts you in a search index nobody else is competing in yet.

---

## Instagram — the two free wins nobody uses

**Alt text.** Every post: Advanced Settings → Write alt text. It's indexed
and almost nobody fills it in.
```
Cinematic real estate film of a Dubai Marina apartment, shot at twilight by YKS Productions.
```

**Captions are searchable text now**, not just hashtag carriers. Write the
words a client would type:
> *"Wedding photography in Dubai — a church ceremony in the afternoon light…"*

not

> *"Vibes ✨ #wedding #dubai"*

---

## The consistency rule

Google and AI treat a business as one entity only when name, phone and
description match across sources. Keep these identical everywhere:

| | |
|---|---|
| Name | **YKS Productions** |
| Person | **Yedukrishna Suresh** |
| Phone (UAE) | **+971 50 195 5122** |
| Phone (India) | **+91 97466 79720** |
| Website | **https://yksproductions.com** |
| Email | **ysuresh634@gmail.com** |

One inconsistent phone number across two profiles is enough to stop them
merging into a single entity.
