#!/usr/bin/env python3
"""
Photo Pipeline for HARVEST
===========================

For each scraped recipe:
  1. Try to download the original recipe photo (from img_source)
  2. If that fails, search Pexels for a matching food photo
  3. Upload to Supabase storage as {id}.jpg
  4. Update the recipe's img field with the Supabase URL

Usage:
  python upload-photos.py                           # process scraped-recipes.json
  python upload-photos.py --recipes recipes.json    # process recipes missing photos
  python upload-photos.py --dry-run                 # preview without uploading

Requires:
  pip install requests Pillow
"""

import json
import sys
import time
import io
from pathlib import Path

import requests

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("Warning: Pillow not installed. Photos won't be resized.")
    print("Install with: pip install Pillow")

# ── Config ─────────────────────────────────────────────────────────

PEXELS_API_KEY = 'd2SOQDCAwQdtPjjIZAp395a57B9OVKyqUz3tjgRf5PEAl0JfAmVFkogu'
SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co'
SUPABASE_BUCKET = 'recipe-images'

# You'll need to set this — get it from Supabase dashboard → Settings → API
# Use the service_role key (not anon) for storage uploads
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyNzcyNywiZXhwIjoyMDkyMjAzNzI3fQ.PW58eQ6vioix4tuRvNKzc4R3kW2flZKL4i3_9bGrfhc'  # SET THIS BEFORE RUNNING

SCRIPT_DIR = Path(__file__).parent
PHOTO_DIR = SCRIPT_DIR / 'photos'
DEFAULT_INPUT = SCRIPT_DIR / 'scraped-recipes.json'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

# Target image dimensions
MAX_WIDTH = 800
MAX_HEIGHT = 600
JPEG_QUALITY = 82


# ── Image processing ───────────────────────────────────────────────

def download_image(url):
    """Download an image from a URL."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, stream=True)
        resp.raise_for_status()
        content_type = resp.headers.get('Content-Type', '')
        if 'image' not in content_type and 'octet-stream' not in content_type:
            return None
        data = resp.content
        if len(data) < 1000:  # too small, probably an error page
            return None
        return data
    except Exception as e:
        print(f"    Download failed: {e}")
        return None


def resize_image(data: bytes) -> bytes:
    """Resize and compress image to target dimensions."""
    if not HAS_PIL:
        return data

    try:
        img = Image.open(io.BytesIO(data))

        # Convert to RGB if necessary (handles PNG with alpha, etc.)
        if img.mode in ('RGBA', 'P', 'LA'):
            img = img.convert('RGB')

        # Resize if larger than target
        if img.width > MAX_WIDTH or img.height > MAX_HEIGHT:
            img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.LANCZOS)

        # Save as JPEG
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True)
        return buf.getvalue()
    except Exception as e:
        print(f"    Resize failed: {e}")
        return data


def search_pexels(query):
    """Search Pexels for a food photo, return the medium image URL."""
    try:
        resp = requests.get(
            'https://api.pexels.com/v1/search',
            headers={'Authorization': PEXELS_API_KEY},
            params={'query': f'vegan {query}', 'per_page': 5, 'orientation': 'landscape'},
            timeout=10,
        )
        resp.raise_for_status()
        results = resp.json().get('photos', [])
        if results:
            return results[0]['src']['medium']
    except Exception as e:
        print(f"    Pexels search failed: {e}")
    return None


def upload_to_supabase(data, filename):
    """Upload image bytes to Supabase storage. Returns public URL."""
    if not SUPABASE_SERVICE_KEY:
        # Save locally instead
        PHOTO_DIR.mkdir(exist_ok=True)
        local_path = PHOTO_DIR / filename
        local_path.write_bytes(data)
        print(f"    Saved locally: {local_path}")
        return None

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
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
        return public_url
    except Exception as e:
        print(f"    Upload failed: {e}")
        # Save locally as fallback
        PHOTO_DIR.mkdir(exist_ok=True)
        local_path = PHOTO_DIR / filename
        local_path.write_bytes(data)
        print(f"    Saved locally instead: {local_path}")
        return None


# ── Main pipeline ──────────────────────────────────────────────────

def process_photos(input_file: Path, dry_run: bool = False):
    """Process photos for all recipes in the input file."""
    with open(input_file) as f:
        recipes = json.load(f)

    print(f"\n{'='*60}")
    print(f"HARVEST Photo Pipeline")
    print(f"{'='*60}")
    print(f"Recipes to process: {len(recipes)}")
    print(f"Dry run: {dry_run}")
    print(f"Supabase key set: {'yes' if SUPABASE_SERVICE_KEY else 'no (saving locally)'}")
    print(f"{'='*60}\n")

    stats = {'downloaded': 0, 'pexels': 0, 'failed': 0, 'skipped': 0}

    for i, recipe in enumerate(recipes, 1):
        recipe_id = recipe.get('id', i)
        title = recipe.get('title', 'Unknown')
        img_source = recipe.get('img_source', '')
        existing_img = recipe.get('img', '')

        print(f"\n[{i}/{len(recipes)}] {title} (ID: {recipe_id})")

        # Skip if already has a Supabase URL
        if existing_img and 'supabase.co' in existing_img:
            print(f"  ⏭ Already has Supabase image")
            stats['skipped'] += 1
            continue

        if dry_run:
            print(f"  [DRY RUN] Would process: {img_source or 'Pexels search'}")
            continue

        filename = f"{recipe_id}.jpg"
        img_data = None

        # Step 1: Try original recipe image
        if img_source:
            print(f"  Trying original: {img_source[:80]}...")
            img_data = download_image(img_source)
            if img_data:
                stats['downloaded'] += 1

        # Step 2: Fall back to Pexels
        if not img_data:
            # Build a good search query from the title
            search_query = title.replace('Vegan ', '').replace('vegan ', '')
            print(f"  Searching Pexels: '{search_query}'")
            pexels_url = search_pexels(search_query)
            if pexels_url:
                img_data = download_image(pexels_url)
                if img_data:
                    stats['pexels'] += 1

        if not img_data:
            print(f"  ✗ No image found")
            stats['failed'] += 1
            continue

        # Step 3: Resize
        img_data = resize_image(img_data)
        print(f"  Image size: {len(img_data) / 1024:.0f} KB")

        # Step 4: Upload
        public_url = upload_to_supabase(img_data, filename)
        if public_url:
            recipe['img'] = public_url
            print(f"  ✓ Uploaded: {public_url}")
        else:
            # Local save — set a placeholder URL
            recipe['img'] = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
            print(f"  ℹ Set placeholder URL (upload manually later)")

        # Remove internal img_source field
        if 'img_source' in recipe:
            del recipe['img_source']

        # Be polite
        time.sleep(0.5)

    # Save updated recipes
    with open(input_file, 'w') as f:
        json.dump(recipes, f, indent=2)

    print(f"\n{'='*60}")
    print(f"PHOTO RESULTS")
    print(f"{'='*60}")
    print(f"Downloaded from source: {stats['downloaded']}")
    print(f"From Pexels:           {stats['pexels']}")
    print(f"Failed:                {stats['failed']}")
    print(f"Skipped (existing):    {stats['skipped']}")
    print(f"\nUpdated: {input_file}")


if __name__ == '__main__':
    dry_run = '--dry-run' in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith('--')]

    if '--recipes' in sys.argv:
        idx = sys.argv.index('--recipes')
        if idx + 1 < len(sys.argv):
            input_file = Path(sys.argv[idx + 1])
        else:
            print("Usage: upload-photos.py --recipes <file>")
            sys.exit(1)
    elif args:
        input_file = Path(args[0])
    else:
        input_file = DEFAULT_INPUT

    if not input_file.exists():
        print(f"File not found: {input_file}")
        sys.exit(1)

    process_photos(input_file, dry_run)
