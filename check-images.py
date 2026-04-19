#!/usr/bin/env python3
"""
HARVEST — Image Health Check
Checks all recipe image URLs and reports any broken ones.
Run periodically: python3 check-images.py

Exit code 0 = all good, 1 = broken images found.
"""

import re, sys, subprocess, os

HTML_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')

def check_url(url):
    """Check if a URL returns a valid image. Returns (ok, status_code)."""
    try:
        result = subprocess.run([
            'curl', '-sL', '--max-time', '10', '-o', '/dev/null',
            '-w', '%{http_code}|%{content_type}',
            '-H', 'User-Agent: Mozilla/5.0 (compatible; HarvestBot/1.0)',
            url
        ], capture_output=True, text=True, timeout=15)
        info = result.stdout.strip()
        parts = info.split('|')
        status = parts[0] if parts else '0'
        ctype = parts[1] if len(parts) > 1 else ''
        ok = status.startswith('2') and 'image' in ctype
        return ok, status
    except:
        return False, 'timeout'

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'\{id:(\d+),title:"([^"]+)"[^}]*?img:"([^"]*)"'
    recipes = list(re.finditer(pattern, content))
    total = len(recipes)
    print(f"Checking {total} recipe images...\n")

    broken = []
    checked = 0

    for m in recipes:
        rid, title, img = m.group(1), m.group(2), m.group(3)
        if not img:
            continue

        checked += 1
        pct = round(checked / total * 100)
        sys.stdout.write(f'\r[{pct:3d}%] {checked}/{total}')
        sys.stdout.flush()

        ok, status = check_url(img)
        if not ok:
            broken.append((rid, title, img, status))

    print(f'\n\n{"="*60}')
    print(f'Checked: {checked} | Broken: {len(broken)} | Healthy: {checked - len(broken)}')

    if broken:
        print(f'\n⚠️  Broken images ({len(broken)}):')
        for rid, title, img, status in broken:
            print(f'  #{rid}: {title} (HTTP {status})')
            print(f'    {img[:100]}')
        sys.exit(1)
    else:
        print(f'\n✅ All images are healthy!')
        sys.exit(0)

if __name__ == '__main__':
    main()
