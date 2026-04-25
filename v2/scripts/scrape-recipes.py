#!/usr/bin/env python3
"""
Recipe Scraper Pipeline for HARVEST
====================================

Takes a list of recipe URLs, scrapes structured data via JSON-LD schema markup,
normalizes ingredients, fetches a photo from Pexels, uploads to Supabase storage,
and outputs clean JSON ready to merge into recipes.json.

Usage:
  python scrape-recipes.py urls.txt              # scrape URLs from file
  python scrape-recipes.py --url <URL>            # scrape a single URL
  python scrape-recipes.py --test                 # test with a known recipe URL

Output:
  scraped-recipes.json — array of recipe objects matching the HARVEST schema
"""

import json
import re
import sys
import time
import os
import hashlib
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

# ── Config ─────────────────────────────────────────────────────────

PEXELS_API_KEY = 'd2SOQDCAwQdtPjjIZAp395a57B9OVKyqUz3tjgRf5PEAl0JfAmVFkogu'
SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co'
SUPABASE_ANON_KEY = None  # Set if you want auto-upload; otherwise photos are downloaded locally

SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / 'scraped-recipes.json'
PHOTO_DIR = SCRIPT_DIR / 'photos'

# Request headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

# ── Ingredient normalization ───────────────────────────────────────

# Common quantity/measurement patterns to strip
QUANTITY_RE = re.compile(
    r'^[\d\s/½⅓⅔¼¾⅛⅜⅝⅞.,~\x2d\u2013\u2014]+\s*'  # leading numbers/fractions (hyphens placed safely)
    r'(?:'
    r'cups?|tbsp|tsp|tablespoons?|teaspoons?|'
    r'oz|ounces?|lbs?|pounds?|'
    r'grams?|g\b|kg|ml|liters?|litres?|'
    r'cans?|jars?|packages?|pkgs?|'
    r'cloves?|heads?|bunche?s?|stalks?|sprigs?|'
    r'pieces?|slices?|strips?|'
    r'small|medium|large|'
    r'pinch(?:es)?|dash(?:es)?|handful'
    r')\s*',
    re.IGNORECASE
)

# Parenthetical notes to remove
PARENS_RE = re.compile(r'\s*\([^)]*\)\s*')

# "such as...", "like...", "e.g...."
SUCH_AS_RE = re.compile(r'\s*\b(?:such as|like|e\.g\.?|or similar|for serving|for garnish|to taste|as needed|optional)\b.*$', re.IGNORECASE)

# Common words that aren't ingredient names
STOP_WORDS = {'fresh', 'dried', 'frozen', 'canned', 'organic', 'raw', 'cooked',
              'chopped', 'diced', 'sliced', 'minced', 'grated', 'shredded',
              'crushed', 'ground', 'whole', 'halved', 'quartered', 'torn',
              'peeled', 'seeded', 'deseeded', 'trimmed', 'rinsed', 'drained',
              'packed', 'loosely', 'tightly', 'roughly', 'finely', 'thinly',
              'softened', 'melted', 'room', 'temperature', 'warm', 'cold', 'hot',
              'ripe', 'unripe', 'silken', 'pressed',
              'divided', 'plus', 'more', 'about', 'approximately',
              'heaping', 'scant', 'generous', 'level', 'rounded'}

# Ingredient alias normalization (common variations → canonical name)
ALIASES = {
    'garlic cloves': 'garlic',
    'garlic clove': 'garlic',
    'fresh garlic': 'garlic',
    'fresh ginger': 'ginger',
    'ginger root': 'ginger',
    'kosher salt': 'salt',
    'sea salt': 'salt',
    'fine salt': 'salt',
    'table salt': 'salt',
    'flaky salt': 'salt',
    'black pepper': 'pepper',
    'freshly ground black pepper': 'pepper',
    'ground black pepper': 'pepper',
    'freshly ground pepper': 'pepper',
    'extra virgin olive oil': 'olive oil',
    'extra-virgin olive oil': 'olive oil',
    'evoo': 'olive oil',
    'avocado oil': 'oil',
    'coconut oil': 'coconut oil',
    'vegetable oil': 'oil',
    'canola oil': 'oil',
    'neutral oil': 'oil',
    'cooking oil': 'oil',
    'soy sauce': 'soy sauce',
    'low-sodium soy sauce': 'soy sauce',
    'low sodium soy sauce': 'soy sauce',
    'tamari sauce': 'tamari',
    'gluten-free tamari': 'tamari',
    'gf tamari': 'tamari',
    'coconut aminos': 'coconut aminos',
    'full-fat coconut milk': 'coconut milk',
    'full fat coconut milk': 'coconut milk',
    'lite coconut milk': 'coconut milk',
    'light coconut milk': 'coconut milk',
    'canned coconut milk': 'coconut milk',
    'coconut cream': 'coconut cream',
    'unsweetened almond milk': 'almond milk',
    'almond milk': 'almond milk',
    'oat milk': 'oat milk',
    'plant milk': 'plant milk',
    'non-dairy milk': 'plant milk',
    'nondairy milk': 'plant milk',
    'maple syrup': 'maple syrup',
    'pure maple syrup': 'maple syrup',
    'lemon juice': 'lemon',
    'fresh lemon juice': 'lemon',
    'lime juice': 'lime',
    'fresh lime juice': 'lime',
    'orange juice': 'orange',
    'fresh orange juice': 'orange',
    'apple cider vinegar': 'apple cider vinegar',
    'red wine vinegar': 'red wine vinegar',
    'white wine vinegar': 'white wine vinegar',
    'balsamic vinegar': 'balsamic vinegar',
    'rice vinegar': 'rice vinegar',
    'rice wine vinegar': 'rice vinegar',
    'nutritional yeast': 'nutritional yeast',
    'nooch': 'nutritional yeast',
    'firm tofu': 'tofu',
    'extra firm tofu': 'tofu',
    'extra-firm tofu': 'extra-firm tofu',
    'silken tofu': 'silken tofu',
    'baby spinach': 'spinach',
    'fresh spinach': 'spinach',
    'cherry tomatoes': 'cherry tomatoes',
    'grape tomatoes': 'cherry tomatoes',
    'roma tomatoes': 'tomatoes',
    'plum tomatoes': 'tomatoes',
    'diced tomatoes': 'canned tomatoes',
    'crushed tomatoes': 'canned tomatoes',
    'fire roasted tomatoes': 'canned tomatoes',
    'tomato paste': 'tomato paste',
    'green onions': 'green onions',
    'scallions': 'green onions',
    'spring onions': 'green onions',
    'yellow onion': 'onion',
    'white onion': 'onion',
    'red onion': 'red onion',
    'sweet potato': 'sweet potatoes',
    'sweet potatoes': 'sweet potatoes',
    'russet potato': 'potatoes',
    'yukon gold potato': 'potatoes',
    'brown rice': 'brown rice',
    'white rice': 'rice',
    'jasmine rice': 'rice',
    'basmati rice': 'rice',
    'vegetable broth': 'vegetable broth',
    'veggie broth': 'vegetable broth',
    'vegetable stock': 'vegetable broth',
    'fresh cilantro': 'cilantro',
    'fresh basil': 'basil',
    'fresh parsley': 'parsley',
    'flat-leaf parsley': 'parsley',
    'fresh mint': 'mint',
    'fresh dill': 'dill',
    'fresh thyme': 'thyme',
    'fresh rosemary': 'rosemary',
    'dried oregano': 'oregano',
    'dried basil': 'basil',
    'dried thyme': 'thyme',
    'smoked paprika': 'smoked paprika',
    'sweet paprika': 'paprika',
    'ground cumin': 'cumin',
    'cumin seeds': 'cumin',
    'ground turmeric': 'turmeric',
    'turmeric powder': 'turmeric',
    'ground cinnamon': 'cinnamon',
    'cinnamon sticks': 'cinnamon',
    'chili powder': 'chili powder',
    'red pepper flakes': 'red pepper flakes',
    'crushed red pepper': 'red pepper flakes',
    'cayenne pepper': 'cayenne',
    'cayenne': 'cayenne',
    'all-purpose flour': 'all-purpose flour',
    'all purpose flour': 'all-purpose flour',
    'ap flour': 'all-purpose flour',
    'whole wheat flour': 'whole wheat flour',
    'chickpea flour': 'chickpea flour',
    'almond flour': 'almond flour',
    'oat flour': 'oat flour',
    'canned chickpeas': 'chickpeas',
    'chickpeas': 'chickpeas',
    'garbanzo beans': 'chickpeas',
    'canned black beans': 'black beans',
    'black beans': 'black beans',
    'kidney beans': 'kidney beans',
    'canned kidney beans': 'kidney beans',
    'white beans': 'white beans',
    'cannellini beans': 'white beans',
    'great northern beans': 'white beans',
    'red lentils': 'red lentils',
    'green lentils': 'lentils',
    'brown lentils': 'lentils',
    'french lentils': 'lentils',
    'dried red lentils': 'red lentils',
    'roasted cashews': 'cashews',
    'raw cashews': 'cashews',
    'cashew nuts': 'cashews',
    'walnuts': 'walnuts',
    'almonds': 'almonds',
    'peanuts': 'peanuts',
    'natural peanut butter': 'peanut butter',
    'creamy peanut butter': 'peanut butter',
    'almond butter': 'almond butter',
    'tahini paste': 'tahini',
    'tahini': 'tahini',
    'vegan butter': 'vegan butter',
    'plant-based butter': 'vegan butter',
    'granulated sugar': 'sugar',
    'cane sugar': 'sugar',
    'brown sugar': 'brown sugar',
    'coconut sugar': 'coconut sugar',
    'powdered sugar': 'powdered sugar',
    'confectioners sugar': 'powdered sugar',
    'water': 'water',
    'ice water': 'water',
    'warm water': 'water',
    'filtered water': 'water',
}


def normalize_ingredient(raw: str) -> str:
    """
    Normalize a raw ingredient string into a clean ingredient name.

    "1½ cups fresh baby spinach, roughly chopped" → "spinach"
    "3 cloves garlic, minced" → "garlic"
    "1 (15-oz) can chickpeas, drained and rinsed" → "chickpeas"
    """
    s = raw.strip().lower()

    # Remove HTML tags
    s = re.sub(r'<[^>]+>', '', s)

    # Remove parentheticals
    s = PARENS_RE.sub(' ', s)

    # Remove "such as..." trailing notes
    s = SUCH_AS_RE.sub('', s)

    # Remove quantity + unit prefix
    s = QUANTITY_RE.sub('', s).strip()

    # If there's still a leading number, strip it
    s = re.sub(r'^[\d\s/½⅓⅔¼¾⅛.,~\x2d\u2013]+\s*', '', s).strip()

    # Remove trailing commas and prep instructions after comma
    if ',' in s:
        s = s.split(',')[0].strip()

    # Check aliases BEFORE stripping stop words (preserves compound names)
    if s in ALIASES:
        return ALIASES[s]

    # Remove common prep words
    words = s.split()
    cleaned = [w for w in words if w.lower() not in STOP_WORDS]
    s = ' '.join(cleaned) if cleaned else s

    # Check aliases again after stop-word removal
    if s in ALIASES:
        return ALIASES[s]

    # Try without leading adjectives
    if len(s.split()) > 1:
        shorter = ' '.join(s.split()[1:])
        if shorter in ALIASES:
            return ALIASES[shorter]

    return s.strip() or raw.strip().lower()


def dedupe_ingredients(ings):
    """Remove duplicate ingredients, keeping first occurrence."""
    seen = set()
    result = []
    for ing in ings:
        key = ing.lower().strip()
        if key and key not in seen:
            seen.add(key)
            result.append(ing)
    return result


# ── Gluten detection ───────────────────────────────────────────────

GLUTEN_INGREDIENTS = {
    'all-purpose flour', 'bread flour', 'whole wheat flour', 'cake flour',
    'pastry flour', 'self-rising flour', 'semolina', 'vital wheat gluten',
    'seitan', 'wheat', 'wheat berries', 'bulgur', 'farro', 'spelt',
    'couscous', 'barley', 'rye', 'triticale',
    'bread', 'breadcrumbs', 'panko', 'croutons', 'pita',
    'flour tortillas', 'naan', 'flatbread',
    'pasta', 'spaghetti', 'fettuccine', 'penne', 'linguine', 'macaroni',
    'lasagna noodles', 'ramen noodles', 'udon noodles', 'egg noodles',
    'soy sauce',  # contains wheat unless specified GF
    'beer',
}

# Simple swaps that are OK to include
SIMPLE_GF_SWAPS = {
    'soy sauce', 'pasta', 'spaghetti', 'fettuccine', 'penne', 'linguine',
    'macaroni', 'lasagna noodles', 'breadcrumbs', 'panko',
    'flour tortillas', 'all-purpose flour',
}

def classify_gluten(ings):
    """
    Returns:
      'gf'          — naturally gluten-free
      'simple-swap' — has gluten ingredients but all are simple swaps
      'complex'     — has gluten ingredients that are hard to swap (skip)
    """
    gluten_found = []
    for ing in ings:
        low = ing.lower().strip()
        if low in GLUTEN_INGREDIENTS:
            gluten_found.append(low)

    if not gluten_found:
        return 'gf'

    if all(g in SIMPLE_GF_SWAPS for g in gluten_found):
        return 'simple-swap'

    return 'complex'


# ── Category detection ─────────────────────────────────────────────

VALID_CATS = [
    'Appetizers', 'Asian', 'Beginner', 'Bread & Baking', 'Breakfast',
    'Burgers & Patties', 'Chinese', 'Comfort Food', 'Desserts', 'Dinner',
    'Drinks', 'Fall', 'Game Day', 'Gluten-Free', 'High-Fiber', 'High-Protein',
    'Holiday & Festive', 'Indian', 'Instant Pot', 'Italian', 'Japanese',
    'Kid-Friendly', 'Korean', 'Lunch', 'Meal Prep', 'Meat Alternatives',
    'Mediterranean', 'Mexican', 'Middle Eastern', 'One-Pot', 'Pasta & Noodles',
    'Quick Meals', 'Raw', 'Salads', 'Sandwiches', 'Sauces & Dips',
    'Soups & Stews', 'Southern', 'Thai', 'Vegan Bacon', 'Vegan Cheese',
    'Vietnamese',
]

# Keyword → category mappings
CAT_KEYWORDS = {
    'Breakfast': ['breakfast', 'pancake', 'waffle', 'granola', 'oatmeal', 'smoothie bowl', 'scramble', 'muffin'],
    'Lunch': ['lunch', 'wrap', 'sandwich', 'salad bowl'],
    'Dinner': ['dinner', 'entrée', 'entree', 'main course', 'main dish'],
    'Desserts': ['dessert', 'cake', 'cookie', 'brownie', 'ice cream', 'pie', 'pudding', 'chocolate', 'sweet treat'],
    'Soups & Stews': ['soup', 'stew', 'chili', 'chowder', 'bisque', 'gumbo'],
    'Salads': ['salad'],
    'Pasta & Noodles': ['pasta', 'noodle', 'spaghetti', 'fettuccine', 'penne', 'linguine', 'ramen', 'pad thai', 'lo mein'],
    'Asian': ['asian', 'stir fry', 'stir-fry', 'wok'],
    'Indian': ['indian', 'curry', 'dal', 'daal', 'tikka', 'masala', 'biryani', 'chana', 'samosa', 'naan', 'paneer'],
    'Thai': ['thai', 'pad thai', 'green curry', 'red curry', 'tom kha', 'satay'],
    'Japanese': ['japanese', 'sushi', 'miso', 'ramen', 'teriyaki', 'tempura', 'udon', 'edamame'],
    'Korean': ['korean', 'kimchi', 'bibimbap', 'gochujang', 'bulgogi', 'japchae'],
    'Chinese': ['chinese', 'kung pao', 'mapo', 'fried rice', 'lo mein', 'chow mein', 'dumpling'],
    'Vietnamese': ['vietnamese', 'pho', 'banh mi', 'spring roll', 'bun'],
    'Mexican': ['mexican', 'taco', 'burrito', 'enchilada', 'quesadilla', 'salsa', 'guacamole', 'fajita', 'nacho'],
    'Italian': ['italian', 'pasta', 'risotto', 'bruschetta', 'pesto', 'marinara', 'lasagna'],
    'Mediterranean': ['mediterranean', 'hummus', 'falafel', 'tabbouleh', 'tzatziki', 'fattoush', 'shakshuka'],
    'Middle Eastern': ['middle eastern', 'lebanese', 'israeli', 'persian', 'moroccan', 'egyptian', 'harissa', 'za\'atar'],
    'Quick Meals': ['quick', '15 minute', '20 minute', '15-minute', '20-minute', 'easy'],
    'One-Pot': ['one pot', 'one-pot', 'sheet pan', 'sheet-pan', 'one pan', 'one-pan'],
    'Comfort Food': ['comfort', 'mac and cheese', 'mac & cheese', 'casserole', 'pot pie', 'meatloaf', 'grilled cheese'],
    'Appetizers': ['appetizer', 'snack', 'dip', 'finger food', 'starter', 'bite'],
    'Sauces & Dips': ['sauce', 'dip', 'dressing', 'pesto', 'hummus', 'guacamole', 'salsa', 'gravy'],
    'Burgers & Patties': ['burger', 'patty', 'patties'],
    'Sandwiches': ['sandwich', 'sub', 'hoagie', 'panini', 'wrap'],
    'Meat Alternatives': ['seitan', 'tofu', 'tempeh', 'jackfruit', 'meat', 'chicken', 'beef', 'pork', 'sausage', 'bacon'],
    'Meal Prep': ['meal prep', 'batch cook', 'make ahead', 'freezer'],
    'High-Protein': [],  # determined by nutrition
    'High-Fiber': [],  # determined by nutrition
    'Gluten-Free': [],  # determined by ingredients
    'Bread & Baking': ['bread', 'baking', 'bake', 'muffin', 'scone', 'biscuit', 'roll', 'focaccia', 'loaf'],
    'Instant Pot': ['instant pot', 'pressure cooker'],
    'Kid-Friendly': ['kid', 'kids', 'family'],
    'Drinks': ['smoothie', 'juice', 'latte', 'drink', 'beverage', 'milkshake', 'hot chocolate', 'tea'],
    'Raw': ['raw', 'no-bake', 'no bake'],
}


def auto_categorize(title, ings, nut, time_min=0):
    """Auto-assign categories based on title, ingredients, and nutrition."""
    cats = set()
    title_low = title.lower()
    ing_text = ' '.join(ings).lower()
    combined = title_low + ' ' + ing_text

    for cat, keywords in CAT_KEYWORDS.items():
        for kw in keywords:
            if kw in combined:
                cats.add(cat)
                break

    # Nutrition-based categories
    if nut:
        if nut.get('pro', 0) >= 15:
            cats.add('High-Protein')
        if nut.get('fib', 0) >= 8:
            cats.add('High-Fiber')

    # Time-based
    if time_min and time_min <= 20:
        cats.add('Quick Meals')

    # GF detection
    gluten_status = classify_gluten(ings)
    if gluten_status == 'gf':
        cats.add('Gluten-Free')

    # Default to Dinner if no meal type assigned
    meal_types = {'Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Appetizers', 'Drinks', 'Sauces & Dips', 'Bread & Baking'}
    if not cats.intersection(meal_types):
        cats.add('Dinner')  # safe default for most vegan recipes

    return sorted(cats.intersection(set(VALID_CATS)))


# ── JSON-LD recipe scraper ─────────────────────────────────────────

def fetch_page(url: str) -> str:
    """Fetch a web page with retries."""
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            if attempt == 2:
                raise
            print(f"  Retry {attempt + 1} for {url}: {e}")
            time.sleep(2)
    return ''


def extract_json_ld(html: str):
    """Extract the Recipe JSON-LD from a page."""
    soup = BeautifulSoup(html, 'html.parser')

    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
        except (json.JSONDecodeError, TypeError):
            continue

        # Handle @graph arrays
        if isinstance(data, dict) and '@graph' in data:
            for item in data['@graph']:
                if isinstance(item, dict) and item.get('@type') == 'Recipe':
                    return item
                # Handle array types like ["Recipe"]
                if isinstance(item, dict) and 'Recipe' in str(item.get('@type', '')):
                    return item

        # Direct Recipe object
        if isinstance(data, dict) and 'Recipe' in str(data.get('@type', '')):
            return data

        # Array of objects
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and 'Recipe' in str(item.get('@type', '')):
                    return item

    return None


def parse_duration(iso: str) -> int:
    """Parse ISO 8601 duration to minutes. e.g. 'PT30M' → 30, 'PT1H15M' → 75"""
    if not iso:
        return 0
    m = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?', str(iso))
    if m:
        hours = int(m.group(1) or 0)
        mins = int(m.group(2) or 0)
        return hours * 60 + mins
    return 0


def parse_servings(val) -> int:
    """Extract servings count from various formats."""
    if isinstance(val, int):
        return val
    if isinstance(val, list):
        val = val[0] if val else '4'
    s = str(val)
    m = re.search(r'(\d+)', s)
    return int(m.group(1)) if m else 4


def parse_nutrition(nut_data: dict) -> dict:
    """Parse nutrition from JSON-LD NutritionInformation."""
    if not nut_data:
        return {}

    def extract_num(val):
        if val is None:
            return 0
        m = re.search(r'([\d.]+)', str(val))
        return round(float(m.group(1)), 1) if m else 0

    cal = extract_num(nut_data.get('calories'))
    pro = extract_num(nut_data.get('proteinContent'))
    carb = extract_num(nut_data.get('carbohydrateContent'))
    fat = extract_num(nut_data.get('fatContent'))
    fib = extract_num(nut_data.get('fiberContent'))

    if cal or pro or carb or fat or fib:
        return {'cal': cal, 'pro': pro, 'carb': carb, 'fat': fat, 'fib': fib}
    return {}


def parse_ingredients(recipe_data):
    """Extract and normalize ingredient list from JSON-LD."""
    raw_ings = recipe_data.get('recipeIngredient', [])
    if not raw_ings:
        return []

    normalized = []
    for raw in raw_ings:
        ing = normalize_ingredient(str(raw))
        if ing and len(ing) > 1:  # skip single-char junk
            normalized.append(ing)

    return dedupe_ingredients(normalized)


def extract_site_name(url: str, recipe_data: dict) -> str:
    """Determine the site/creator name."""
    # Check JSON-LD author
    author = recipe_data.get('author')
    if isinstance(author, dict):
        name = author.get('name', '')
        if name and len(name) < 40:
            return name
    if isinstance(author, list) and author:
        a = author[0]
        if isinstance(a, dict):
            name = a.get('name', '')
            if name and len(name) < 40:
                return name
        elif isinstance(a, str):
            return a

    # Fallback: derive from domain
    domain = urlparse(url).netloc.replace('www.', '')
    # Title-case the domain minus TLD
    name = domain.rsplit('.', 1)[0]
    return name.replace('-', ' ').replace('_', ' ').title()


def scrape_recipe(url: str):
    """
    Scrape a single recipe URL and return a normalized recipe dict.
    Returns None if scraping fails.
    """
    print(f"  Fetching: {url}")

    try:
        html = fetch_page(url)
    except Exception as e:
        print(f"  ✗ Failed to fetch: {e}")
        return None

    recipe_data = extract_json_ld(html)
    if not recipe_data:
        print(f"  ✗ No JSON-LD recipe found")
        return None

    title = recipe_data.get('name', '').strip()
    if not title:
        print(f"  ✗ No title found")
        return None

    ings = parse_ingredients(recipe_data)
    if not ings:
        print(f"  ✗ No ingredients found for: {title}")
        return None

    time_min = parse_duration(recipe_data.get('totalTime') or recipe_data.get('cookTime') or recipe_data.get('prepTime'))
    servings = parse_servings(recipe_data.get('recipeYield', 4))
    nut = parse_nutrition(recipe_data.get('nutrition', {}))
    site = extract_site_name(url, recipe_data)

    # Auto-categorize
    cats = auto_categorize(title, ings, nut, time_min)

    # Get image URL for later processing
    img_url = ''
    img = recipe_data.get('image')
    if isinstance(img, str):
        img_url = img
    elif isinstance(img, list) and img:
        img_url = img[0] if isinstance(img[0], str) else img[0].get('url', '')
    elif isinstance(img, dict):
        img_url = img.get('url', '')

    recipe = {
        'title': title,
        'site': site,
        'url': url,
        'img_source': img_url,  # original image URL (not yet uploaded to Supabase)
        'cats': cats,
        'time': time_min or 30,  # default 30 if not specified
        'servings': servings,
        'ing': ings,
        'nut': nut or {'cal': 0, 'pro': 0, 'carb': 0, 'fat': 0, 'fib': 0},
    }

    gluten = classify_gluten(ings)
    recipe['_gluten_status'] = gluten  # metadata for filtering

    print(f"  ✓ {title} — {len(ings)} ingredients, {len(cats)} cats, GF: {gluten}")
    return recipe


# ── Pexels photo search ────────────────────────────────────────────

def search_pexels(query: str):
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
        print(f"  Pexels search failed for '{query}': {e}")
    return None


# ── Main pipeline ──────────────────────────────────────────────────

def load_existing_recipes() -> tuple[set, int]:
    """Load existing recipes to check for duplicates and find max ID."""
    recipes_path = SCRIPT_DIR.parent / 'src' / 'data' / 'recipes.json'
    if recipes_path.exists():
        with open(recipes_path) as f:
            recipes = json.load(f)
        titles = {r['title'].lower().strip() for r in recipes}
        urls = {r.get('url', '').rstrip('/').lower() for r in recipes}
        max_id = max(r['id'] for r in recipes)
        return titles | urls, max_id
    return set(), 0


def run_pipeline(urls, skip_complex_gluten=True):
    """
    Main scraping pipeline.

    Args:
        urls: List of recipe URLs to scrape
        skip_complex_gluten: If True, skip recipes with complex gluten (seitan, bread, etc.)
    """
    existing, max_id = load_existing_recipes()
    next_id = max_id + 1

    results = []
    skipped = {'duplicate': 0, 'failed': 0, 'complex_gluten': 0}

    print(f"\n{'='*60}")
    print(f"HARVEST Recipe Scraper")
    print(f"{'='*60}")
    print(f"URLs to process: {len(urls)}")
    print(f"Existing recipes: {len(existing)}")
    print(f"Next ID: {next_id}")
    print(f"Skip complex gluten: {skip_complex_gluten}")
    print(f"{'='*60}\n")

    for i, url in enumerate(urls, 1):
        url = url.strip()
        if not url or url.startswith('#'):
            continue

        print(f"\n[{i}/{len(urls)}] {url}")

        # Check for duplicate by URL
        if url.rstrip('/').lower() in existing:
            print(f"  ⏭ Duplicate URL, skipping")
            skipped['duplicate'] += 1
            continue

        recipe = scrape_recipe(url)
        if not recipe:
            skipped['failed'] += 1
            continue

        # Check for duplicate by title
        if recipe['title'].lower().strip() in existing:
            print(f"  ⏭ Duplicate title: {recipe['title']}")
            skipped['duplicate'] += 1
            continue

        # Check gluten status
        if skip_complex_gluten and recipe['_gluten_status'] == 'complex':
            print(f"  ⏭ Complex gluten, skipping: {recipe['title']}")
            skipped['complex_gluten'] += 1
            continue

        # Assign ID
        recipe['id'] = next_id
        next_id += 1

        # Remove internal metadata
        del recipe['_gluten_status']

        results.append(recipe)
        existing.add(recipe['title'].lower().strip())
        existing.add(url.rstrip('/').lower())

        # Be polite to servers
        time.sleep(1)

    # Save results
    if results:
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n{'='*60}")
        print(f"RESULTS")
        print(f"{'='*60}")
        print(f"Scraped:         {len(results)}")
        print(f"Skipped (dup):   {skipped['duplicate']}")
        print(f"Skipped (fail):  {skipped['failed']}")
        print(f"Skipped (gluten): {skipped['complex_gluten']}")
        print(f"\nSaved to: {OUTPUT_FILE}")

        # Summary by GF status
        gf_count = sum(1 for r in results if 'Gluten-Free' in r['cats'])
        print(f"Naturally GF:    {gf_count}/{len(results)} ({100*gf_count/len(results):.0f}%)")

        # Summary by site
        from collections import Counter
        sites = Counter(r['site'] for r in results)
        print(f"\nBy source:")
        for site, count in sites.most_common():
            print(f"  {site}: {count}")
    else:
        print(f"\nNo recipes scraped successfully.")

    return results


# ── CLI ────────────────────────────────────────────────────────────

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    if sys.argv[1] == '--test':
        # Test with a known recipe
        test_urls = [
            'https://minimalistbaker.com/easy-vegan-fried-rice/',
        ]
        run_pipeline(test_urls)

    elif sys.argv[1] == '--url':
        if len(sys.argv) < 3:
            print("Usage: scrape-recipes.py --url <URL>")
            sys.exit(1)
        run_pipeline([sys.argv[2]])

    else:
        # Read URLs from file
        url_file = Path(sys.argv[1])
        if not url_file.exists():
            print(f"File not found: {url_file}")
            sys.exit(1)
        urls = [line.strip() for line in url_file.read_text().splitlines() if line.strip() and not line.startswith('#')]
        run_pipeline(urls)
