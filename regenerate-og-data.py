#!/usr/bin/env python3
"""
Regenerate og-data.json from v2/src/data/recipes.json.

The Cloudflare Worker (v2/cloudflare-worker.js) reads og-data.json to
build per-recipe Open Graph link previews when someone shares a URL like
  https://myharvestvegan.com/?r=8344

If a recipe ID isn't in og-data.json the worker falls back to the generic
landing-page preview, so this file MUST be regenerated whenever recipes
are added or updated.

Usage:
    python3 regenerate-og-data.py
"""
import json
import os

SUPABASE_PREFIX = (
    'https://zhncgdbhgkeiybdbzsql.supabase.co/storage/v1/object/public/recipe-images/'
)

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'v2', 'src', 'data', 'recipes.json')
DST = os.path.join(HERE, 'og-data.json')

with open(SRC) as f:
    recipes = json.load(f)

og = {}
for r in recipes:
    rid = str(r['id'])
    img = r.get('img') or ''
    # Old recipes use a shorthand prefix that maps to Supabase storage.
    # New recipes already have full URLs (Pexels, etc.).
    if img.startswith('~'):
        img = SUPABASE_PREFIX + img[1:]

    entry = {
        't': r.get('title', ''),
        'i': img,
        's': r.get('site', ''),
        'time': r.get('time'),
        'srv': r.get('servings'),
        'cal': (r.get('nut') or {}).get('cal'),
    }
    # Strip None / empty values so the JSON stays compact.
    entry = {k: v for k, v in entry.items() if v is not None and v != ''}
    og[rid] = entry

with open(DST, 'w') as f:
    json.dump(og, f, separators=(',', ':'))

print(f'Wrote {len(og):,} recipes to {DST}')
print(f'File size: {os.path.getsize(DST):,} bytes')
