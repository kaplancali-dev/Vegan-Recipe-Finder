#!/usr/bin/env python3
"""
Merge scraped recipes into the main recipes.json database.

Usage:
  python merge-recipes.py                          # merge scraped-recipes.json
  python merge-recipes.py custom-batch.json        # merge a specific file

What it does:
  1. Reads scraped-recipes.json (or specified file)
  2. Loads existing recipes.json
  3. De-duplicates by title and URL
  4. Assigns sequential IDs starting after the current max
  5. Writes the merged result back to recipes.json
  6. Prints a summary of what was added
"""

import json
import os
import re
import sys
from pathlib import Path
from collections import Counter

# Hard-gluten regex — recipes containing any of these structural wheat
# ingredients are rejected at scrape-merge time so they never enter the
# database. Mirrors HARD_GLUTEN_REGEX in src/data/aliases.js — keep in sync.
HARD_GLUTEN = [
    r'\bfarro\b', r'\bpearled\s+farro\b',
    r'\bbulgur\b', r'\bbulgur\s+wheat\b', r'\bcracked\s+wheat\b',
    r'\bbarley\b', r'\bpearl\s+barley\b', r'\bpearled\s+barley\b',
    r'\bwheat\s+berries\b', r'\bwheat\s+berry\b',
    r'\bfreekeh\b', r'\bkamut\b', r'\beinkorn\b',
    r'\bcouscous\b', r'\bwhole\s+wheat\s+couscous\b', r'\bpearl\s+couscous\b',
    r'\bisraeli\s+couscous\b', r'\bmoroccan\s+couscous\b',
    r'\bseitan\b', r'\bvital\s+wheat\s+gluten\b', r'\bwheat\s+gluten\b',
    r'\bsemolina\b', r'\bdurum\s+wheat\b', r'\bdurum\s+flour\b',
    r'\bspelt\s+berries\b', r'\bspelt\s+grain\b',
    r'\brye\s+flour\b', r'\brye\s+bread\b', r'\brye\s+berries\b', r'\brye\b',
    r'\bshaoxing\s+wine\b', r'\bshaoxing\s+rice\s+wine\b', r'\bchinese\s+cooking\s+wine\b',
    r'\bbeer\b', r'\blager\b', r'\bstout\b', r'\bpilsner\b',
    r'\bmalt\s+extract\b', r'\bmalt\s+syrup\b', r'\bmalted\s+barley\b',
    r'\bspelt\b(?!\s+flour)',
    r'(?<!ginger\s)\bale\b',
    r'\bipa\b',
    r'\bmalt\b(?!\s+vinegar)',
]
HARD_GLUTEN_RE = re.compile('|'.join(HARD_GLUTEN), re.IGNORECASE)


def is_gluten_recipe(recipe):
    """Returns True if recipe contains any unsubstitutable wheat ingredient."""
    for ing in recipe.get('ing', []):
        if HARD_GLUTEN_RE.search(ing):
            return True
    return False

SCRIPT_DIR = Path(__file__).parent
RECIPES_FILE = SCRIPT_DIR.parent / 'src' / 'data' / 'recipes.json'
DEFAULT_INPUT = SCRIPT_DIR / 'scraped-recipes.json'


def normalize_key(s: str) -> str:
    return s.strip().lower()


def merge(input_file: Path):
    # Load existing
    with open(RECIPES_FILE) as f:
        existing = json.load(f)

    print(f"Existing recipes: {len(existing)}")

    # Build lookup sets
    existing_titles = {normalize_key(r['title']) for r in existing}
    existing_urls = {normalize_key(r.get('url', '').rstrip('/')) for r in existing}
    max_id = max(r['id'] for r in existing)

    # Load new
    with open(input_file) as f:
        new_recipes = json.load(f)

    print(f"New recipes to merge: {len(new_recipes)}")

    added = []
    skipped_dup = 0
    skipped_no_ing = 0
    skipped_gluten = 0
    next_id = max_id + 1

    for r in new_recipes:
        title_key = normalize_key(r['title'])
        url_key = normalize_key(r.get('url', '').rstrip('/'))

        # Skip duplicates
        if title_key in existing_titles or (url_key and url_key in existing_urls):
            skipped_dup += 1
            continue

        # Skip recipes with no ingredients
        if not r.get('ing') or len(r['ing']) < 2:
            skipped_no_ing += 1
            continue

        # Skip recipes containing structural gluten ingredients (HARVEST is GF)
        if is_gluten_recipe(r):
            skipped_gluten += 1
            continue

        # Clean up: remove internal fields
        clean = {
            'id': next_id,
            'title': r['title'],
            'site': r.get('site', ''),
            'url': r.get('url', ''),
            'img': r.get('img', ''),  # Supabase URL after photo upload
            'cats': r.get('cats', []),
            'time': r.get('time', 30),
            'servings': r.get('servings', 4),
            'ing': r['ing'],
            'nut': r.get('nut', {'cal': 0, 'pro': 0, 'carb': 0, 'fat': 0, 'fib': 0}),
        }

        existing.append(clean)
        existing_titles.add(title_key)
        if url_key:
            existing_urls.add(url_key)
        added.append(clean)
        next_id += 1

    # Sort by ID
    existing.sort(key=lambda r: r['id'])

    # Write back
    with open(RECIPES_FILE, 'w') as f:
        json.dump(existing, f, indent=2)

    print(f"\n{'='*50}")
    print(f"MERGE RESULTS")
    print(f"{'='*50}")
    print(f"Added:       {len(added)}")
    print(f"Skipped dup: {skipped_dup}")
    print(f"Skipped (no ingredients): {skipped_no_ing}")
    print(f"Skipped (gluten): {skipped_gluten}")
    print(f"Total now:   {len(existing)}")

    # Auto-canonicalize: every newly-merged recipe gets its iclean field
    # populated by the same script that runs in ship.sh. Keeps the
    # database "born clean" — no separate processing step needed.
    print(f"\n→ Canonicalizing iclean field for all recipes…")
    import subprocess
    script_dir = os.path.dirname(os.path.abspath(__file__))
    result = subprocess.run(
        ['node', os.path.join(script_dir, 'canonicalize-ingredients.mjs'), '--apply'],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        # Print just the last line of output (the "wrote N recipes" summary)
        for line in result.stdout.strip().split('\n')[-3:]:
            print(f"  {line}")
    else:
        print(f"  ⚠ Canonicalization failed: {result.stderr[:200]}")

    if added:
        # Category breakdown
        all_cats = []
        for r in added:
            all_cats.extend(r['cats'])
        cat_counts = Counter(all_cats)
        print(f"\nNew recipes by category:")
        for cat, count in cat_counts.most_common():
            print(f"  {cat}: {count}")

        # GF stats
        gf = sum(1 for r in added if 'Gluten-Free' in r['cats'])
        print(f"\nGluten-Free: {gf}/{len(added)} ({100*gf/len(added):.0f}%)")

        # Site breakdown
        sites = Counter(r['site'] for r in added)
        print(f"\nBy source:")
        for site, count in sites.most_common():
            print(f"  {site}: {count}")


if __name__ == '__main__':
    input_file = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_INPUT
    if not input_file.exists():
        print(f"File not found: {input_file}")
        print(f"Run scrape-recipes.py first to generate scraped recipes.")
        sys.exit(1)
    merge(input_file)
