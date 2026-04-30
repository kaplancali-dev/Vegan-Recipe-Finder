#!/usr/bin/env python3
"""
Fix 3 Missing Recipe Images
============================
Downloads hero images for 3 recipes missing photos, uploads to Supabase,
and updates recipes.json with the ~{id}.jpg format.

Usage:
  pip install requests Pillow
  python fix-3-missing-images.py

Recipes:
  5054 - Vegan Asparagus Potato Tart (holycowvegan.net)
  5089 - Carrot Rice (holycowvegan.net)
  8140 - Jamaican Stew Peas (healthiersteps.com)
"""

import json, re, requests, io, time, sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow first: pip install Pillow")
    sys.exit(1)

SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co'
SUPABASE_BUCKET = 'recipe-images'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDczNzgzMywiZXhwIjoyMDYwMzEzODMzfQ.sZJFOJz9C0MtiVIhV4TJqxVEhOuyPRiF1MmVPbPjof0'
PEXELS_API_KEY = 'd2SOQDCAwQdtPjjIZAp395a57B9OVKyqUz3tjgRf5PEAl0JfAmVFkogu'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

SCRIPT_DIR = Path(__file__).parent
RECIPES_PATH = SCRIPT_DIR.parent / 'src' / 'data' / 'recipes.json'

RECIPES_TO_FIX = [
    {
        'id': 5054,
        'title': 'Vegan Asparagus Potato Tart',
        'source_url': 'https://holycowvegan.net/creamy-asparagus-and-potato-tart/',
        'pexels_query': 'asparagus potato tart',
    },
    {
        'id': 5089,
        'title': 'Carrot Rice',
        'source_url': 'https://holycowvegan.net/carrot-rice-recipe/',
        'pexels_query': 'carrot rice indian',
    },
    {
        'id': 8140,
        'title': 'Jamaican Stew Peas',
        'source_url': 'https://healthiersteps.com/jamaican-stew-peas-dumplings-spinners-2/',
        'pexels_query': 'jamaican stew peas kidney beans',
    },
]


def get_og_image(url):
    """Try to get OG image from recipe source page."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        html = resp.text[:60000]
        m = re.search(
            r'<meta\s+(?:property|name)=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
            html, re.IGNORECASE
        )
        if not m:
            m = re.search(
                r'content=["\']([^"\']+)["\']\s+(?:property|name)=["\']og:image["\']',
                html, re.IGNORECASE
            )
        if m:
            img_url = m.group(1)
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
            return img_url
    except Exception as e:
        print(f"    OG fetch failed: {e}")
    return None


def search_pexels(query):
    """Search Pexels for a food photo."""
    try:
        resp = requests.get(
            'https://api.pexels.com/v1/search',
            headers={'Authorization': PEXELS_API_KEY},
            params={'query': f'vegan {query}', 'per_page': 5, 'orientation': 'landscape'},
            timeout=10,
        )
        resp.raise_for_status()
        photos = resp.json().get('photos', [])
        if photos:
            return photos[0]['src']['medium']
    except Exception as e:
        print(f"    Pexels failed: {e}")
    return None


def download_image(url):
    """Download image bytes."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.content
        return data if len(data) > 1000 else None
    except Exception as e:
        print(f"    Download failed: {e}")
        return None


def resize_image(data):
    """Resize to 800x600 max, compress as JPEG."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ('RGBA', 'P', 'LA'):
            img = img.convert('RGB')
        if img.width > 800 or img.height > 600:
            img.thumbnail((800, 600), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=82, optimize=True)
        return buf.getvalue()
    except:
        return data


def upload_to_supabase(data, filename):
    """Upload image to Supabase storage."""
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{filename}"
    try:
        resp = requests.post(
            url,
            headers={
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true',
            },
            data=data,
            timeout=30,
        )
        resp.raise_for_status()
        return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
    except Exception as e:
        print(f"    Upload failed: {e}")
        return None


def main():
    print("=" * 60)
    print("Fix 3 Missing Recipe Images")
    print("=" * 60)

    uploaded = {}

    for recipe in RECIPES_TO_FIX:
        rid = recipe['id']
        title = recipe['title']
        filename = f"{rid}.jpg"

        print(f"\n[{rid}] {title}")

        img_data = None

        # Step 1: Try OG image from source page
        print(f"  Trying source: {recipe['source_url']}")
        og_url = get_og_image(recipe['source_url'])
        if og_url:
            print(f"  OG image: {og_url[:80]}...")
            img_data = download_image(og_url)

        # Step 2: Fallback to Pexels
        if not img_data:
            print(f"  Searching Pexels: '{recipe['pexels_query']}'")
            pexels_url = search_pexels(recipe['pexels_query'])
            if pexels_url:
                print(f"  Pexels: {pexels_url}")
                img_data = download_image(pexels_url)

        if not img_data:
            print(f"  FAILED: No image found for {title}")
            continue

        # Step 3: Resize
        img_data = resize_image(img_data)
        print(f"  Size: {len(img_data) / 1024:.0f} KB")

        # Step 4: Upload
        public_url = upload_to_supabase(img_data, filename)
        if public_url:
            uploaded[rid] = f"~{rid}.jpg"
            print(f"  UPLOADED: {public_url}")
        else:
            print(f"  FAILED: Upload failed")

        time.sleep(0.5)

    # Step 5: Update recipes.json
    if uploaded:
        print(f"\nUpdating recipes.json with {len(uploaded)} images...")
        with open(RECIPES_PATH) as f:
            all_recipes = json.load(f)

        for r in all_recipes:
            if r['id'] in uploaded:
                r['img'] = uploaded[r['id']]

        with open(RECIPES_PATH, 'w') as f:
            json.dump(all_recipes, f)

        print("recipes.json updated!")

    print(f"\n{'=' * 60}")
    print(f"RESULTS: {len(uploaded)}/3 images uploaded")
    for rid, img in uploaded.items():
        print(f"  {rid}: {img}")
    if len(uploaded) < 3:
        missing = [r['id'] for r in RECIPES_TO_FIX if r['id'] not in uploaded]
        print(f"  Missing: {missing}")
    print("=" * 60)


if __name__ == '__main__':
    main()
