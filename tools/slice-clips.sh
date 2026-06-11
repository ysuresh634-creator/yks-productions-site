#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# slice-clips.sh — turn a Higgsfield clip into scroll-scrub frames
#
# Usage:
#   ./tools/slice-clips.sh <clip.mp4> <act>
#   <act> is "hero" or "dubai" (must match data-cinema in index.html)
#
# Produces assets/frames/<act>/frame_0001.jpg … + manifest.json.
# The site auto-detects the manifest and switches that act from the
# procedural shader to the real frame sequence. No code changes.
#
# Requires ffmpeg:  brew install ffmpeg
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

CLIP="${1:?usage: slice-clips.sh <clip.mp4> <act: hero|dubai>}"
ACT="${2:?usage: slice-clips.sh <clip.mp4> <act: hero|dubai>}"
FPS="${3:-24}"          # frames per second to extract
WIDTH="${4:-1600}"      # output frame width
QUALITY="${5:-4}"       # jpeg quality (2 best … 10 worst)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/frames/$ACT"

command -v ffmpeg >/dev/null || { echo "ffmpeg not found — install with: brew install ffmpeg"; exit 1; }

rm -rf "$OUT"; mkdir -p "$OUT"

echo "→ slicing $CLIP @ ${FPS}fps, ${WIDTH}px wide…"
ffmpeg -hide_banner -loglevel error -i "$CLIP" \
  -vf "fps=$FPS,scale=$WIDTH:-2:flags=lanczos" \
  -q:v "$QUALITY" "$OUT/frame_%04d.jpg"

COUNT=$(ls "$OUT" | grep -c '^frame_.*\.jpg$')
cat > "$OUT/manifest.json" <<EOF
{ "count": $COUNT, "pad": 4, "pattern": "frame_%d.jpg", "fps": $FPS }
EOF

echo "✓ $COUNT frames → assets/frames/$ACT/ (manifest written)"
echo "  Reload the site — the \"$ACT\" act now scrubs the real clip."
