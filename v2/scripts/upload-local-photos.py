#!/usr/bin/env python3
"""Upload all local photos from the photos/ folder to Supabase storage."""

import time
from pathlib import Path
import requests

SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co'
SUPABASE_BUCKET = 'recipe-images'
SUPABASE_SERVICE_KEY = ''  # SET THIS BEFORE RUNNING

PHOTO_DIR = Path(__file__).parent / 'photos'

photos = sorted(PHOTO_DIR.glob('*.jpg'))
print(f"Found {len(photos)} photos to upload\n")

uploaded = 0
failed = 0

for i, photo in enumerate(photos, 1):
    filename = photo.name
    data = photo.read_bytes()

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
        uploaded += 1
        print(f"[{i}/{len(photos)}] Uploaded {filename} ({len(data)/1024:.0f} KB)")
    except Exception as e:
        failed += 1
        print(f"[{i}/{len(photos)}] FAILED {filename}: {e}")

    if i % 20 == 0:
        time.sleep(1)

print(f"\nDone! Uploaded: {uploaded}, Failed: {failed}")
