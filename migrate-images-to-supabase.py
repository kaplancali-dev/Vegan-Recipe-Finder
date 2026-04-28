#!/usr/bin/env python3
"""
Migrate all hotlinked recipe images to Supabase Storage.

For each recipe with a non-Supabase image:
  1. Download the image from the source blog
  2. Upload it to Supabase Storage (recipe-images bucket)
  3. Update recipes.json with the permanent Supabase URL

Broken images (404, timeout, too small) are logged to broken-images.json
for review/removal.

Saves progress every 50 recipes so you can safely interrupt and resume.

Usage:
  python3 migrate-images-to-supabase.py

Requires: requests
  pip3 install requests
"""

import json
import os
import sys
import time

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system(f"{sys.executable} -m pip install requests")
    import requests

RECIPES_PATH = os.path.join(os.path.dirname(__file__), "v2", "src", "data", "recipes.json")

# Supabase config
SUPABASE_URL = "https://zhncgdbhgkeiybdbzsql.supabase.co"
SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Mjc3MjcsImV4cCI6MjA5MjIwMzcyN30.6kVwmiSaFHWg1Qq1ZWj3HsMXt39GGk77O4Ma4KFim9M"
BUCKET = "recipe-images"
SUPABASE_PUBLIC_URL = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}"
SUPABASE_UPLOAD_URL = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def download_image(img_url):
    """Download an image. Returns (bytes, content_type, ext) or (None, None, error_msg)."""
    try:
        resp = requests.get(img_url, headers=HEADERS, timeout=15, stream=True)
        if resp.status_code >= 400:
            return None, None, f"HTTP {resp.status_code}"
        content_type = resp.headers.get("Content-Type", "image/jpeg")
        data = resp.content

        if "webp" in content_type:
            ext = "webp"
        elif "png" in content_type:
            ext = "png"
        elif "gif" in content_type:
            ext = "gif"
        else:
            ext = "jpg"

        if len(data) < 2000:
            return None, None, f"too small ({len(data)} bytes)"

        return data, content_type, ext
    except Exception as e:
        return None, None, str(e)


def upload_to_supabase(image_data, content_type, recipe_id, ext):
    """Upload image to Supabase Storage. Returns public URL or None."""
    filename = f"{recipe_id}.{ext}"
    upload_url = f"{SUPABASE_UPLOAD_URL}/{filename}"

    try:
        resp = requests.post(
            upload_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_ANON}",
                "apikey": SUPABASE_ANON,
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            data=image_data,
            timeout=30,
        )
        if resp.status_code in (200, 201):
            return f"{SUPABASE_PUBLIC_URL}/{filename}"
        else:
            return None
    except Exception:
        return None


def main():
    with open(RECIPES_PATH) as f:
        recipes = json.load(f)

    # Find all non-Supabase images
    to_migrate = [(i, r) for i, r in enumerate(recipes) if r.get("img") and "supabase" not in r["img"]]

    already_on_supabase = len(recipes) - len(to_migrate)
    print(f"Total recipes: {len(recipes)}")
    print(f"Already on Supabase: {already_on_supabase}")
    print(f"To migrate: {len(to_migrate)}\n")

    if not to_migrate:
        print("All images already on Supabase!")
        return

    migrated = 0
    broken = []
    upload_failed = 0

    for count, (idx, recipe) in enumerate(to_migrate):
        rid = recipe["id"]
        title = recipe.get("title", "?")
        old_img = recipe["img"]

        if count > 0 and count % 50 == 0:
            print(f"\n  === Progress: {count}/{len(to_migrate)} — {migrated} migrated, {len(broken)} broken, {upload_failed} upload failures ===")
            # Save progress
            with open(RECIPES_PATH, "w") as f:
                json.dump(recipes, f)
            print("  (progress saved)\n")

        # Step 1: Download
        img_data, content_type, ext = download_image(old_img)
        if not img_data:
            broken.append({"id": rid, "title": title, "img": old_img, "url": recipe.get("url", ""), "error": ext})
            print(f"  ✗ [{rid}] {title[:45]}  ({ext})")
            time.sleep(0.05)
            continue

        # Step 2: Upload to Supabase
        public_url = upload_to_supabase(img_data, content_type, rid, ext)
        if public_url:
            recipes[idx]["img"] = public_url
            migrated += 1
            size_kb = len(img_data) // 1024
            if count < 20 or count % 100 == 0:
                print(f"  ✓ [{rid}] {title[:45]}  ({size_kb}KB)")
        else:
            upload_failed += 1
            print(f"  ~ [{rid}] {title[:45]}  (upload failed, keeping source URL)")

        time.sleep(0.15)  # Be polite to source servers

    # Final save
    with open(RECIPES_PATH, "w") as f:
        json.dump(recipes, f)

    print(f"\n{'='*60}")
    print(f"Migration complete!")
    print(f"  Migrated to Supabase: {migrated}")
    print(f"  Broken (dead source): {len(broken)}")
    print(f"  Upload failures (kept source URL): {upload_failed}")
    print(f"  Already on Supabase: {already_on_supabase}")
    print(f"  Total recipes: {len(recipes)}")

    if broken:
        broken_path = os.path.join(os.path.dirname(__file__), "broken-images.json")
        with open(broken_path, "w") as f:
            json.dump(broken, f, indent=2)
        print(f"\n{len(broken)} broken images saved to broken-images.json")
        print(f"Review and decide: remove these recipes or find replacement images.")

    print(f"\nNext steps:")
    print(f"  cd v2 && npm run build")
    print(f"  Then commit and push to deploy.")


if __name__ == "__main__":
    main()
