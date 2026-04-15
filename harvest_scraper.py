#!/usr/bin/env python3
"""
HARVEST Recipe Data Scraper
----------------------------
Visits each recipe page in index.html, extracts real ingredients
and nutrition data, and saves a corrected index.html.

Run from the same folder as index.html.
"""

import json
import re
import time
import random
import os
import sys
from pathlib import Path

# ── Check dependencies ────────────────────────────────────────────────────────
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: beautifulsoup4 not installed. Run: pip3 install beautifulsoup4")
    sys.exit(1)

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: playwright not installed. Run: pip3 install playwright && playwright install chromium")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
INDEX_FILE   = Path(__file__).parent / "index.html"
PROGRESS_FILE = Path(__file__).parent / "harvest_progress.json"
OUTPUT_FILE  = Path(__file__).parent / "index_corrected.html"

DELAY_MIN = 2.0   # seconds between requests (be polite)
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
    """Pull all recipe id/title/url entries from the RECIPES array."""
    pattern = r'\{id:(\d+),title:"([^"]+)",site:"([^"]+)",url:"([^"]*)"'
    return re.findall(pattern, content)

# ── Parse schema.org JSON-LD from a page ─────────────────────────────────────
def _collect_recipes(data, out):
    """Recursively collect all Recipe objects from JSON-LD data."""
    if isinstance(data, list):
        for item in data:
            _collect_recipes(item, out)
    elif isinstance(data, dict):
        t = data.get("@type")
        if t == "Recipe" or (isinstance(t, list) and "Recipe" in t):
            out.append(data)
        if "@graph" in data:
            _collect_recipes(data["@graph"], out)

def _title_similarity(a, b):
    """Simple word-overlap ratio between two titles."""
    import re as _re
    wa = set(_re.findall(r'\w+', (a or "").lower()))
    wb = set(_re.findall(r'\w+', (b or "").lower()))
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / max(len(wa), len(wb))

def parse_schema(html, target_title=None, target_url=None):
    """
    Extract the BEST-matching Recipe schema from the page.
    Match by URL first, then by title similarity, then fall back to first Recipe.
    """
    soup = BeautifulSoup(html, "html.parser")
    scripts = soup.find_all("script", type="application/ld+json")
    recipes = []
    for script in scripts:
        try:
            raw = script.string or ""
            data = json.loads(raw)
            _collect_recipes(data, recipes)
        except Exception:
            pass

    if not recipes:
        return None

    # 1. Try matching by URL (@id or mainEntityOfPage or url)
    if target_url:
        tu = target_url.rstrip("/")
        for r in recipes:
            for key in ("@id", "url", "mainEntityOfPage"):
                v = r.get(key)
                if isinstance(v, dict):
                    v = v.get("@id") or v.get("url")
                if isinstance(v, str) and v.rstrip("/") == tu:
                    return r

    # 2. Try matching by title similarity (best match, threshold 0.5)
    if target_title:
        scored = [(_title_similarity(target_title, r.get("name", "")), r) for r in recipes]
        scored.sort(key=lambda x: -x[0])
        if scored and scored[0][0] >= 0.5:
            return scored[0][1]

    # 3. Fall back to first Recipe
    return recipes[0]

def clean_ingredient(raw):
    """Strip quantities and normalize ingredient name."""
    # Remove leading amounts like "1/2 cup", "2 tablespoons", "pinch of"
    raw = raw.strip()
    # Remove HTML tags if any
    raw = re.sub(r"<[^>]+>", "", raw)
    # Remove quantity patterns at start
    raw = re.sub(
        r"^[\d/\.\s]*(cup|cups|tablespoon|tablespoons|tbsp|tsp|teaspoon|teaspoons|"
        r"ounce|ounces|oz|pound|pounds|lb|lbs|gram|grams|g|kg|ml|liter|liters|"
        r"bunch|clove|cloves|slice|slices|piece|pieces|pinch|handful|"
        r"large|medium|small|can|cans|package|packages|bag|bags)s?\s+(of\s+)?",
        "", raw, flags=re.IGNORECASE
    )
    # Remove leading numbers and fractions
    raw = re.sub(r"^[\d\s/\-\.½¼¾⅓⅔⅛]+", "", raw)
    # Remove parenthetical notes like "(optional)" or "(180ml)"
    raw = re.sub(r"\s*\([^)]*\)", "", raw)
    # Remove trailing commas/semicolons
    raw = raw.strip(" ,;.")
    return raw.lower()

def extract_nutrition(schema_data):
    """Pull cal/pro/carb/fat/fib from schema nutrition node."""
    nut = schema_data.get("nutrition", {})
    if not nut:
        return None
    def num(val):
        if val is None:
            return 0
        return round(float(re.sub(r"[^\d.]", "", str(val)) or 0), 1)
    return {
        "cal":  num(nut.get("calories")),
        "pro":  num(nut.get("proteinContent")),
        "carb": num(nut.get("carbohydrateContent")),
        "fat":  num(nut.get("fatContent")),
        "fib":  num(nut.get("fiberContent")),
    }

def extract_ingredients(schema_data):
    """Pull ingredient list from schema recipeIngredient."""
    raw_list = schema_data.get("recipeIngredient", [])
    cleaned = []
    seen = set()
    for item in raw_list:
        name = clean_ingredient(str(item))
        if name and name not in seen and len(name) > 1:
            cleaned.append(name)
            seen.add(name)
    return cleaned

# ── Search for URL when recipe has none ──────────────────────────────────────
def find_url(page, title, site):
    """Use DuckDuckGo to find a recipe URL by title + site."""
    query = f'"{title}" site recipe {site}'
    search_url = f"https://duckduckgo.com/?q={query.replace(' ', '+')}&ia=web"
    try:
        page.goto(search_url, timeout=15000)
        time.sleep(2)
        # Grab first result link
        links = page.query_selector_all("a[href*='http']")
        for link in links:
            href = link.get_attribute("href") or ""
            # Skip DuckDuckGo internal links
            if "duckduckgo.com" in href or "duck.co" in href:
                continue
            # Skip social/non-recipe sites
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
    """Replace the ing:[...] and nut:{...} for a given recipe id."""
    ing_str  = json.dumps(ingredients)
    nut_str  = (f"{{cal:{nutrition['cal']},pro:{nutrition['pro']},"
                f"carb:{nutrition['carb']},fat:{nutrition['fat']},fib:{nutrition['fib']}}}")

    # Pattern to match the full recipe object line by line
    # Match ing:[...] for this recipe
    id_pattern = rf'(id:{recipe_id},title:"[^"]+",site:"[^"]+",url:")([^"]*)(")([^{{]*)'

    # Update URL if we found one
    if new_url:
        content = re.sub(id_pattern,
                         lambda m: m.group(1) + new_url + m.group(3) + m.group(4),
                         content)

    # Find the recipe block and update ing + nut
    # We look for the recipe id then replace the next ing:[...] and nut:{...}
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
    print("\n🌿 HARVEST Recipe Scraper")
    print("=" * 50)

    if not INDEX_FILE.exists():
        print(f"ERROR: Cannot find {INDEX_FILE}")
        print("Make sure this script is in the same folder as index.html")
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
        browser = p.chromium.launch(headless=False)  # headless=False so you can see it working
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        for i, (rid, title, site, url) in enumerate(remaining):
            print(f"\n[{i+1}/{len(remaining)}] {title} ({site})")

            # Find URL if missing
            if not url:
                print(f"  No URL — searching...")
                url = find_url(page, title, site)
                if url:
                    print(f"  Found: {url}")
                else:
                    print(f"  ⚠️  Could not find URL — skipping")
                    failed.append({"id": rid, "title": title, "site": site, "reason": "URL not found"})
                    continue

            # Fetch page
            try:
                print(f"  Fetching: {url}")
                page.goto(url, timeout=20000, wait_until="domcontentloaded")
                time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
                html = page.content()
            except Exception as e:
                print(f"  ⚠️  Failed to load page: {e}")
                failed.append({"id": rid, "title": title, "site": site, "reason": str(e)})
                continue

            # Parse schema (match by title/url so we pick the right Recipe)
            schema = parse_schema(html, target_title=title, target_url=url)
            if not schema:
                print(f"  ⚠️  No schema.org/Recipe found — skipping")
                failed.append({"id": rid, "title": title, "site": site, "reason": "No schema found"})
                continue

            # Extract data
            ingredients = extract_ingredients(schema)
            nutrition   = extract_nutrition(schema)

            if not ingredients:
                print(f"  ⚠️  No ingredients found — skipping")
                failed.append({"id": rid, "title": title, "site": site, "reason": "No ingredients"})
                continue

            if not nutrition:
                print(f"  ⚠️  No nutrition data — keeping existing")
                # Keep existing nutrition by reading from current content
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

            # Save to progress
            progress[rid] = {
                "title": title,
                "url": url,
                "ing": ingredients,
                "nut": nutrition
            }
            save_progress(progress)

        browser.close()

    # Apply all corrections to content
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
        print(f"   (These will need manual correction)")

    print("\nNext step: Review index_corrected.html, then rename it to index.html and push to GitHub.")

if __name__ == "__main__":
    main()
