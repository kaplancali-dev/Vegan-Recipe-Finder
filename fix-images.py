#!/usr/bin/env python3
"""
HARVEST Image Fixer v2
Uses curl (much better at bypassing bot detection than Python's urllib).
Run: python3 fix-images.py
"""

import re, sys, subprocess, time

HTML_FILE = 'index.html'

def fetch_og_image(url):
    """Use curl to fetch the page, then extract og:image."""
    try:
        result = subprocess.run([
            'curl', '-sL', '--max-time', '12',
            '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
            '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            '-H', 'Accept-Language: en-US,en;q=0.9',
            url
        ], capture_output=True, text=True, timeout=15)
        html = result.stdout
        if not html:
            return None
        # Try og:image with property first, then content first
        for pattern in [
            r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\'](https?://[^"\']+)["\']',
            r'<meta[^>]*content=["\'](https?://[^"\']+)["\'][^>]*property=["\']og:image["\']',
        ]:
            m = re.search(pattern, html, re.IGNORECASE)
            if m:
                return m.group(1)
    except Exception:
        pass
    return None

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract all recipes
    pattern = r'\{id:(\d+),title:"([^"]+)"[^}]*?url:"([^"]*)"[^}]*?img:"([^"]*)"'
    recipes = list(re.finditer(pattern, content))
    total = len(recipes)
    print(f"Found {total} recipes\n")

    fixed = 0
    failed = 0
    unchanged = 0
    failed_list = []

    for i, m in enumerate(recipes):
        rid, title, url, old_img = m.group(1), m.group(2), m.group(3), m.group(4)

        if not url or url == '#':
            unchanged += 1
            continue

        pct = round((i + 1) / total * 100)
        sys.stdout.write(f'\r[{pct:3d}%] {i+1}/{total} — {title[:50]:<50}')
        sys.stdout.flush()

        og_img = fetch_og_image(url)

        if og_img and og_img != old_img:
            # Replace only this specific recipe's img (match the full context to avoid false replacements)
            old_fragment = f'id:{rid},'
            # Find position of this recipe in content and replace its img
            recipe_pattern = f'(id:{rid},.*?)img:"{re.escape(old_img)}"'
            new_content = re.sub(recipe_pattern, f'\\1img:"{og_img}"', content, count=1)
            if new_content != content:
                content = new_content
                fixed += 1
            else:
                unchanged += 1
        elif not og_img:
            failed += 1
            failed_list.append(f"  #{rid}: {title} — {url}")
        else:
            unchanged += 1

        time.sleep(0.25)

    print(f'\n\n{"="*60}')
    print(f'Fixed: {fixed} | Unchanged: {unchanged} | Could not fetch: {failed}')

    if fixed > 0:
        with open(HTML_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'\n✅ {HTML_FILE} updated with {fixed} new image URLs.')
    else:
        print('\nNo changes needed.')

    if failed_list:
        print(f'\n⚠️  Could not fetch og:image for {len(failed_list)} recipes:')
        for line in failed_list[:20]:
            print(line)
        if len(failed_list) > 20:
            print(f"  ... and {len(failed_list) - 20} more")

if __name__ == '__main__':
    main()
