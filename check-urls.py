#!/usr/bin/env python3
"""
HARVEST — Recipe URL Health Check
Checks all recipe URLs and reports any broken ones.
Run periodically: python3 check-urls.py

Exit code 0 = all good, 1 = broken URLs found.
"""

import re, sys, subprocess, os

HTML_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')

def check_url(url):
    """Check if a URL returns a valid page. Returns (ok, status_code)."""
    try:
        result = subprocess.run([
            'curl', '-sL', '--max-time', '15', '-o', '/dev/null',
            '-w', '%{http_code}',
            '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            url
        ], capture_output=True, text=True, timeout=20)
        status = result.stdout.strip()
        ok = status.startswith('2') or status.startswith('3')
        return ok, status
    except:
        return False, 'timeout'

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match recipes with url field
    pattern = r'\{id:(\d+),title:"([^"]+)"[^}]*?url:"([^"]*)"'
    recipes = list(re.finditer(pattern, content))

    # Also find recipes WITHOUT a url field (Google fallback)
    all_pattern = r'\{id:(\d+),title:"([^"]+)"'
    all_recipes = list(re.finditer(all_pattern, content))
    url_ids = set(m.group(1) for m in recipes if m.group(3))

    no_url = []
    for m in all_recipes:
        if m.group(1) not in url_ids:
            no_url.append((m.group(1), m.group(2)))

    total_with_url = len([m for m in recipes if m.group(3)])
    total_no_url = len(no_url)

    print(f"HARVEST — Recipe URL Health Check")
    print(f"{'='*60}")
    print(f"Recipes with direct URL: {total_with_url}")
    print(f"Recipes using Google fallback: {total_no_url}")
    print(f"{'='*60}\n")

    if no_url:
        print(f"📋 Google fallback recipes ({total_no_url}):")
        for rid, title in no_url[:20]:
            print(f"  #{rid}: {title}")
        if total_no_url > 20:
            print(f"  ... and {total_no_url - 20} more")
        print()

    print(f"Checking {total_with_url} direct recipe URLs...\n")

    broken = []
    checked = 0

    for m in recipes:
        rid, title, url = m.group(1), m.group(2), m.group(3)
        if not url:
            continue

        checked += 1
        pct = round(checked / total_with_url * 100)
        sys.stdout.write(f'\r[{pct:3d}%] {checked}/{total_with_url}')
        sys.stdout.flush()

        ok, status = check_url(url)
        if not ok:
            broken.append((rid, title, url, status))

    print(f'\n\n{"="*60}')
    print(f'Checked: {checked} | Broken: {len(broken)} | Healthy: {checked - len(broken)}')

    if broken:
        print(f'\n⚠️  Broken URLs ({len(broken)}):')
        for rid, title, url, status in broken:
            print(f'  #{rid}: {title} (HTTP {status})')
            print(f'    {url[:120]}')
        sys.exit(1)
    else:
        print(f'\n✅ All recipe URLs are healthy!')
        sys.exit(0)

if __name__ == '__main__':
    main()
