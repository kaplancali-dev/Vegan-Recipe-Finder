#!/usr/bin/env python3
"""
Scrape vegan recipes from Lazy Cat Kitchen.
Step 1: Collect all recipe URLs from category pages.
Step 2: Extract recipe data (JSON-LD) from each page.
Step 3: Filter out non-vegan (dairy) recipes.
Step 4: Output as JSON ready for merge into HARVEST.
"""

import json
import re
import time
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

SITE = 'https://www.lazycatkitchen.com'
CATEGORY_URL = f'{SITE}/category/recipes/page/{{page}}/'
OUTPUT_FILE = Path(__file__).parent / 'lck-recipes.json'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

# Dairy keywords to filter out
DAIRY_WORDS = [
    'milk chocolate', 'dairy milk', 'cow milk', 'whole milk', 'skim milk',
    'heavy cream', 'whipping cream', 'sour cream', 'cream cheese',
    'cheddar', 'parmesan cheese', 'mozzarella cheese', 'gruyere',
    'ricotta cheese', 'goat cheese', 'feta cheese', 'brie',
    'butter ', 'unsalted butter', 'salted butter', 'ghee',
    'yogurt', 'yoghurt', 'kefir',
    'egg ', 'eggs ', 'egg,', 'eggs,', 'egg white', 'egg yolk',
    'honey',
]

# Words that look like dairy but aren't
VEGAN_EXCEPTIONS = [
    'vegan butter', 'plant butter', 'coconut butter', 'nut butter',
    'almond butter', 'peanut butter', 'cashew butter', 'sunflower butter',
    'cocoa butter', 'shea butter',
    'vegan yogurt', 'vegan yoghurt', 'coconut yogurt', 'coconut yoghurt',
    'soy yogurt', 'soy yoghurt', 'plant yogurt',
    'vegan cream', 'coconut cream', 'cashew cream', 'oat cream',
    'vegan cheese', 'nutritional yeast', 'vegan parmesan',
    'vegan mozzarella', 'vegan cheddar', 'vegan feta',
    'coconut milk', 'almond milk', 'oat milk', 'soy milk', 'rice milk',
    'plant milk', 'cashew milk',
    'vegan egg', 'flax egg', 'chia egg',
    'vegan honey', 'agave',
    'aquafaba',
    'butterbeans', 'butter beans', 'butterbean', 'butter bean',
    'butternut', 'butterfly', 'buttercup',
]


def is_dairy(ingredient):
    """Check if an ingredient contains dairy (not vegan)."""
    ing_lower = ingredient.lower().strip()

    # Check vegan exceptions first
    for exc in VEGAN_EXCEPTIONS:
        if exc in ing_lower:
            return False

    # Check dairy words
    for dairy in DAIRY_WORDS:
        if dairy in ing_lower:
            return True

    return False


def has_dairy(ingredients):
    """Check if any ingredient in the list is dairy."""
    for ing in ingredients:
        if is_dairy(ing):
            return True
    return False


def get_recipe_urls():
    """Crawl category pages to get all recipe URLs."""
    urls = []
    page = 1

    while True:
        if page == 1:
            url = f'{SITE}/category/recipes/'
        else:
            url = CATEGORY_URL.format(page=page)

        print(f'Fetching page {page}... ', end='', flush=True)
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 404:
                print('end of pages')
                break
            resp.raise_for_status()
        except Exception as e:
            print(f'error: {e}')
            break

        soup = BeautifulSoup(resp.text, 'html.parser')

        # Find recipe links - try multiple selectors
        links = set()
        for a in soup.select('article a[href]'):
            href = a['href']
            if href.startswith(SITE) and '/category/' not in href and '/tag/' not in href:
                links.add(href.rstrip('/'))

        if not links:
            # Try alternate selectors
            for a in soup.select('.entry-title a[href], h2 a[href], .post-title a[href]'):
                href = a['href']
                if href.startswith(SITE):
                    links.add(href.rstrip('/'))

        if not links:
            print('no links found, stopping')
            break

        new_count = len(links - set(urls))
        urls.extend([u for u in links if u not in urls])
        print(f'{new_count} new URLs (total: {len(urls)})')

        if new_count == 0:
            print('No new URLs, stopping')
            break

        page += 1
        time.sleep(0.5)

    return urls


def extract_recipe(url):
    """Extract recipe data from a single page using JSON-LD."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return None, f'fetch error: {e}'

    soup = BeautifulSoup(resp.text, 'html.parser')

    # Find JSON-LD script tags
    recipe_data = None
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            # Handle @graph arrays
            if isinstance(data, dict) and '@graph' in data:
                for item in data['@graph']:
                    if item.get('@type') == 'Recipe':
                        recipe_data = item
                        break
            elif isinstance(data, dict) and data.get('@type') == 'Recipe':
                recipe_data = data
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict) and item.get('@type') == 'Recipe':
                        recipe_data = item
                        break
        except (json.JSONDecodeError, TypeError):
            continue

    if not recipe_data:
        return None, 'no JSON-LD recipe found'

    # Extract ingredients
    ingredients = recipe_data.get('recipeIngredient', [])
    if not ingredients:
        return None, 'no ingredients'

    # Check for dairy
    if has_dairy(ingredients):
        dairy_items = [i for i in ingredients if is_dairy(i)]
        return None, f'dairy: {dairy_items[0][:50]}'

    # Extract title
    title = recipe_data.get('name', '').strip()
    if not title:
        return None, 'no title'

    # Extract image
    img = ''
    img_data = recipe_data.get('image', '')
    if isinstance(img_data, list) and img_data:
        img = img_data[0] if isinstance(img_data[0], str) else img_data[0].get('url', '')
    elif isinstance(img_data, dict):
        img = img_data.get('url', '')
    elif isinstance(img_data, str):
        img = img_data

    # Extract nutrition
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

    # Extract time
    cook_time = 0
    total_time = recipe_data.get('totalTime', '') or recipe_data.get('cookTime', '')
    if total_time:
        # Parse ISO 8601 duration (PT30M, PT1H30M, etc.)
        hours = re.search(r'(\d+)H', total_time)
        mins = re.search(r'(\d+)M', total_time)
        if hours:
            cook_time += int(hours.group(1)) * 60
        if mins:
            cook_time += int(mins.group(1))

    # Extract servings
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
        'site': 'Lazy Cat Kitchen',
        'img': img,
        'ing': ingredients,
        'nut': nut,
        'time': cook_time,
        'servings': servings,
    }, None


def main():
    print('=== Lazy Cat Kitchen Scraper ===\n')

    # Step 1: Get all recipe URLs
    print('Step 1: Collecting recipe URLs...\n')
    urls = get_recipe_urls()
    print(f'\nFound {len(urls)} recipe URLs\n')

    if not urls:
        print('No URLs found. Exiting.')
        sys.exit(1)

    # Step 2: Extract recipe data
    print('Step 2: Extracting recipe data...\n')
    recipes = []
    skipped_dairy = 0
    skipped_other = 0

    for i, url in enumerate(urls, 1):
        print(f'[{i}/{len(urls)}] {url.split("/")[-1][:50]}... ', end='', flush=True)

        recipe, error = extract_recipe(url)
        if recipe:
            recipes.append(recipe)
            print(f'OK ({len(recipe["ing"])} ingredients)')
        else:
            if error and 'dairy' in error:
                skipped_dairy += 1
                print(f'SKIP ({error})')
            else:
                skipped_other += 1
                print(f'SKIP ({error})')

        if i % 20 == 0:
            time.sleep(1)
        else:
            time.sleep(0.3)

    # Save results
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(recipes, f, indent=2)

    print(f'\n=== Results ===')
    print(f'Total URLs:     {len(urls)}')
    print(f'Vegan recipes:  {len(recipes)}')
    print(f'Skipped dairy:  {skipped_dairy}')
    print(f'Skipped other:  {skipped_other}')
    print(f'Saved to:       {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
