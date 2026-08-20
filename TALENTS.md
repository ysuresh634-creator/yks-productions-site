# Adding talent to the roster

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
