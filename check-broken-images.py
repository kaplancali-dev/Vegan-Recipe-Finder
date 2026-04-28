#!/usr/bin/env python3
"""
Check for broken recipe images by sending HEAD requests.
Outputs a list of recipes with dead image URLs.

Usage:
  python3 check-broken-images.py
"""

import json
import os
import sys
import time

try:
    import requests
except ImportError:
    os.system(f"{sys.executable} -m pip install requests")
    import requests

RECIPES_PATH = os.path.join(os.path.dirname(__file__), "v2", "src", "data", "recipes.json")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

with open(RECIPES_PATH) as f:
    recipes = json.load(f)

# Only check non-Supabase images (hotlinked ones)
to_check = [(i, r) for i, r in enumerate(recipes) if r.get("img") and "supabase" not in r["img"]]
print(f"Checking {len(to_check)} hotlinked images...\n")

broken = []
ok = 0

for count, (idx, r) in enumerate(to_check):
    if count > 0 and count % 100 == 0:
        print(f"  Progress: {count}/{len(to_check)} checked, {len(broken)} broken, {ok} ok")

    try:
        resp = requests.head(r["img"], headers=HEADERS, timeout=10, allow_redirects=True)
        if resp.status_code >= 400:
            broken.append(r)
            print(f"  ✗ [{r['id']}] {resp.status_code} — {r['title'][:50]}")
        else:
            ok += 1
    except Exception as e:
        broken.append(r)
        print(f"  ✗ [{r['id']}] ERROR — {r['title'][:50]} — {e}")

    time.sleep(0.1)

print(f"\n{'='*60}")
print(f"Done! {ok} ok, {len(broken)} broken out of {len(to_check)} checked")

if broken:
    print(f"\nBroken image recipes:")
    for r in broken:
        print(f"  [{r['id']}] {r['title']}")
        print(f"    img: {r['img']}")
        print(f"    url: {r.get('url', '?')}")

    # Save broken list for reference
    with open(os.path.join(os.path.dirname(__file__), "broken-images.json"), "w") as f:
        json.dump([{"id": r["id"], "title": r["title"], "img": r["img"], "url": r.get("url", "")} for r in broken], f, indent=2)
    print(f"\nSaved broken list to broken-images.json")
