# YKS Productions — scroll-cinematic site

A 3D scroll-driven cinematic site for **Yedukrishna Suresh / YKS Productions**
(cinematographer & film still photographer · Bangalore — Dubai).

## Run it

```bash
cd yks-cinematic
python3 -m http.server 4173
# → http://localhost:4173
```

(Any static server works. Internet is needed for fonts, GSAP/Lenis CDN and the
Behance/Pixieset portfolio images.)

## The three cinematic acts

| Act | Section | What scroll does |
|---|---|---|
| I | Hero | Camera pushes into a volumetric ember/teal nebula; title splits apart; live timecode |
| IV | Dubai | Scrubs the sun from golden hour → sunset → blue hour → night over a procedural skyline + water reflection |
| V | Tunnel | Flies the camera through 9 real portfolio frames in 3D space |

Acts I and IV render on `<canvas>` with raw-WebGL shaders shipped in
`js/cinema.js` — the site is fully cinematic with **zero video assets**.

## Dropping in real Higgsfield clips

When the Higgsfield workspace has credits, generate clips (hero 16:9 ~5–8s,
dubai 16:9 ~5–10s), download the MP4s, then:

```bash
brew install ffmpeg            # once
./tools/slice-clips.sh hero-clip.mp4 hero
./tools/slice-clips.sh dubai-clip.mp4 dubai
```

That writes `assets/frames/<act>/frame_0001.jpg…` plus a `manifest.json`.
On the next reload `js/cinema.js` detects the manifest and the act scrubs the
**real footage** frame-by-frame instead of the shader. No code changes needed.

## Files

- `index.html` — all sections (hero, stats, about, services, work reel, Dubai, film-stills marquee, tunnel, credits, booking, footer)
- `css/style.css` — cinematic grade: deep black, molten amber, electric teal, violet
- `js/cinema.js` — WebGL shader acts + frame-sequence drop-in loader
- `js/main.js` — Lenis smooth scroll, GSAP ScrollTrigger pins/scrubs, tunnel, marquee, counters, WhatsApp booking
- `tools/slice-clips.sh` — ffmpeg clip → frames slicer
