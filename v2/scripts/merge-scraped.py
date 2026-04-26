#!/usr/bin/env python3
"""
Merge scraped recipe JSON files into HARVEST's recipes.json.
Deduplicates by title (case-insensitive) against existing recipes
and within the new batch. Assigns new IDs.

Usage:
    python3 merge-scraped.py
"""

import json
import re
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent
RECIPES_FILE = SCRIPTS_DIR.parent / 'src' / 'data' / 'recipes.json'

# Files to merge (output from scrape-multi.py)
SCRAPED_FILES = [
    'veganricha-recipes.json',
    'ohsheglows-recipes.json',
    'loveandlemons-recipes.json',
    'plantyou-recipes.json',
    'idtlc-recipes.json',
    'forksoverknives-recipes.json',
    'bestofvegan-recipes.json',
]


def main():
    # Load existing recipes
    with open(RECIPES_FILE) as f:
        existing = json.load(f)

    max_id = max(r['id'] for r in existing)
    existing_titles = set(r.get('title', '').lower().strip() for r in existing)
    existing_urls = set(r.get('url', '').rstrip('/').lower() for r in existing if r.get('url'))

    print(f'Existing recipes: {len(existing)} (max ID: {max_id})')
    print()

    all_new = []
    seen_titles = set()

    for filename in SCRAPED_FILES:
        filepath = SCRIPTS_DIR / filename
        if not filepath.exists():
            print(f'  {filename}: not found, skipping')
            continue

        with open(filepath) as f:
            scraped = json.load(f)

        added = 0
        dup_existing = 0
        dup_batch = 0

        for r in scraped:
            title_key = r['title'].lower().strip()
            url_key = r.get('url', '').rstrip('/').lower()

            # Skip if title matches existing
            if title_key in existing_titles:
                dup_existing += 1
                continue

            # Skip if URL matches existing
            if url_key and url_key in existing_urls:
                dup_existing += 1
                continue

            # Skip if already in this batch
            if title_key in seen_titles:
                dup_batch += 1
                continue

            seen_titles.add(title_key)
            if url_key:
                existing_urls.add(url_key)

            # Assign ID and add cats field
            max_id += 1
            r['id'] = max_id
            r['cats'] = []

            # Clean up image URL (remove WP size suffixes)
            img = r.get('img', '')
            if img:
                r['img'] = re.sub(r'-\d+x\d+(\.\w+)$', r'\1', img)

            all_new.append(r)
            added += 1

        print(f'  {filename}: {added} added, {dup_existing} existing dupes, {dup_batch} batch dupes')

    print(f'\nTotal new recipes: {len(all_new)}')
    print(f'New ID range: {existing[-1]["id"] + 1 if all_new else "N/A"} – {max_id}')

    # Merge
    merged = existing + all_new
    print(f'Merged total: {len(merged)}')

    # Save
    with open(RECIPES_FILE, 'w') as f:
        json.dump(merged, f, separators=(',', ':'))

    print(f'\nSaved to {RECIPES_FILE}')


if __name__ == '__main__':
    main()
