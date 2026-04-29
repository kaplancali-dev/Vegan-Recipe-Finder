#!/usr/bin/env python3
"""
Fetch & Upload Photos for African/Caribbean/Ethiopian Recipes (IDs 8097–8151)
==============================================================================

Downloads OG images from recipe source pages, resizes to 800×600,
and uploads to Supabase storage as {id}.jpg.

Usage:
  1. pip install requests Pillow
  2. Set your Supabase service_role key below (line 25)
  3. python fetch-african-caribbean-photos.py

Falls back to Pexels search if OG image isn't available.
"""

import json, re, requests, io, time, sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow first: pip install Pillow")
    sys.exit(1)

# ═══════════════════════════════════════════════════════════════════
# PASTE YOUR SUPABASE SERVICE ROLE KEY HERE ↓
SUPABASE_SERVICE_KEY = ''
# ═══════════════════════════════════════════════════════════════════

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
PHOTO_DIR = SCRIPT_DIR / 'photos'
PHOTO_DIR.mkdir(exist_ok=True)


def get_og_image(url):
    """Fetch page HTML and extract og:image meta tag."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        html = resp.text[:60000]
        # property="og:image" content="..."
        m = re.search(
            r'<meta\s+(?:property|name)=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
            html, re.IGNORECASE
        )
        if not m:
            # content="..." property="og:image"
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
        print(f"    Page fetch failed: {e}")
    return None


def download_image(url):
    """Download image bytes from URL."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.content
        if len(data) < 1000:
            return None
        return data
    except Exception as e:
        print(f"    Image download failed: {e}")
        return None


def resize_image(data):
    """Resize to 800×600 max and compress as JPEG."""
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


def search_pexels(query):
    """Search Pexels for a food photo fallback."""
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


def upload_to_supabase(data, filename):
    """Upload image to Supabase storage, return public URL."""
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
    if not SUPABASE_SERVICE_KEY:
        print("⚠️  No Supabase service key set!")
        print("   Photos will be saved locally to scripts/photos/")
        print("   Set SUPABASE_SERVICE_KEY on line 25 to upload directly.\n")

    # Load recipes
    with open(RECIPES_PATH) as f:
        all_recipes = json.load(f)

    recipes = [r for r in all_recipes if 8097 <= r['id'] <= 8151]
    print(f"\n{'='*60}")
    print(f"  HARVEST Photo Pipeline — African/Caribbean/Ethiopian")
    print(f"  Recipes: {len(recipes)} (IDs 8097–8151)")
    print(f"  Supabase: {'ready' if SUPABASE_SERVICE_KEY else 'local only'}")
    print(f"{'='*60}\n")

    stats = {'og': 0, 'pexels': 0, 'failed': 0, 'uploaded': 0}
    updates = {}  # id -> supabase URL

    for i, r in enumerate(recipes, 1):
        rid = r['id']
        title = r['title']
        url = r.get('url', '')
        filename = f"{rid}.jpg"

        # Skip if already has a Supabase image
        if r.get('img') and 'supabase.co' in r.get('img', ''):
            print(f"[{i}/{len(recipes)}] {rid} {title} — already has image ✓")
            continue

        print(f"[{i}/{len(recipes)}] {rid} {title}")
        img_data = None

        # Step 1: Try OG image from recipe page
        if url:
            og_url = get_og_image(url)
            if og_url:
                print(f"    OG: {og_url[:80]}...")
                img_data = download_image(og_url)

        # Step 2: Fallback to Pexels
        if not img_data:
            search_term = re.sub(r'[()]', '', title).split(' - ')[0].strip()
            print(f"    Pexels fallback: '{search_term}'")
            pexels_url = search_pexels(search_term)
            if pexels_url:
                img_data = download_image(pexels_url)
                if img_data:
                    stats['pexels'] += 1
            if not img_data:
                print(f"    ✗ No image found")
                stats['failed'] += 1
                time.sleep(0.3)
                continue
        else:
            stats['og'] += 1

        # Resize
        img_data = resize_image(img_data)

        # Save locally
        local_path = PHOTO_DIR / filename
        local_path.write_bytes(img_data)
        print(f"    Saved locally ({len(img_data)//1024}KB)")

        # Upload to Supabase
        if SUPABASE_SERVICE_KEY:
            public_url = upload_to_supabase(img_data, filename)
            if public_url:
                updates[rid] = public_url
                stats['uploaded'] += 1
                print(f"    ✓ Uploaded → {public_url}")

        time.sleep(0.5)

    # Update recipes.json with new image URLs
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
    print(f"  Failed:       {stats['failed']}")
    print(f"  Uploaded:     {stats['uploaded']}")
    print(f"{'='*60}")

    if not SUPABASE_SERVICE_KEY and (stats['og'] + stats['pexels']) > 0:
        print(f"\n📁 Photos saved to: {PHOTO_DIR}")
        print("   To upload them, set SUPABASE_SERVICE_KEY and re-run.")
        print("   Already-downloaded photos will be detected and uploaded.")

    if stats['failed']:
        print(f"\n⚠️  {stats['failed']} recipes still need images.")
        print("   These will show the placeholder on the site.")


if __name__ == '__main__':
    main()
