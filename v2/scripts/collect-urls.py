#!/usr/bin/env python3
"""
URL Collector for HARVEST Recipe Pipeline
==========================================

Automatically discovers recipe URLs from food blog sitemaps.
Most WordPress-based food blogs publish XML sitemaps that list all pages.

Usage:
  python collect-urls.py                    # collect from all configured sites
  python collect-urls.py --site pickuplimes # collect from one site
  python collect-urls.py --list             # list configured sites

Output:
  urls.txt — one URL per line, ready for scrape-recipes.py
"""

import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / 'urls.txt'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
}

# ── Site configurations ────────────────────────────────────────────
# Each site has:
#   sitemap: URL of the sitemap (or sitemap index)
#   recipe_pattern: regex to match recipe URLs (vs. category pages, about pages, etc.)
#   max: max URLs to collect from this site

SITES = {
    'pickuplimes': {
        'name': 'Pick Up Limes',
        'sitemap': 'https://www.pickuplimes.com/sitemap.xml',
        'recipe_pattern': r'/recipe/[\w-]+-\d+',
        'max': 100,
    },
    'bosh': {
        'name': 'BOSH',
        'sitemap': 'https://www.bosh.tv/sitemap.xml',
        'recipe_pattern': r'/recipes/[\w-]+',
        'max': 150,
    },
    'woonheng': {
        'name': 'WoonHeng',
        'sitemap': 'https://woonheng.com/sitemap.xml',
        'recipe_pattern': r'woonheng\.com/(?!category|tag|about|contact|privacy|start-here)[\w-]+/?$',
        'max': 80,
    },
    'elavegan': {
        'name': 'Ela Vegan',
        'sitemap': 'https://elavegan.com/sitemap.xml',
        'recipe_pattern': r'elavegan\.com/(?!category|tag|about|privacy|cookie|vegan-\w+-recipes|page)[\w-]+/?$',
        'max': 100,
    },
    'biancazapatka': {
        'name': 'Bianca Zapatka',
        'sitemap': 'https://biancazapatka.com/en/sitemap.xml',
        'recipe_pattern': r'biancazapatka\.com/en/(?!category|tag|about|recipe-index|recipes/?$|my-cookbooks)[\w-]+/?$',
        'max': 100,
    },
    'mobkitchen': {
        'name': 'Mob Kitchen',
        'sitemap': 'https://www.mobkitchen.co.uk/sitemap.xml',
        'recipe_pattern': r'/recipes/[\w-]+',
        'max': 150,
    },
    'thekoreanvegan': {
        'name': 'The Korean Vegan',
        'sitemap': 'https://thekoreanvegan.com/sitemap.xml',
        'recipe_pattern': r'thekoreanvegan\.com/(?!category|tag|about|shop|privacy)[\w-]+/?$',
        'max': 60,
    },
    'lazycatkitchen': {
        'name': 'Lazy Cat Kitchen',
        'sitemap': 'https://www.lazycatkitchen.com/sitemap.xml',
        'recipe_pattern': r'lazycatkitchen\.com/(?!category|tag|about|privacy|contact|shop)[\w-]+/?$',
        'max': 60,
    },
    'cookieandkate': {
        'name': 'Cookie and Kate',
        'sitemap': 'https://cookieandkate.com/sitemap.xml',
        'recipe_pattern': r'cookieandkate\.com/[\w-]+/?$',
        'max': 60,
    },
    'frommybowl': {
        'name': 'From My Bowl',
        'sitemap': 'https://frommybowl.com/sitemap.xml',
        'recipe_pattern': r'frommybowl\.com/(?!category|tag|about|privacy)[\w-]+/?$',
        'max': 50,
    },
    'jessicainthekitchen': {
        'name': 'Jessica in the Kitchen',
        'sitemap': 'https://jessicainthekitchen.com/sitemap.xml',
        'recipe_pattern': r'jessicainthekitchen\.com/(?!category|tag|about|privacy)[\w-]+/?$',
        'max': 50,
    },
    'hotforfood': {
        'name': 'Hot For Food',
        'sitemap': 'https://www.hotforfoodblog.com/sitemap.xml',
        'recipe_pattern': r'/recipes/[\w-]+',
        'max': 50,
    },
    'avantgardevegan': {
        'name': 'Avant-Garde Vegan',
        'sitemap': 'https://www.avantgardevegan.com/sitemap.xml',
        'recipe_pattern': r'avantgardevegan\.com/(?!category|tag|about|privacy|shop)[\w-]+/?$',
        'max': 50,
    },
    'holycowvegan': {
        'name': 'Holy Cow Vegan',
        'sitemap': 'https://holycowvegan.net/sitemap.xml',
        'recipe_pattern': r'holycowvegan\.net/(?!category|tag|about|privacy|contact)[\w-]+/?$',
        'max': 50,
    },
}


def fetch_sitemap(url: str) -> list[str]:
    """Fetch a sitemap XML and extract all URLs."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        # Check if this is a sitemap index (contains other sitemaps)
        sitemaps = soup.find_all('sitemap')
        if sitemaps:
            all_urls = []
            for sm in sitemaps:
                loc = sm.find('loc')
                if loc:
                    sub_url = loc.text.strip()
                    print(f"    Sub-sitemap: {sub_url}")
                    time.sleep(0.5)
                    all_urls.extend(fetch_sitemap(sub_url))
            return all_urls

        # Regular sitemap — extract URLs
        urls = []
        for url_tag in soup.find_all('url'):
            loc = url_tag.find('loc')
            if loc:
                urls.append(loc.text.strip())

        return urls
    except Exception as e:
        print(f"    Error fetching sitemap {url}: {e}")
        return []


def collect_from_site(key: str, config: dict) -> list[str]:
    """Collect recipe URLs from a single site's sitemap."""
    name = config['name']
    pattern = re.compile(config['recipe_pattern'])
    max_urls = config['max']

    print(f"\n{'─'*50}")
    print(f"  {name}")
    print(f"  Sitemap: {config['sitemap']}")
    print(f"{'─'*50}")

    all_urls = fetch_sitemap(config['sitemap'])
    print(f"  Total URLs in sitemap: {len(all_urls)}")

    recipe_urls = [u for u in all_urls if pattern.search(u)]
    print(f"  Recipe URLs matched: {len(recipe_urls)}")

    if len(recipe_urls) > max_urls:
        recipe_urls = recipe_urls[:max_urls]
        print(f"  Capped at: {max_urls}")

    return recipe_urls


def main():
    if '--list' in sys.argv:
        print("Configured sites:")
        for key, config in SITES.items():
            print(f"  {key:20s} {config['name']:25s} max={config['max']}")
        return

    # Filter to specific site if requested
    if '--site' in sys.argv:
        idx = sys.argv.index('--site')
        if idx + 1 >= len(sys.argv):
            print("Usage: collect-urls.py --site <key>")
            sys.exit(1)
        site_key = sys.argv[idx + 1]
        if site_key not in SITES:
            print(f"Unknown site: {site_key}")
            print(f"Available: {', '.join(SITES.keys())}")
            sys.exit(1)
        sites_to_process = {site_key: SITES[site_key]}
    else:
        sites_to_process = SITES

    print(f"\n{'='*60}")
    print(f"HARVEST URL Collector")
    print(f"{'='*60}")
    print(f"Sites to process: {len(sites_to_process)}")

    all_recipe_urls = []

    for key, config in sites_to_process.items():
        urls = collect_from_site(key, config)
        # Add site name as comment header
        if urls:
            all_recipe_urls.append(f"\n# {config['name']}")
            all_recipe_urls.extend(urls)

    # Write to file
    with open(OUTPUT_FILE, 'w') as f:
        f.write(f"# HARVEST Recipe URLs\n")
        f.write(f"# Generated by collect-urls.py\n")
        f.write(f"# Total: {sum(1 for u in all_recipe_urls if not u.startswith('#'))}\n")
        f.write('\n'.join(all_recipe_urls))
        f.write('\n')

    total = sum(1 for u in all_recipe_urls if not u.startswith('#') and u.strip())
    print(f"\n{'='*60}")
    print(f"RESULTS")
    print(f"{'='*60}")
    print(f"Total recipe URLs: {total}")
    print(f"Saved to: {OUTPUT_FILE}")
    print(f"\nNext step: python scrape-recipes.py urls.txt")


if __name__ == '__main__':
    main()
