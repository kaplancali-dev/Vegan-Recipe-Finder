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

echo "→ Canonicalizing recipes (cleans iclean field for any newly-scraped recipes)…"
( cd v2 && node scripts/canonicalize-ingredients.mjs --apply >/dev/null )

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
# Bulletproof lock cleanup — clear EVERY lock or tmp object git might
# have left behind (interrupted operations, crashed processes, sandbox
# runs, etc.). Suppress errors since most of these may not exist.
find .git -name "*.lock" -type f -delete 2>/dev/null || true
find .git/objects -name "tmp_obj_*" -type f -delete 2>/dev/null || true
git add -A
# Only commit if there's something staged. Without this guard, an
# asset-only deploy (e.g. icon swap that doesn't change JS/CSS hashes)
# leaves nothing for `git commit` to do — the commit fails and `set -e`
# kills the script BEFORE `git push` runs, leaving prior commits
# stranded on the local branch and the live site stale.
if ! git diff --cached --quiet; then
  git commit -m "$MSG"
else
  echo "  (build produced no new files — skipping commit)"
fi
# Always push. If local has unpushed commits from a previous run that
# was interrupted, this catches them. If everything is already in sync,
# this is a harmless no-op.
git push

echo "✓ Done."
