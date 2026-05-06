#!/usr/bin/env bash
# ship.sh — build v2, copy to root, prune orphan assets, commit, push.
#
# Usage:
#   ./ship.sh "Your commit message"
#
# Why "prune orphan assets"?
# Vite emits content-hashed filenames (Browse-DOixRg2K.js etc). When we
# `cp -r dist/* ../` to publish, new files are added but old ones with
# different hashes stay behind. Over many deploys those accumulate into
# hundreds of orphans (~22 MB before our last cleanup). This script
# rebuilds the live-asset set from index.html on every ship and removes
# anything not referenced.

set -e
cd "$(dirname "$0")"

MSG="${1:-Update}"

echo "→ Building v2…"
( cd v2 && npm run build )

echo "→ Copying build to root…"
cp -r v2/dist/* .

echo "→ Pruning orphan assets…"
ENTRY=$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' index.html | head -1 | sed 's|assets/||')
if [ -z "$ENTRY" ]; then
  echo "✗ Could not find entry chunk in index.html — aborting prune."
  exit 1
fi
( grep -oE 'assets/[A-Za-z0-9_.-]+\.(js|css)' index.html | sed 's|assets/||'
  grep -oE '[A-Za-z]+-[A-Za-z0-9_-]+\.(js|css)' "assets/$ENTRY"
) | sort -u > /tmp/harvest-live-assets.txt

REMOVED=0
for f in assets/*; do
  bn=$(basename "$f")
  if ! grep -qx "$bn" /tmp/harvest-live-assets.txt; then
    rm -f "$f"
    REMOVED=$((REMOVED + 1))
  fi
done
echo "  Removed $REMOVED orphan asset(s). Remaining: $(ls assets/ | wc -l | tr -d ' ')"

echo "→ Committing & pushing…"
# Clear stale locks left behind by interrupted git operations or sandbox runs
# (HEAD.lock, index.lock, and tmp_obj_* objects all block subsequent commits).
rm -f .git/index.lock .git/HEAD.lock
rm -f .git/objects/*/tmp_obj_* 2>/dev/null || true
git add -A
git commit -m "$MSG"
git push

echo "✓ Done."
