#!/usr/bin/env python3
"""
Universal vegan recipe scraper for multiple sites.
Uses JSON-LD structured data (Schema.org Recipe) and sitemap/category crawling.

Usage:
    python3 scrape-multi.py                    # scrape all sites
    python3 scrape-multi.py veganricha ohsheglows  # scrape specific sites

Sites: veganricha, ohsheglows, loveandlemons, plantyou,
       itdoesnttastelikechicken, forksoverknives, bestofvegan
"""

import json
import re
import time
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

OUTPUT_DIR = Path(__file__).parent
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

# ── Site configs ─────────────────────────────────────────────────

SITES = {
    'veganricha': {
        'name': 'Vegan Richa',
        'base': 'https://www.veganricha.com',
        'method': 'sitemap',       # sitemap is fastest
        'sitemap_url': 'https://www.veganricha.com/post-sitemap.xml',
        'sitemap_fallbacks': [
            'https://www.veganricha.com/post-sitemap1.xml',
            'https://www.veganricha.com/post-sitemap2.xml',
            'https://www.veganricha.com/post-sitemap3.xml',
            'https://www.veganricha.com/sitemap_index.xml',
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': True,   # all recipes should be vegan
        'output': 'veganricha-recipes.json',
    },
    'ohsheglows': {
        'name': 'Oh She Glows',
        'base': 'https://ohsheglows.com',
        'method': 'sitemap',
        'sitemap_url': 'https://ohsheglows.com/post-sitemap.xml',
        'sitemap_fallbacks': [
            'https://ohsheglows.com/post-sitemap1.xml',
            'https://ohsheglows.com/post-sitemap2.xml',
            'https://ohsheglows.com/sitemap_index.xml',
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': True,
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
        'vegan_only': False,   # NOT all vegan — must filter dairy
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
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': True,
        'output': 'plantyou-recipes.json',
    },
    'itdoesnttastelikechicken': {
        'name': 'It Doesn\'t Taste Like Chicken',
        'base': 'https://itdoesnttastelikechicken.com',
        'method': 'sitemap',
        'sitemap_url': 'https://itdoesnttastelikechicken.com/post-sitemap.xml',
        'sitemap_fallbacks': [
            'https://itdoesnttastelikechicken.com/post-sitemap1.xml',
            'https://itdoesnttastelikechicken.com/post-sitemap2.xml',
            'https://itdoesnttastelikechicken.com/sitemap_index.xml',
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': True,
        'output': 'idtlc-recipes.json',
    },
    'forksoverknives': {
        'name': 'Forks Over Knives',
        'base': 'https://www.forksoverknives.com',
        'method': 'sitemap',
        'sitemap_url': 'https://www.forksoverknives.com/post-sitemap.xml',
        'sitemap_fallbacks': [
            'https://www.forksoverknives.com/recipes-sitemap.xml',
            'https://www.forksoverknives.com/post-sitemap1.xml',
            'https://www.forksoverknives.com/post-sitemap2.xml',
            'https://www.forksoverknives.com/post-sitemap3.xml',
            'https://www.forksoverknives.com/sitemap_index.xml',
            'https://www.forksoverknives.com/sitemap.xml',
        ],
        # FOK recipe URLs contain /recipes/
        'url_filter': lambda u: '/recipes/' in u,
        'vegan_only': True,
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
        ],
        'url_filter': lambda u: '/category/' not in u and '/tag/' not in u,
        'vegan_only': True,
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
    'just egg', 'bob\'s red mill egg',
    'vegan honey', 'agave', 'bee free honee',
    'vegan mayo', 'vegan mayonnaise', 'vegenaise', 'just mayo',
    'aquafaba',
    'butterbeans', 'butter beans', 'butterbean', 'butter bean',
    'butternut', 'butterfly', 'buttercup', 'butterscotch',
    'butterhead', 'butter lettuce', 'bread and butter',
    'eggplant', 'egg roll wrapper',
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
        resp = requests.get(sitemap_url, headers=HEADERS, timeout=15)
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
                print(f'  Fetching {sub_url}...')
                urls.extend(fetch_sitemap_urls(sub_url))
                time.sleep(0.3)
        else:
            # Regular sitemap
            locs = root.findall('.//sm:url/sm:loc', ns)
            urls = [loc.text.strip() for loc in locs if loc.text]
    except ET.ParseError:
        pass

    return urls


def get_urls_for_site(config):
    """Get all candidate recipe URLs for a site."""
    urls = []

    # Try primary sitemap
    print(f'  Trying {config["sitemap_url"]}...')
    urls = fetch_sitemap_urls(config['sitemap_url'])

    # Try fallbacks if primary failed
    if not urls:
        for fb in config.get('sitemap_fallbacks', []):
            print(f'  Trying fallback {fb}...')
            urls = fetch_sitemap_urls(fb)
            if urls:
                break
            time.sleep(0.3)

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

def extract_recipe(url, site_name, vegan_only):
    """Extract recipe data from a page using JSON-LD."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return None, f'HTTP {resp.status_code}'
    except Exception as e:
        return None, f'fetch error: {e}'

    soup = BeautifulSoup(resp.text, 'html.parser')

    # Find JSON-LD
    recipe_data = None
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and '@graph' in data:
                for item in data['@graph']:
                    rtype = item.get('@type', '')
                    if rtype == 'Recipe' or (isinstance(rtype, list) and 'Recipe' in rtype):
                        recipe_data = item
                        break
            elif isinstance(data, dict):
                rtype = data.get('@type', '')
                if rtype == 'Recipe' or (isinstance(rtype, list) and 'Recipe' in rtype):
                    recipe_data = data
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        rtype = item.get('@type', '')
                        if rtype == 'Recipe' or (isinstance(rtype, list) and 'Recipe' in rtype):
                            recipe_data = item
                            break
        except (json.JSONDecodeError, TypeError):
            continue

    if not recipe_data:
        return None, 'no JSON-LD recipe'

    # Ingredients
    ingredients = recipe_data.get('recipeIngredient', [])
    if not ingredients:
        return None, 'no ingredients'

    # Dairy filter (always filter non-vegan sites; also filter "vegan" sites as safety)
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
        img = img_data[0] if isinstance(img_data[0], str) else img_data[0].get('url', '')
    elif isinstance(img_data, dict):
        img = img_data.get('url', '')
    elif isinstance(img_data, str):
        img = img_data

    # Strip WordPress size suffixes to get full-size image
    if img:
        img = re.sub(r'-\d+x\d+(\.\w+)$', r'\1', img)

    # Nutrition
    nut = {}
    nutrition = recipe_data.get('nutrition', {})
    if nutrition:
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
        hours = re.search(r'(\d+)H', total_time)
        mins = re.search(r'(\d+)M', total_time)
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

    for i, url in enumerate(urls, 1):
        slug = url.split('/')[-1][:45] or url.split('/')[-2][:45]
        print(f'  [{i}/{len(urls)}] {slug}... ', end='', flush=True)

        recipe, error = extract_recipe(url, config['name'], config.get('vegan_only', True))
        if recipe:
            recipes.append(recipe)
            print(f'OK ({len(recipe["ing"])} ing)')
        else:
            if error and 'dairy' in error:
                skipped_dairy += 1
                print(f'DAIRY')
            elif error and 'no JSON-LD' in error:
                skipped_no_recipe += 1
                print(f'no recipe')
            elif error and ('fetch' in error or 'HTTP' in error):
                errors += 1
                print(f'ERR ({error})')
            else:
                skipped_other += 1
                print(f'skip ({error})')

        # Rate limiting: pause every 20 requests
        if i % 20 == 0:
            time.sleep(1.5)
        else:
            time.sleep(0.3)

    # Save
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
        count = scrape_site(key, SITES[key])
        total += count

    print(f'\n{"="*60}')
    print(f'  TOTAL: {total} recipes from {len(site_keys)} sites')
    print(f'{"="*60}\n')


if __name__ == '__main__':
    main()
