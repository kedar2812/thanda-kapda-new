#!/usr/bin/env bash
# Makes responsive WebP copies of the built-in photos in public/products:
# <name>-640.webp, <name>-1080.webp and <name>-<full width>.webp (never upscaled).
# The site's image loader picks the right one per screen. The JPEGs stay for
# social previews. Needs ffmpeg with libwebp. Re-run after adding a photo.
set -euo pipefail
cd "$(dirname "$0")/../public/products"
for f in *.jpg; do
  name="${f%.jpg}"
  full=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$f")
  for w in 640 1080 "$full"; do
    [[ "$w" -gt "$full" ]] && continue
    out="$name-$w.webp"
    [[ -f "$out" ]] && continue
    ffmpeg -loglevel error -y -i "$f" -vf "scale=$w:-2:flags=lanczos" -c:v libwebp -quality 80 -compression_level 6 "$out"
  done
done
