#!/usr/bin/env python3
"""
Universal vegan recipe scraper for multiple sites.
Uses JSON-LD structured data (Schema.org Recipe) and sitemap/category crawling.
Falls back to Playwright (headless Chrome) for sites that block requests.

Usage:
    python3 scrape-multi.py                    # scrape all sites
    python3 scrape-multi.py veganricha ohsheglows  # scrape specific sites

Install for Playwright fallback (optional):
    pip3 install playwright && playwright install chromium

Sites: veganricha, ohsheglows, loveandlemons, plantyou,
       itdoesnttastelikechicken, forksoverknives, bestofvegan
"""

import json
import re
import time
import sys
import random
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

OUTPUT_DIR = Path(__file__).parent

# ── Realistic browser headers ───────────────────────────────────
# Full Chrome-on-Mac header set to avoid bot detection

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
]

def _make_headers(referer=None):
    """Build realistic browser headers with a random User-Agent."""
    h = {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none' if not referer else 'same-origin',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
    }
    if referer:
        h['Referer'] = referer
    return h

HEADERS = _make_headers()  # default set for backward compat

# ── Playwright (headless Chrome) fallback ───────────────────────

_playwright = None
_browser = None
_pw_page = None

def _pw_available():
    """Check if Playwright is installed."""
    try:
        import playwright
        return True
    except ImportError:
        return False

def _pw_launch():
    """Launch headless Chromium via Playwright. Returns a page object."""
    global _playwright, _browser, _pw_page
    if _pw_page:
        return _pw_page
    from playwright.sync_api import sync_playwright
    _playwright = sync_playwright().start()
    _browser = _playwright.chromium.launch(headless=True)
    ctx = _browser.new_context(
        user_agent=USER_AGENTS[0],
        viewport={'width': 1440, 'height': 900},
        locale='en-US',
    )
    _pw_page = ctx.new_page()
    return _pw_page

def _pw_fetch(url, timeout=20000):
    """Fetch a page using Playwright. Returns HTML string or None."""
    page = _pw_launch()
    try:
        page.goto(url, timeout=timeout, wait_until='domcontentloaded')
        time.sleep(1)  # let JS execute
        return page.content()
    except Exception as e:
        print(f'    Playwright error: {e}')
        return None

def _pw_close():
    """Clean up Playwright resources."""
    global _playwright, _browser, _pw_page
    try:
        if _browser:
            _browser.close()
        if _playwright:
            _playwright.stop()
    except Exception:
        pass
    _playwright = _browser = _pw_page = None


def fetch_page(url, referer=None, use_playwright=False):
    """Fetch a URL — tries requests first, falls back to Playwright if blocked."""
    headers = _make_headers(referer=referer)

    if not use_playwright:
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 403 and _pw_available():
                print(f'(403 → trying Playwright) ', end='', flush=True)
                html = _pw_fetch(url)
                if html:
                    return html, 200
                return None, 403
            return resp.text if resp.status_code == 200 else None, resp.status_code
        except Exception as e:
            if _pw_available():
                html = _pw_fetch(url)
                if html:
                    return html, 200
            return None, str(e)
    else:
        html = _pw_fetch(url)
        return (html, 200) if html else (None, 'playwright failed')

# ── Site configs ─────────────────────────────────────────────────

SITES = {
    'veganricha': {
        'name': 'Vegan Richa',
        'base': 'https://www.veganricha.com',
        'method': 'category',      # use category crawling (sitemap blocked)
        'category_urls': [
            'https://www.veganricha.com/recipes/',
            'https://www.veganricha.com/category/entree/',
            'https://www.veganricha.com/category/appetizer-snack/',
            'https://www.veganricha.com/category/soup/',
            'https://www.veganricha.com/category/dessert/',
            'https://www.veganricha.com/category/breakfast/',
            'https://www.veganricha.com/category/side-dish/',
            'https://www.veganricha.com/category/drinks/',
            'https://www.veganricha.com/category/sauce-condiment/',
        ],
        'max_pages': 50,
        'vegan_only': True,
        'delay': 2.0,        # slower to avoid blocking
        'output': 'veganricha-recipes.json',
    },
    'ohsheglows': {
        'name': 'Oh She Glows',
        'base': 'https://ohsheglows.com',
        'method': 'category',
        'category_urls': [
            'https://ohsheglows.com/categories/recipes-2/',
        ],
        'max_pages': 80,
        'vegan_only': True,
        'use_playwright': True,   # site blocks requests, need headless Chrome
        'delay': 2.0,
        'output': 'ohsheglows-recipes.json',
    },
    'loveandlemons': {
        'name': 'Love and Lemons',
        'base': 'https://www.loveandlemons.com',
        'method': 'sitemap',
        'sitemap_url': 'https://www.loveandlemons.com/post-sitemap.xml',
        'sitemap_fallbacks': [
            'https://www.loveandlemons.com/post-sitemap1.xml',
            'https://www.loveandlemons.com/post-sitemap2.xml',
            'https://www.loveandlemons.com/post-sitemap3.xml',
            'https://www.loveandlemons.com/sitemap_index.xml',
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': False,   # must filter dairy
        'delay': 0.5,
        'output': 'loveandlemons-recipes.json',
    },
    'plantyou': {
        'name': 'PlantYou',
        'base': 'https://plantyou.com',
        'method': 'sitemap',
        'sitemap_url': 'https://plantyou.com/post-sitemap.xml',
        'sitemap_fallbacks': [
            'https://plantyou.com/post-sitemap1.xml',
            'https://plantyou.com/post-sitemap2.xml',
            'https://plantyou.com/sitemap_index.xml',
            'https://plantyou.com/sitemap.xml',
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': True,
        'delay': 0.5,
        'output': 'plantyou-recipes.json',
    },
    'itdoesnttastelikechicken': {
        'name': "It Doesn't Taste Like Chicken",
        'base': 'https://itdoesnttastelikechicken.com',
        'method': 'sitemap',
        'sitemap_url': 'https://itdoesnttastelikechicken.com/post-sitemap.xml',
        'sitemap_fallbacks': [
            'https://itdoesnttastelikechicken.com/post-sitemap1.xml',
            'https://itdoesnttastelikechicken.com/post-sitemap2.xml',
            'https://itdoesnttastelikechicken.com/sitemap_index.xml',
            'https://itdoesnttastelikechicken.com/sitemap.xml',
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': True,
        'delay': 0.5,
        'output': 'idtlc-recipes.json',
    },
    'forksoverknives': {
        'name': 'Forks Over Knives',
        'base': 'https://www.forksoverknives.com',
        'method': 'sitemap',
        'sitemap_url': 'https://www.forksoverknives.com/sitemap.xml',
        'sitemap_fallbacks': [
            'https://www.forksoverknives.com/recipes-sitemap.xml',
            'https://www.forksoverknives.com/post-sitemap.xml',
            'https://www.forksoverknives.com/post-sitemap1.xml',
            'https://www.forksoverknives.com/post-sitemap2.xml',
            'https://www.forksoverknives.com/sitemap_index.xml',
        ],
        'url_filter': lambda u: '/recipes/' in u,
        'vegan_only': True,
        'delay': 0.5,
        'output': 'forksoverknives-recipes.json',
    },
    'bestofvegan': {
        'name': 'Best of Vegan',
        'base': 'https://bestofvegan.com',
        'method': 'sitemap',
        'sitemap_url': 'https://bestofvegan.com/post-sitemap.xml',
        'sitemap_fallbacks': [
            'https://bestofvegan.com/post-sitemap1.xml',
            'https://bestofvegan.com/post-sitemap2.xml',
            'https://bestofvegan.com/sitemap_index.xml',
            'https://bestofvegan.com/sitemap.xml',
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': True,
        'delay': 0.5,
        'output': 'bestofvegan-recipes.json',
    },
}

# ── Dairy filter ─────────────────────────────────────────────────

DAIRY_WORDS = [
    'milk chocolate', 'dairy milk', 'cow milk', 'whole milk', 'skim milk',
    '2% milk', '1% milk', 'evaporated milk', 'condensed milk', 'powdered milk',
    'heavy cream', 'whipping cream', 'sour cream', 'cream cheese',
    'half-and-half', 'half and half',
    'cheddar', 'parmesan cheese', 'parmigiano', 'mozzarella cheese', 'gruyere',
    'ricotta cheese', 'goat cheese', 'feta cheese', 'brie', 'camembert',
    'provolone', 'swiss cheese', 'colby', 'monterey jack',
    'butter ', 'unsalted butter', 'salted butter', 'ghee',
    'butter,', 'butter.', 'of butter',
    'yogurt', 'yoghurt', 'kefir',
    'egg ', 'eggs ', 'egg,', 'eggs,', 'egg.', 'eggs.', 'egg white', 'egg yolk',
    'large egg', 'medium egg', 'small egg', 'beaten egg',
    'honey',
    'mayonnaise',
    'gelatin', 'gelatine',
    'whey', 'casein', 'lactose',
]

VEGAN_EXCEPTIONS = [
    'vegan butter', 'plant butter', 'plant-based butter', 'coconut butter',
    'nut butter', 'almond butter', 'peanut butter', 'cashew butter',
    'sunflower butter', 'cocoa butter', 'shea butter', 'seed butter',
    'vegan yogurt', 'vegan yoghurt', 'coconut yogurt', 'coconut yoghurt',
    'soy yogurt', 'soy yoghurt', 'plant yogurt', 'dairy-free yogurt',
    'vegan cream', 'coconut cream', 'cashew cream', 'oat cream',
    'vegan cheese', 'nutritional yeast', 'vegan parmesan', 'nooch',
    'vegan mozzarella', 'vegan cheddar', 'vegan feta',
    'dairy-free cheese', 'plant-based cheese',
    'coconut milk', 'almond milk', 'oat milk', 'soy milk', 'rice milk',
    'plant milk', 'cashew milk', 'hemp milk', 'dairy-free milk',
    'non-dairy milk', 'nondairy milk',
    'vegan egg', 'flax egg', 'chia egg', 'egg replacer', 'egg substitute',
    'just egg', "bob's red mill egg",
    'vegan honey', 'agave', 'bee free honee',
    'vegan mayo', 'vegan mayonnaise', 'vegenaise', 'just mayo',
    'aquafaba',
    'butterbeans', 'butter beans', 'butterbean', 'butter bean',
    'butternut', 'butterfly', 'buttercup', 'butterscotch',
    'butterhead', 'butter lettuce', 'bread and butter',
    'eggplant', 'egg roll wrapper', 'egg roll',
]


def is_dairy(ingredient):
    ing_lower = ingredient.lower().strip()
    for exc in VEGAN_EXCEPTIONS:
        if exc in ing_lower:
            return False
    for dairy in DAIRY_WORDS:
        if dairy in ing_lower:
            return True
    return False


def has_dairy(ingredients):
    return any(is_dairy(i) for i in ingredients)


# ── URL collection ───────────────────────────────────────────────

def fetch_sitemap_urls(sitemap_url):
    """Fetch URLs from a sitemap XML. Handles sitemap indexes recursively."""
    try:
        resp = requests.get(sitemap_url, headers=_make_headers(), timeout=15)
        if resp.status_code != 200:
            return []
    except Exception:
        return []

    urls = []
    try:
        root = ET.fromstring(resp.content)
        ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

        # Check if sitemap index
        sitemaps = root.findall('.//sm:sitemap/sm:loc', ns)
        if sitemaps:
            print(f'  Sitemap index with {len(sitemaps)} sub-sitemaps')
            for sm in sitemaps:
                sub_url = sm.text.strip()
                # Only fetch post/recipe sitemaps, skip authors/categories/tags
                sub_lower = sub_url.lower()
                if any(skip in sub_lower for skip in ['author', 'category', 'tag-', 'page-']):
                    print(f'    Skipping {sub_url}')
                    continue
                print(f'    Fetching {sub_url}...')
                sub_urls = fetch_sitemap_urls(sub_url)
                print(f'      → {len(sub_urls)} URLs')
                urls.extend(sub_urls)
                time.sleep(0.3)
        else:
            # Regular sitemap
            locs = root.findall('.//sm:url/sm:loc', ns)
            urls = [loc.text.strip() for loc in locs if loc.text]
    except ET.ParseError:
        pass

    return urls


def crawl_category_pages(config):
    """Crawl paginated category/archive pages to find recipe URLs."""
    all_urls = set()
    base = config['base']
    max_pages = config.get('max_pages', 30)
    delay = config.get('delay', 1.0)
    use_pw = config.get('use_playwright', False)
    pw_tried = False

    for cat_url in config.get('category_urls', []):
        print(f'  Crawling {cat_url}')
        page_num = 1

        while page_num <= max_pages:
            if page_num == 1:
                url = cat_url
            else:
                url = cat_url.rstrip('/') + f'/page/{page_num}/'

            html, status = fetch_page(url, referer=base, use_playwright=use_pw)

            if status == 404:
                print(f'    Page {page_num}: 404, done with this category')
                break
            if html is None:
                # If requests got blocked, try Playwright for the whole site
                if not pw_tried and not use_pw and _pw_available():
                    print(f'    Page {page_num}: HTTP {status} — switching to Playwright')
                    use_pw = True
                    pw_tried = True
                    html, status = fetch_page(url, use_playwright=True)
                    if html is None:
                        print(f'    Page {page_num}: Playwright also failed')
                        break
                else:
                    print(f'    Page {page_num}: HTTP {status}')
                    break

            soup = BeautifulSoup(html, 'html.parser')

            # Find recipe links
            links = set()
            for a in soup.select('article a[href], .entry-title a[href], h2 a[href], h3 a[href], .post-title a[href]'):
                href = a.get('href', '')
                if not href:
                    continue
                href = href.rstrip('/')
                # Must be on same domain
                if not href.startswith(base):
                    continue
                # Skip category/tag/page URLs
                if any(skip in href for skip in ['/category/', '/tag/', '/page/', '/author/']):
                    continue
                links.add(href)

            # Also try broader link search if nothing found
            if not links:
                for a in soup.select('a[href]'):
                    href = a.get('href', '')
                    if not href:
                        continue
                    href = href.rstrip('/')
                    if href.startswith(base) and href.count('/') >= 4:
                        if not any(skip in href for skip in ['/category/', '/tag/', '/page/', '/author/', '#', '?']):
                            links.add(href)

            new = links - all_urls
            all_urls.update(links)
            print(f'    Page {page}: {len(new)} new URLs (total: {len(all_urls)})')

            if not new:
                break

            page_num += 1
            time.sleep(delay)

    return list(all_urls)


def get_urls_for_site(config):
    """Get all candidate recipe URLs for a site."""
    method = config.get('method', 'sitemap')

    if method == 'category':
        return crawl_category_pages(config)

    # Sitemap method
    urls = []
    print(f'  Trying {config["sitemap_url"]}...')
    urls = fetch_sitemap_urls(config['sitemap_url'])

    if not urls:
        for fb in config.get('sitemap_fallbacks', []):
            print(f'  Trying fallback {fb}...')
            urls = fetch_sitemap_urls(fb)
            if urls:
                break
            time.sleep(0.3)

    # If sitemap failed, fall back to category crawling if configured
    if not urls and config.get('category_urls'):
        print(f'  Sitemaps failed, falling back to category crawling...')
        urls = crawl_category_pages(config)

    # Apply URL filter
    url_filter = config.get('url_filter')
    if url_filter and urls:
        before = len(urls)
        urls = [u for u in urls if url_filter(u)]
        print(f'  Filtered: {before} → {len(urls)} URLs')

    # Deduplicate
    urls = list(dict.fromkeys(u.rstrip('/') for u in urls))

    return urls


# ── Recipe extraction ────────────────────────────────────────────

def _find_recipe_in_jsonld(data):
    """Recursively search for a Recipe object in JSON-LD data."""
    if isinstance(data, dict):
        rtype = data.get('@type', '')
        # @type can be a string or a list
        if isinstance(rtype, str) and rtype == 'Recipe':
            return data
        if isinstance(rtype, list) and 'Recipe' in rtype:
            return data
        # Check @graph
        if '@graph' in data:
            result = _find_recipe_in_jsonld(data['@graph'])
            if result:
                return result
        # Check nested objects
        for key, val in data.items():
            if isinstance(val, (dict, list)):
                result = _find_recipe_in_jsonld(val)
                if result:
                    return result
    elif isinstance(data, list):
        for item in data:
            result = _find_recipe_in_jsonld(item)
            if result:
                return result
    return None


def extract_recipe(url, site_name, vegan_only, use_playwright=False):
    """Extract recipe data from a page using JSON-LD."""
    html, status = fetch_page(url, use_playwright=use_playwright)
    if html is None:
        return None, f'HTTP {status}'

    soup = BeautifulSoup(html, 'html.parser')

    # Find JSON-LD — use recursive search to handle any nesting
    recipe_data = None
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            recipe_data = _find_recipe_in_jsonld(data)
            if recipe_data:
                break
        except (json.JSONDecodeError, TypeError):
            continue

    if not recipe_data:
        return None, 'no JSON-LD recipe'

    # Ingredients
    ingredients = recipe_data.get('recipeIngredient', [])
    if not ingredients:
        return None, 'no ingredients'

    # Dairy filter
    if has_dairy(ingredients):
        dairy_items = [i for i in ingredients if is_dairy(i)]
        return None, f'dairy: {dairy_items[0][:50]}'

    # Title
    title = recipe_data.get('name', '').strip()
    if not title:
        return None, 'no title'

    # Image
    img = ''
    img_data = recipe_data.get('image', '')
    if isinstance(img_data, list) and img_data:
        first = img_data[0]
        img = first if isinstance(first, str) else (first.get('url', '') if isinstance(first, dict) else '')
    elif isinstance(img_data, dict):
        img = img_data.get('url', '')
    elif isinstance(img_data, str):
        img = img_data

    # Strip WordPress size suffixes for full-size image
    if img:
        img = re.sub(r'-\d+x\d+(\.\w+)$', r'\1', img)

    # Nutrition
    nut = {}
    nutrition = recipe_data.get('nutrition', {})
    if nutrition and isinstance(nutrition, dict):
        cal = nutrition.get('calories', '')
        if cal:
            cal_num = re.search(r'[\d.]+', str(cal))
            if cal_num:
                nut['cal'] = round(float(cal_num.group()))
        for key, field in [('pro', 'proteinContent'), ('carb', 'carbohydrateContent'),
                           ('fat', 'fatContent'), ('fib', 'fiberContent')]:
            val = nutrition.get(field, '')
            if val:
                num = re.search(r'[\d.]+', str(val))
                if num:
                    nut[key] = round(float(num.group()), 1)

    # Time
    cook_time = 0
    total_time = recipe_data.get('totalTime', '') or recipe_data.get('cookTime', '')
    if total_time:
        hours = re.search(r'(\d+)H', str(total_time))
        mins = re.search(r'(\d+)M', str(total_time))
        if hours:
            cook_time += int(hours.group(1)) * 60
        if mins:
            cook_time += int(mins.group(1))

    # Servings
    servings = 0
    yield_val = recipe_data.get('recipeYield', '')
    if yield_val:
        if isinstance(yield_val, list):
            yield_val = yield_val[0]
        num = re.search(r'\d+', str(yield_val))
        if num:
            servings = int(num.group())

    return {
        'title': title,
        'url': url,
        'site': site_name,
        'img': img,
        'ing': ingredients,
        'nut': nut,
        'time': cook_time,
        'servings': servings,
    }, None


# ── Main ─────────────────────────────────────────────────────────

def scrape_site(key, config):
    """Scrape a single site and save results."""
    print(f'\n{"="*60}')
    print(f'  {config["name"]}')
    print(f'{"="*60}\n')

    # Step 1: Get URLs
    print('Step 1: Collecting URLs...\n')
    urls = get_urls_for_site(config)
    print(f'\n  Found {len(urls)} candidate URLs\n')

    if not urls:
        print('  No URLs found. Skipping.\n')
        return 0

    # Step 2: Extract recipes
    print('Step 2: Extracting recipes...\n')
    recipes = []
    skipped_dairy = 0
    skipped_no_recipe = 0
    skipped_other = 0
    errors = 0
    delay = config.get('delay', 0.5)

    use_pw = config.get('use_playwright', False)
    consecutive_errors = 0

    for i, url in enumerate(urls, 1):
        slug = url.rstrip('/').split('/')[-1][:45]
        print(f'  [{i}/{len(urls)}] {slug}... ', end='', flush=True)

        recipe, error = extract_recipe(url, config['name'], config.get('vegan_only', True), use_playwright=use_pw)
        if recipe:
            recipes.append(recipe)
            consecutive_errors = 0
            print(f'OK ({len(recipe["ing"])} ing)')
        else:
            if error and 'dairy' in error:
                skipped_dairy += 1
                consecutive_errors = 0
                print(f'DAIRY')
            elif error and 'no JSON-LD' in error:
                skipped_no_recipe += 1
                consecutive_errors = 0
                print(f'no recipe')
            elif error and ('fetch' in error or 'HTTP' in error):
                errors += 1
                consecutive_errors += 1
                print(f'ERR ({error})')
                # After 3 consecutive errors, switch to Playwright
                if consecutive_errors >= 3 and not use_pw and _pw_available():
                    print(f'    → Switching to Playwright (headless Chrome) for remaining URLs')
                    use_pw = True
                    consecutive_errors = 0
                    time.sleep(2)
                elif errors > 5 and errors % 5 == 0:
                    print(f'    (slowing down, {errors} errors so far)')
                    time.sleep(5)
            else:
                skipped_other += 1
                print(f'skip ({error})')

        # Rate limiting
        if i % 25 == 0:
            time.sleep(delay * 3)
        else:
            time.sleep(delay)

        # Save progress every 100 recipes
        if len(recipes) > 0 and len(recipes) % 100 == 0:
            output_path = OUTPUT_DIR / config['output']
            with open(output_path, 'w') as f:
                json.dump(recipes, f, indent=2)
            print(f'    [saved {len(recipes)} recipes so far]')

    # Final save
    output_path = OUTPUT_DIR / config['output']
    with open(output_path, 'w') as f:
        json.dump(recipes, f, indent=2)

    print(f'\n  ── {config["name"]} Results ──')
    print(f'  URLs crawled:    {len(urls)}')
    print(f'  Recipes saved:   {len(recipes)}')
    print(f'  Skipped (dairy): {skipped_dairy}')
    print(f'  Skipped (no LD): {skipped_no_recipe}')
    print(f'  Skipped (other): {skipped_other}')
    print(f'  Errors:          {errors}')
    print(f'  Output:          {output_path}\n')

    return len(recipes)


def main():
    # Parse site args
    if len(sys.argv) > 1:
        site_keys = [k for k in sys.argv[1:] if k in SITES]
        if not site_keys:
            print(f'Unknown site(s). Available: {", ".join(SITES.keys())}')
            sys.exit(1)
    else:
        site_keys = list(SITES.keys())

    print(f'\n🌿 HARVEST Multi-Site Recipe Scraper')
    print(f'   Scraping: {", ".join(site_keys)}\n')

    total = 0
    for key in site_keys:
        try:
            count = scrape_site(key, SITES[key])
            total += count
        except KeyboardInterrupt:
            print(f'\n\n  Interrupted! Partial results saved.\n')
            break
        except Exception as e:
            print(f'\n  ERROR on {key}: {e}\n  Continuing to next site...\n')
            continue

    # Clean up Playwright if used
    _pw_close()

    print(f'\n{"="*60}')
    print(f'  TOTAL: {total} recipes from {len(site_keys)} sites')
    print(f'{"="*60}\n')


if __name__ == '__main__':
    main()
