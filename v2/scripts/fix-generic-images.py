#!/usr/bin/env python3
"""
Fix Generic Recipe Images
==========================
Re-fetches images for specific recipe IDs where the current Supabase image
is a generic stock photo instead of the actual dish.

Priority: OG image from recipe source site → Pexels fallback.

Usage:
  pip install requests Pillow
  python fix-generic-images.py

Edit TARGET_IDS below to add/remove recipes.
"""

import json, re, requests, io, time, sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow first: pip install Pillow")
    sys.exit(1)

# ── Recipes that need better images ──────────────────────────
# All recipes whose source URL is a category/roundup page (not actual recipe)
TARGET_IDS = [
    155, 4093, 4097, 4106, 4121, 4122, 4130, 4131, 4133,
    4793, 4947,
    8101, 8107, 8109, 8121, 8128, 8129, 8131,
    8136, 8144, 8145, 8146, 8148, 8149, 8150,
]

# These have category/tag URLs — skip OG image (it'll be a site logo)
SKIP_OG_IDS = set(TARGET_IDS)

# ── API keys ─────────────────────────────────────────────────
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyNzcyNywiZXhwIjoyMDkyMjAzNzI3fQ.PW58eQ6vioix4tuRvNKzc4R5kW2flZKL4i3_9bGrfhc'
SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co'
SUPABASE_BUCKET = 'recipe-images'
PEXELS_API_KEY = 'd2SOQDCAwQdtPjjIZAp395a57B9OVKyqUz3tjgRf5PEAl0JfAmVFkogu'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
}

MAX_WIDTH = 800
MAX_HEIGHT = 600
JPEG_QUALITY = 82

SCRIPT_DIR = Path(__file__).parent
RECIPES_PATH = SCRIPT_DIR.parent / 'src' / 'data' / 'recipes.json'


def get_og_image(url):
    """Try to get OG image from recipe source page."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        resp.raise_for_status()
        html = resp.text[:80000]
        # Try og:image
        m = re.search(
            r'<meta\s+(?:property|name)=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
            html, re.IGNORECASE
        )
        if not m:
            m = re.search(
                r'content=["\']([^"\']+)["\']\s+(?:property|name)=["\']og:image["\']',
                html, re.IGNORECASE
            )
        # Try twitter:image as fallback
        if not m:
            m = re.search(
                r'<meta\s+(?:property|name)=["\']twitter:image["\']\s+content=["\']([^"\']+)["\']',
                html, re.IGNORECASE
            )
        if m:
            img_url = m.group(1)
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
            return img_url
    except Exception as e:
        print(f"    OG fetch error: {e}")
    return None


def search_pexels(query):
    """Search Pexels for a food photo."""
    try:
        resp = requests.get(
            'https://api.pexels.com/v1/search',
            headers={'Authorization': PEXELS_API_KEY},
            params={'query': f'vegan {query} food', 'per_page': 5, 'orientation': 'landscape'},
            timeout=10,
        )
        resp.raise_for_status()
        photos = resp.json().get('photos', [])
        if photos:
            # Use 'large' for better quality
            return photos[0]['src']['large']
    except Exception as e:
        print(f"    Pexels error: {e}")
    return None


def download_image(url):
    """Download image bytes."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.content
        if len(data) < 2000:
            print(f"    Image too small ({len(data)} bytes), skipping")
            return None
        return data
    except Exception as e:
        print(f"    Download error: {e}")
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
    """Upload image to Supabase storage (upsert)."""
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
        print(f"    Upload error: {e}")
        return None


def main():
    with open(RECIPES_PATH) as f:
        all_recipes = json.load(f)

    targets = [r for r in all_recipes if r['id'] in TARGET_IDS]
    missing = set(TARGET_IDS) - {r['id'] for r in targets}
    if missing:
        print(f"Warning: IDs not found in recipes.json: {missing}")

    print(f"Re-fetching images for {len(targets)} recipes...\n")

    stats = {'og': 0, 'pexels': 0, 'failed': 0, 'uploaded': 0}
    updates = {}

    for i, r in enumerate(targets, 1):
        rid = r['id']
        title = r['title']
        url = r.get('url', '')
        filename = f"{rid}.jpg"

        print(f"[{i}/{len(targets)}] #{rid} {title}")
        print(f"    Source: {url[:80]}...")
        img_data = None

        # Try OG image first (only if URL is an actual recipe page)
        if rid in SKIP_OG_IDS:
            print(f"    ⚠ Category/roundup URL — skipping OG, using Pexels")
        elif url and url != '#':
            og_url = get_og_image(url)
            if og_url:
                print(f"    ✓ Found OG image: {og_url[:70]}...")
                img_data = download_image(og_url)
                if img_data:
                    stats['og'] += 1
                    print(f"    ✓ Downloaded ({len(img_data):,} bytes)")
            else:
                print(f"    ✗ No OG image found on source page")

        # Fallback to Pexels
        if not img_data:
            search_term = re.sub(r'[()]', '', title).split(' - ')[0].split(' with ')[0].strip()
            print(f"    Trying Pexels: '{search_term}'")
            pexels_url = search_pexels(search_term)
            if pexels_url:
                img_data = download_image(pexels_url)
                if img_data:
                    stats['pexels'] += 1
                    print(f"    ✓ Got Pexels image ({len(img_data):,} bytes)")

        if not img_data:
            print(f"    ✗ FAILED — no image found anywhere")
            stats['failed'] += 1
            continue

        # Resize and upload
        img_data = resize_image(img_data)
        public_url = upload_to_supabase(img_data, filename)
        if public_url:
            updates[rid] = public_url
            stats['uploaded'] += 1
            print(f"    ✓ Uploaded to Supabase as {filename}")
        time.sleep(0.5)

    # Update recipes.json with new URLs (all as .jpg now)
    if updates:
        print(f"\nUpdating recipes.json with {len(updates)} image URLs...")
        for r in all_recipes:
            if r['id'] in updates:
                r['img'] = updates[r['id']]
        with open(RECIPES_PATH, 'w') as f:
            json.dump(all_recipes, f, indent=2)
        print("✓ recipes.json updated!")

    print(f"\n{'='*50}")
    print(f"  RESULTS")
    print(f"  From source sites (OG): {stats['og']}")
    print(f"  From Pexels:            {stats['pexels']}")
    print(f"  Uploaded:               {stats['uploaded']}")
    print(f"  Failed:                 {stats['failed']}")
    print(f"{'='*50}")


if __name__ == '__main__':
    main()
