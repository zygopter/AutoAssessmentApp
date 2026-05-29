#!/usr/bin/env bash
# Capture des screenshots des écrans publics (login, register, form preview).
# Usage : scripts/screenshots.sh [base_url] [out_dir]
#   base_url  défaut http://localhost:3939
#   out_dir   défaut ./screenshots

set -euo pipefail

BASE_URL="${1:-http://localhost:3939}"
OUT_DIR="${2:-screenshots}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WIDTH=1440
HEIGHT=900

if [ ! -x "$CHROME" ]; then
  echo "❌ Chrome introuvable à $CHROME" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# Liste des routes publiques à screenshooter.
# Pour les écrans protégés (teacher/student), utilise scripts/screenshots-auth.mjs
ROUTES=(
  "login:/login"
  "register:/register"
)

for entry in "${ROUTES[@]}"; do
  name="${entry%%:*}"
  path="${entry#*:}"
  url="${BASE_URL}${path}"
  out="${OUT_DIR}/${name}.png"
  echo "📸  ${url} -> ${out}"
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-sandbox \
    --hide-scrollbars \
    --window-size="${WIDTH},${HEIGHT}" \
    --virtual-time-budget=4000 \
    --screenshot="$out" \
    "$url" 2>/dev/null
done

echo "✅ Screenshots dans ${OUT_DIR}/"
ls -la "$OUT_DIR"
