#!/usr/bin/env python3
"""
HARVEST Recipe Data Scraper
----------------------------
Visits each recipe page in index.html, extracts ingredients and nutrition
using the recipe-scrapers library (500+ sites with site-specific extractors,
falls back to schema.org/Recipe JSON-LD), and saves a corrected index.html.

Run from the same folder as index.html.
"""

import json
import re
import time
import random
import sys
from pathlib import Path

# ── Check dependencies ────────────────────────────────────────────────────────
try:
    from recipe_scrapers import scrape_html
except ImportError:
    print("ERROR: recipe-scrapers not installed. Run: pip3 install recipe-scrapers")
    sys.exit(1)

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: playwright not installed. Run: pip3 install playwright && playwright install chromium")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
INDEX_FILE    = Path(__file__).parent / "index.html"
PROGRESS_FILE = Path(__file__).parent / "harvest_progress.json"
OUTPUT_FILE   = Path(__file__).parent / "index_corrected.html"

DELAY_MIN = 2.0
DELAY_MAX = 4.0

# ── Load progress (resume if interrupted) ─────────────────────────────────────
def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {}

def save_progress(progress):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)

# ── Extract recipes from index.html ──────────────────────────────────────────
def extract_recipes(content):
    pattern = r'\{id:(\d+),title:"([^"]+)",site:"([^"]+)",url:"([^"]*)"'
    return re.findall(pattern, content)

# ── Clean ingredient text (strip quantities) ─────────────────────────────────
def clean_ingredient(raw):
    raw = raw.strip()
    raw = re.sub(r"<[^>]+>", "", raw)
    raw = re.sub(
        r"^[\d/\.\s]*(cup|cups|tablespoon|tablespoons|tbsp|tsp|teaspoon|teaspoons|"
        r"ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|kg|ml|liter|liters|"
        r"bunch|clove|cloves|slice|slices|piece|pieces|pinch|handful|"
        r"large|medium|small|can|cans|package|packages|bag|bags)s?\s+(of\s+)?",
        "", raw, flags=re.IGNORECASE
    )
    raw = re.sub(r"^[\d\s/\-\.½¼¾⅓⅔⅛]+", "", raw)
    raw = re.sub(r"\s*\([^)]*\)", "", raw)
    raw = raw.strip(" ,;.")
    return raw.lower()

# ── Extract ingredients + nutrition using recipe-scrapers ────────────────────
def extract_from_html(html, url):
    """
    Returns (ingredients, nutrition) or (None, None) on failure.
    Uses recipe-scrapers which handles 500+ sites with site-specific extractors
    and falls back to schema.org/Recipe JSON-LD.
    """
    try:
        scraper = scrape_html(html, org_url=url)
    except Exception as e:
        print(f"    scrape_html failed: {e}")
        return None, None

    # Ingredients
    try:
        raw_ings = scraper.ingredients() or []
    except Exception:
        raw_ings = []

    cleaned = []
    seen = set()
    for item in raw_ings:
        name = clean_ingredient(str(item))
        if name and name not in seen and len(name) > 1:
            cleaned.append(name)
            seen.add(name)

    # Nutrition
    nutrition = None
    try:
        nut_raw = scraper.nutrients() or {}
    except Exception:
        nut_raw = {}

    if nut_raw:
        def num(val):
            if val is None:
                return 0
            m = re.sub(r"[^\d.]", "", str(val))
            try:
                return round(float(m), 1) if m else 0
            except ValueError:
                return 0
        nutrition = {
            "cal":  num(nut_raw.get("calories")),
            "pro":  num(nut_raw.get("proteinContent")),
            "carb": num(nut_raw.get("carbohydrateContent")),
            "fat":  num(nut_raw.get("fatContent")),
            "fib":  num(nut_raw.get("fiberContent")),
        }

    return cleaned, nutrition

# ── Search for URL when recipe has none ──────────────────────────────────────
def find_url(page, title, site):
    query = f'"{title}" site recipe {site}'
    search_url = f"https://duckduckgo.com/?q={query.replace(' ', '+')}&ia=web"
    try:
        page.goto(search_url, timeout=15000)
        time.sleep(2)
        links = page.query_selector_all("a[href*='http']")
        for link in links:
            href = link.get_attribute("href") or ""
            if "duckduckgo.com" in href or "duck.co" in href:
                continue
            skip = ["twitter","facebook","instagram","pinterest","youtube","reddit","amazon"]
            if any(s in href for s in skip):
                continue
            if title.split()[0].lower() in href.lower() or site.lower().replace(" ","") in href.lower():
                return href
    except Exception as e:
        print(f"    Search failed: {e}")
    return None

# ── Update a recipe in the HTML content ──────────────────────────────────────
def update_recipe_in_html(content, recipe_id, ingredients, nutrition, new_url=None):
    id_pattern = rf'(id:{recipe_id},title:"[^"]+",site:"[^"]+",url:")([^"]*)(")([^{{]*)'
    if new_url:
        content = re.sub(id_pattern,
                         lambda m: m.group(1) + new_url + m.group(3) + m.group(4),
                         content)

    recipe_block_pattern = rf'(id:{recipe_id}[^\n]*\n[^\n]*ing:\[)[^\]]*(\])'
    content = re.sub(recipe_block_pattern,
                     lambda m: m.group(1) + ",".join(f'"{i}"' for i in ingredients) + m.group(2),
                     content)

    nut_pattern = rf'(id:{recipe_id}.*?nut:\{{)([^}}]*)(\}})'
    content = re.sub(nut_pattern,
                     lambda m: (m.group(1) +
                                f"cal:{nutrition['cal']},pro:{nutrition['pro']},"
                                f"carb:{nutrition['carb']},fat:{nutrition['fat']},fib:{nutrition['fib']}" +
                                m.group(3)),
                     content, flags=re.DOTALL)
    return content

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("\n🌿 HARVEST Recipe Scraper (recipe-scrapers backend)")
    print("=" * 50)

    if not INDEX_FILE.exists():
        print(f"ERROR: Cannot find {INDEX_FILE}")
        sys.exit(1)

    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    recipes = extract_recipes(content)
    print(f"Found {len(recipes)} recipes in index.html")

    progress = load_progress()
    already_done = set(progress.keys())
    remaining = [r for r in recipes if r[0] not in already_done]
    print(f"Already processed: {len(already_done)} | Remaining: {len(remaining)}")
    print("=" * 50)

    failed = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        for i, (rid, title, site, url) in enumerate(remaining):
            print(f"\n[{i+1}/{len(remaining)}] {title} ({site})")

            if not url:
                print(f"  No URL — searching...")
                url = find_url(page, title, site)
                if url:
                    print(f"  Found: {url}")
                else:
                    print(f"  ⚠️  Could not find URL — skipping")
                    failed.append({"id": rid, "title": title, "site": site, "reason": "URL not found"})
                    continue

            try:
                print(f"  Fetching: {url}")
                page.goto(url, timeout=20000, wait_until="domcontentloaded")
                time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
                html = page.content()
            except Exception as e:
                print(f"  ⚠️  Failed to load page: {e}")
                failed.append({"id": rid, "title": title, "site": site, "reason": str(e)})
                continue

            ingredients, nutrition = extract_from_html(html, url)

            if not ingredients:
                print(f"  ⚠️  No ingredients found — skipping")
                failed.append({"id": rid, "title": title, "site": site, "reason": "No ingredients"})
                continue

            if not nutrition:
                print(f"  ⚠️  No nutrition data — keeping existing")
                nut_match = re.search(rf'id:{rid}.*?nut:\{{([^}}]*)\}}', content, re.DOTALL)
                if nut_match:
                    nut_raw = nut_match.group(1)
                    def val(key):
                        m = re.search(rf'{key}:([\d.]+)', nut_raw)
                        return float(m.group(1)) if m else 0
                    nutrition = {"cal": val("cal"), "pro": val("pro"), "carb": val("carb"),
                                 "fat": val("fat"), "fib": val("fib")}
                else:
                    nutrition = {"cal": 0, "pro": 0, "carb": 0, "fat": 0, "fib": 0}

            print(f"  ✅ {len(ingredients)} ingredients | "
                  f"{nutrition['cal']} cal, {nutrition['pro']}g protein")
            print(f"     Ingredients: {', '.join(ingredients[:5])}{'...' if len(ingredients)>5 else ''}")

            progress[rid] = {
                "title": title,
                "url": url,
                "ing": ingredients,
                "nut": nutrition
            }
            save_progress(progress)

        browser.close()

    print("\n\n📝 Applying corrections to index.html...")
    for rid, data in progress.items():
        content = update_recipe_in_html(
            content, rid,
            data["ing"], data["nut"],
            data.get("url") if data.get("url") else None
        )

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"\n✅ Done! Corrected file saved as: index_corrected.html")
    print(f"   Processed: {len(progress)} recipes")
    print(f"   Failed/skipped: {len(failed)} recipes")

    if failed:
        failed_file = Path(__file__).parent / "harvest_failed.json"
        with open(failed_file, "w") as f:
            json.dump(failed, f, indent=2)
        print(f"   Failed recipes saved to: harvest_failed.json")

    print("\nNext step: Review index_corrected.html, then rename it to index.html and push to GitHub.")

if __name__ == "__main__":
    main()
