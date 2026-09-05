# Adding talent to the roster

There are two ways in. Both end in the same place — an entry in
`_data/roster.json` — because that file is the only source of truth and the
build is the only thing that writes a published page.

## The bulk desk (phone, many at once)

On the live site: **yksproductions.com/talents#owner** — or tap the roster
kicker ("The Edit · Volume 01") five times. It asks for the Talents Engine
passcode, then opens a private console that is not in the page's HTML at all.

Three ways to feed it:

- **Paste rows** — copy straight out of Sheets, Excel or Numbers, headings and
  all. It works out which column is which and shows you the mapping to correct.
  A block of `Name: …` lines per person, blank line between, works too — that
  is how they arrive on WhatsApp.
- **Photos, dragged in from anywhere** — Finder, Photos, a Files app, another
  browser tab, a WhatsApp Web thread. Drop them on any part of the panel: files
  named `priya-01.jpg`, `priya-02.jpg` group themselves into one person, a set
  dragged off one web page becomes one, and camera or screenshot filenames are
  ignored rather than used as a name. Drop onto a talent card to add to that
  person, drag a thumbnail from one card to another to move it, tap a thumbnail
  to make it the cover, ⌘V for a copied image. On a phone the picker opens the
  camera roll instead. Pictures dragged off a web page arrive as a URL, not
  bytes — those are pulled into our own Cloudinary on push, so a roster plate is
  never a hotlink to something that can vanish.
- **Applications** — everyone in the pipeline, filtered by *Waiting* / *On the
  roster* / *Everyone*. Each row carries **Open · Verify · Delete**: *Verify*
  opens everything they sent inside the row — every photo, their Instagram, the
  private contact, what they wrote — with *Publish this one* and *Turn down*
  underneath, so checking somebody costs no scrolling. *Delete* erases that one
  person. Tapping a row ticks it, and the buttons at the bottom count what they
  will act on. Tick several and **Publish**, **Turn down** (out of the
  pipeline, record kept) or **Delete forever** (record destroyed, roster entry
  removed, their photographs deleted from the repo). **Open** puts one of them
  on the desk as an editable card — every field, their photos, and a private
  note that is never published — so you can correct what they typed before
  anyone sees it. Opening someone already live and saving updates their profile
  **in place**: same roster code, same URL, so a link already sent to a client
  keeps working, and any photo you removed is deleted from the site.

Everything lands in one editable list. Each row is checked against the same
rules the build enforces (name, city, 18+ confirmed, at least one photo, and no
email / phone / Instagram / price anywhere in the copy) before **Push** lights
up. Push then: photos → Cloudinary, entry → the engine, and the engine commits
the plates plus the roster entry to this repo. The **Talents build** workflow
runs `tools/build-talents.py` on that commit, so the cards, profiles,
`names.json`, schema and sitemap are generated exactly as they are below — the
console never writes a page itself.

Needs, once: the engine deployed (`yks-talents-engine/`, `npm run deploy`) with
its `ADMIN_KEY` and `GITHUB_TOKEN` secrets, and Actions set to
**Read and write permissions** in the repo settings.

## By hand (laptop, one talent)

Everything is generated from one file. Never hand-edit the profile pages.

## 1. Drop the images in

```
assets/talents/<folder>/
```
Cover shot first, then the portfolio plates. Any filenames — you name them
in the JSON.

## 2. Add an entry to `talents/roster.json`

```json
{
  "slug": "priya-menon",              // becomes /talents/priya-menon.html
  "name": "Priya Menon",
  "cat": "model",                     // model | influencer | actor
  "region": "india",                  // india | uae  → picks the booking number
  "city": "Mumbai",
  "country": "India",
  "countryCode": "IN",
  "geoRegion": "IN-MH",               // optional
  "gender": "Female",
  "nationality": "Indian",
  "over18": true,                     // REQUIRED — build fails without it
  "plate": 2,                         // running order in the edit
  "tags": ["Fashion", "Editorial", "Commercial"],
  "knowsAbout": ["Fashion modelling", "Editorial", "Commercial print"],
  "specs": { "Height": "5'7\"", "Hair": "Black", "Eyes": "Brown" },
  "bio": "Two or three sentences. What she is like on set, not adjectives.",
  "shortBio": "One line for the roster card and the share preview.",
  "castableFor": ["Fashion / Editorial", "Commercial / Print"],
  "dir": "priya",
  "cover": "priya-01.jpg",
  "gallery": [
    { "file": "priya-02.jpg", "alt": "studio editorial", "label": "Studio / Editorial" }
  ]
}
```

## 3. Build

```bash
python3 tools/build-talents.py
```

That regenerates every profile page, the schema and the sitemap entries.
Then run the roster schema too:

```bash
python3 tools/build-talent-schema.py
```

## What the build refuses to do

It stops with an error rather than publishing if it finds:

- **any talent contact detail** — email, phone or a talent Instagram link.
  Bookings route through YKS only; that is the whole promise of the roster.
- **a talent not marked `over18: true`.** Casting a child artist in India
  needs prior written District Magistrate permission under CLPRA. Not
  something to do by accident.
- **any price** — ₹, AED, $ or USD followed by a figure. Everything is
  quoted per project.
- **a missing image file**, so a profile can never go live with a broken plate.

All five guards are tested; deliberately breaking each one aborts the build.

## Writing the bio

Say what she is like to work with, not what she looks like. "Quick to take
direction, precise with hands and jawline, holds a look as long as the frame
needs" tells a client something. "Stunning and versatile" tells them nothing
and reads like every other roster.
