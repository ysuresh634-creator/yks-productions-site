# Portfolio PDF QC

Catches the two faults that actually ruin a portfolio PDF — **text sitting on top of other
text**, and **text running off the page** — before a talent ever downloads one.

It builds books with the *real* `buildPortfolio` from `js/talent-apply.js` (no copy to drift),
across every template and a set of deliberately awkward inputs: a very long name, a long bio,
no bio, a long city, eight disciplines, long stat values, and books with only one or two photos.

## Run it

```bash
node tools/pdf-qc/generate.js   # writes tools/pdf-qc/out/*.pdf — no npm install needed
python3 -m pip install pymupdf  # once
python3 tools/pdf-qc/check.py
```

It loads the bundled `js/vendor/jspdf.umd.min.js`, so it exercises exactly the library the
site ships.

A clean run prints `0 issues`. Anything else lists the file, page and the two pieces of text
that collide.

## Why the checker shrinks each text box

A PDF text span's bounding box includes the font's ascent/descent padding, so two normal
consecutive lines *always* overlap on paper. The checker trims 19% off the top and bottom of
each box so it compares the visible glyphs — otherwise every heading looks like a bug.

## Fixed by this harness (Aug 2026)

- jsPDF aligns right/centre text on the **unspaced** width, so every letter-spaced running
  head overflowed the right margin. `htk()` now measures the spaced width itself.
- The type fitter measured width without letter-spacing, so letter-spaced lines never shrank
  enough and ran off the page.
- Long names collided with the cover's edition block; the fitter's floor was too high to fit.
- The cover name lockup and the closing `BOOK <name>` used leading tighter than the type size.
- The disciplines statement on spreads ran into the note beside it.
