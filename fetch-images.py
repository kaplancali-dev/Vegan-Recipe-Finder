#!/usr/bin/env python3
"""
Fetch hero images for recipes missing photos.

For each recipe without an image:
  1. Visit the recipe URL and extract the hero image from JSON-LD / og:image
  2. Download the image
  3. Upload it to Supabase Storage (recipe-images bucket)
  4. Save the permanent Supabase URL in recipes.json

This ensures images are stored on infrastructure we control and won't break
if the source blog changes their URLs.

Usage:
  python3 fetch-images.py

Requires: requests, beautifulsoup4
  pip3 install requests beautifulsoup4
"""

import json
import re
import time
import os
import sys
import io
import mimetypes

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing required packages...")
    os.system(f"{sys.executable} -m pip install requests beautifulsoup4")
    import requests
    from bs4 import BeautifulSoup

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


def find_recipe_in_jsonld(data):
    """Recursively find a Recipe object in JSON-LD data."""
    if isinstance(data, dict):
        t = data.get("@type", "")
        if isinstance(t, list):
            if "Recipe" in t:
                return data
        elif t == "Recipe":
            return data
        if "@graph" in data:
            for item in data["@graph"]:
                r = find_recipe_in_jsonld(item)
                if r:
                    return r
    elif isinstance(data, list):
        for item in data:
            r = find_recipe_in_jsonld(item)
            if r:
                return r
    return None


def extract_image(recipe_jsonld):
    """Extract best image URL from recipe JSON-LD."""
    img = recipe_jsonld.get("image", "")
    if isinstance(img, list):
        img = img[-1] if img else ""
    if isinstance(img, dict):
        img = img.get("url", "")
    return str(img) if img else ""


def get_hero_image_url(url):
    """Fetch a recipe page and extract the hero image URL."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return None, f"HTTP error: {e}"

    soup = BeautifulSoup(resp.text, "html.parser")

    # Method 1: JSON-LD structured data
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            recipe = find_recipe_in_jsonld(data)
            if recipe:
                img = extract_image(recipe)
                if img:
                    return img, "json-ld"
        except (json.JSONDecodeError, TypeError):
            pass

    # Method 2: og:image meta tag
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return og["content"], "og:image"

    # Method 3: First large image in article
    for img_tag in soup.select("article img, .entry-content img, .post-content img"):
        src = img_tag.get("src") or img_tag.get("data-src") or img_tag.get("data-lazy-src")
        if src and not ("icon" in src or "logo" in src or "avatar" in src):
            return src, "article-img"

    return None, "no image found"


def download_image(img_url):
    """Download an image and return (bytes, content_type, extension)."""
    try:
        resp = requests.get(img_url, headers=HEADERS, timeout=15, stream=True)
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "image/jpeg")
        data = resp.content

        # Determine extension from content type
        if "webp" in content_type:
            ext = "webp"
        elif "png" in content_type:
            ext = "png"
        elif "gif" in content_type:
            ext = "gif"
        else:
            ext = "jpg"

        # Sanity check — at least 5KB for a real image
        if len(data) < 5000:
            return None, None, f"too small ({len(data)} bytes)"

        return data, content_type, ext
    except Exception as e:
        return None, None, f"download error: {e}"


def upload_to_supabase(image_data, content_type, recipe_id, ext):
    """Upload image bytes to Supabase Storage. Returns public URL or None."""
    filename = f"{recipe_id}.{ext}"
    upload_url = f"{SUPABASE_UPLOAD_URL}/{filename}"

    try:
        resp = requests.post(
            upload_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_ANON}",
                "apikey": SUPABASE_ANON,
                "Content-Type": content_type,
                "x-upsert": "true",  # overwrite if exists
            },
            data=image_data,
            timeout=30,
        )
        if resp.status_code in (200, 201):
            public_url = f"{SUPABASE_PUBLIC_URL}/{filename}"
            return public_url
        else:
            return None
    except Exception as e:
        return None


def main():
    # Load recipes
    with open(RECIPES_PATH) as f:
        recipes = json.load(f)

    # Find recipes missing images
    no_img = [(i, r) for i, r in enumerate(recipes) if not r.get("img") and r.get("url")]
    print(f"Found {len(no_img)} recipes missing images\n")

    if not no_img:
        print("All recipes have images!")
        return

    uploaded = 0
    failed = 0
    failed_list = []

    for count, (idx, recipe) in enumerate(no_img):
        rid = recipe["id"]
        url = recipe["url"]
        title = recipe.get("title", "?")

        if count > 0 and count % 10 == 0:
            print(f"\n  Progress: {count}/{len(no_img)} — {uploaded} uploaded, {failed} failed\n")
            # Save progress every 10 recipes
            with open(RECIPES_PATH, "w") as f:
                json.dump(recipes, f)
            print("  (progress saved)")

        # Step 1: Find the image URL on the recipe page
        img_url, method = get_hero_image_url(url)
        if not img_url:
            failed += 1
            failed_list.append(f"  [{rid}] {title} — {url} — {method}")
            print(f"  ✗ [{rid}] {title[:50]}  (no image found)")
            time.sleep(0.3)
            continue

        # Step 2: Download the image
        img_data, content_type, ext = download_image(img_url)
        if not img_data:
            failed += 1
            failed_list.append(f"  [{rid}] {title} — {img_url} — {ext}")
            print(f"  ✗ [{rid}] {title[:50]}  (download failed: {ext})")
            time.sleep(0.3)
            continue

        # Step 3: Upload to Supabase
        public_url = upload_to_supabase(img_data, content_type, rid, ext)
        if public_url:
            recipes[idx]["img"] = public_url
            uploaded += 1
            size_kb = len(img_data) // 1024
            print(f"  ✓ [{rid}] {title[:50]}  ({size_kb}KB → Supabase)")
        else:
            # Fallback: save the source URL directly
            recipes[idx]["img"] = img_url
            uploaded += 1
            print(f"  ~ [{rid}] {title[:50]}  (upload failed, using source URL)")

        time.sleep(0.5)  # Be polite to source sites

    # Final save
    with open(RECIPES_PATH, "w") as f:
        json.dump(recipes, f)

    print(f"\n{'='*60}")
    print(f"Done! {uploaded} images saved, {failed} failed")
    print(f"Updated {RECIPES_PATH}")

    if failed_list:
        print(f"\nFailed recipes:")
        for line in failed_list:
            print(line)

    print(f"\nNext steps:")
    print(f"  cd v2 && npm run build")
    print(f"  Then commit and push to deploy.")


if __name__ == "__main__":
    main()
