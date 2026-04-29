#!/usr/bin/env python3
"""
Fix Missing/Broken Recipe Images
=================================
Checks all recipe image URLs via HEAD request.
Re-fetches broken ones from Pexels and uploads to Supabase as .jpg.

Usage:
  pip install requests Pillow
  python fix-missing-images.py
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

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

MAX_WIDTH = 800
MAX_HEIGHT = 600
JPEG_QUALITY = 82

SCRIPT_DIR = Path(__file__).parent
RECIPES_PATH = SCRIPT_DIR.parent / 'src' / 'data' / 'recipes.json'


def check_image(url):
    """HEAD check if image exists. Returns True if OK."""
    try:
        resp = requests.head(url, timeout=10)
        return resp.status_code == 200
    except:
        return False


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
    except:
        pass
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
    except:
        return None


def resize_image(data):
    """Resize to 800x600 max, compress as JPEG."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode in ('RGBA', 'P', 'LA'):
            img = img.convert('RGB')
        if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True)
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
    with open(RECIPES_PATH) as f:
        all_recipes = json.load(f)

    print(f"Checking {len(all_recipes)} recipe images...")
    print("Phase 1: Finding broken images (HEAD checks)...\n")

    broken = []
    for i, r in enumerate(all_recipes):
        if i % 200 == 0:
            print(f"  Checked {i}/{len(all_recipes)}...")
        img = r.get('img', '')
        if not img:
            broken.append(r)
            continue
        if not check_image(img):
            broken.append(r)
        time.sleep(0.05)  # Be gentle

    print(f"\n{'='*60}")
    print(f"  Found {len(broken)} broken/missing images")
    print(f"{'='*60}\n")

    if not broken:
        print("All images are valid!")
        return

    stats = {'og': 0, 'pexels': 0, 'failed': 0, 'uploaded': 0}
    updates = {}

    for i, r in enumerate(broken, 1):
        rid = r['id']
        title = r['title']
        url = r.get('url', '')
        filename = f"{rid}.jpg"

        print(f"[{i}/{len(broken)}] #{rid} {title}")
        img_data = None

        # Try OG image first
        if url and url != '#':
            og_url = get_og_image(url)
            if og_url:
                print(f"    OG: {og_url[:70]}...")
                img_data = download_image(og_url)
                if img_data:
                    stats['og'] += 1

        # Fallback to Pexels
        if not img_data:
            search_term = re.sub(r'[()]', '', title).split(' - ')[0].split(' with ')[0].strip()
            print(f"    Pexels: '{search_term}'")
            pexels_url = search_pexels(search_term)
            if pexels_url:
                img_data = download_image(pexels_url)
                if img_data:
                    stats['pexels'] += 1

            if not img_data:
                # Simpler search
                words = search_term.split()[:3]
                pexels_url = search_pexels(' '.join(words))
                if pexels_url:
                    img_data = download_image(pexels_url)
                    if img_data:
                        stats['pexels'] += 1

        if not img_data:
            print(f"    ✗ No image found")
            stats['failed'] += 1
            time.sleep(0.3)
            continue

        img_data = resize_image(img_data)
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
    print(f"  From OG tags: {stats['og']}")
    print(f"  From Pexels:  {stats['pexels']}")
    print(f"  Uploaded:     {stats['uploaded']}")
    print(f"  Failed:       {stats['failed']}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
