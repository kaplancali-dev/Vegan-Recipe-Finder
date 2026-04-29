#!/usr/bin/env python3
"""
Fetch Photos for New Recipes (IDs 8191-8320)
=============================================
Uses Pexels API to find food photos, resizes to 800x600,
uploads to Supabase storage, and updates recipes.json.

Usage:
  pip install requests Pillow
  python fetch-new-recipe-photos.py
"""

import json, re, requests, io, time, sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow first: pip install Pillow")
    sys.exit(1)

SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyNzcyNywiZXhwIjoyMDkyMjAzNzI3fQ.PW58eQ6vioix4tuRvNKzc4R5kW2flZKL4i3_9bGrfhc'
SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co'
SUPABASE_BUCKET = 'recipe-images'
PEXELS_API_KEY = 'd2SOQDCAwQdtPjjIZAp395a57B9OVKyqUz3tjgRf5PEAl0JfAmVFkogu'

MAX_WIDTH = 800
MAX_HEIGHT = 600
JPEG_QUALITY = 82

SCRIPT_DIR = Path(__file__).parent
RECIPES_PATH = SCRIPT_DIR.parent / 'src' / 'data' / 'recipes.json'
PHOTO_DIR = SCRIPT_DIR / 'photos'
PHOTO_DIR.mkdir(exist_ok=True)


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
        print(f"    Pexels search failed: {e}")
    return None


def download_image(url):
    """Download image bytes."""
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.content
        if len(data) < 1000:
            return None
        return data
    except Exception as e:
        print(f"    Download failed: {e}")
        return None


def resize_image(data):
    """Resize to 800x600 max and compress as JPEG."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ('RGBA', 'P', 'LA'):
            img = img.convert('RGB')
        if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True)
        return buf.getvalue()
    except Exception as e:
        print(f"    Resize failed: {e}")
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
        print(f"    Supabase upload failed: {e}")
        return None


def main():
    with open(RECIPES_PATH) as f:
        all_recipes = json.load(f)

    # Target: recipes with empty img field in ID range 8191-8320
    recipes = [r for r in all_recipes if 8191 <= r['id'] <= 8320 and not r.get('img')]
    print(f"\n{'='*60}")
    print(f"  Photo Pipeline — New Recipes (IDs 8191-8320)")
    print(f"  Missing images: {len(recipes)}")
    print(f"{'='*60}\n")

    stats = {'found': 0, 'failed': 0, 'uploaded': 0}
    updates = {}

    for i, r in enumerate(recipes, 1):
        rid = r['id']
        title = r['title']
        filename = f"{rid}.jpg"

        # Clean title for search
        search_term = re.sub(r'[()]', '', title).split(' - ')[0].split(' with ')[0].strip()
        print(f"[{i}/{len(recipes)}] {rid} {title}")
        print(f"    Search: '{search_term}'")

        pexels_url = search_pexels(search_term)
        if not pexels_url:
            # Fallback: simpler search
            words = search_term.split()[:3]
            pexels_url = search_pexels(' '.join(words))

        if not pexels_url:
            print(f"    ✗ No image found")
            stats['failed'] += 1
            time.sleep(0.3)
            continue

        img_data = download_image(pexels_url)
        if not img_data:
            stats['failed'] += 1
            time.sleep(0.3)
            continue

        stats['found'] += 1
        img_data = resize_image(img_data)

        # Save locally
        local_path = PHOTO_DIR / filename
        local_path.write_bytes(img_data)
        print(f"    Saved ({len(img_data)//1024}KB)")

        # Upload to Supabase
        public_url = upload_to_supabase(img_data, filename)
        if public_url:
            updates[rid] = public_url
            stats['uploaded'] += 1
            print(f"    ✓ Uploaded")

        time.sleep(0.5)

    # Update recipes.json
    if updates:
        print(f"\nUpdating recipes.json with {len(updates)} image URLs...")
        for r in all_recipes:
            if r['id'] in updates:
                r['img'] = updates[r['id']]
        with open(RECIPES_PATH, 'w') as f:
            json.dump(all_recipes, f, indent=2)
        print("✓ recipes.json updated!")

    print(f"\n{'='*60}")
    print(f"  RESULTS")
    print(f"  Found:    {stats['found']}")
    print(f"  Uploaded: {stats['uploaded']}")
    print(f"  Failed:   {stats['failed']}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
