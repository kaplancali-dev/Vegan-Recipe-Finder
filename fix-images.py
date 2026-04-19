#!/usr/bin/env python3
"""
HARVEST Image Fixer v3 — Targets only the 64 known broken images.
Uses curl with browser-like headers.
Run: python3 fix-images.py
"""

import re, sys, subprocess, time, html

HTML_FILE = 'index.html'

# The 64 broken recipes from browser console test
BROKEN = [
    (4096, "https://minimalistbaker.com/everyday-kale-salad-with-lemon-tahini-dressing/"),
    (4123, "https://minimalistbaker.com/easy-pesto-recipe/"),
    (4100, "https://rainbowplantlife.com/smashed-cucumber-salad/"),
    (4125, "https://simpleveganblog.com/mixed-green-salad/"),
    (4092, "https://minimalistbaker.com/the-best-roasted-broccoli/"),
    (4108, "https://minimalistbaker.com/how-to-roast-eggplant/"),
    (206,  "https://nutrifoodindex.com/recipe/creole-stuffed-peppers"),
    (409,  "https://platehaven.com/chopped-thai-inspired-chickpea-salad-with-curry-peanut-dressing-recipe/"),
    (419,  "https://receto.com/en/mango-turmeric-smoothie-bowl"),
    (450,  "https://jessicasrecipes.com/peanut-butter-banana-ice-cream-recipe/"),
    (2540, "https://thefirstmess.com/2024/01/05/vegan-minestrone-soup/"),
    (2541, "https://thefirstmess.com/2025/10/08/vegan-italian-wedding-soup/"),
    (2543, "https://thefirstmess.com/2025/01/01/creamy-mushroom-barley-soup-lentils-dill-vegan/"),
    (2542, "https://thefirstmess.com/2025/01/29/lemony-lentil-vegetable-soup-rosemary-fennel/"),
    (2544, "https://thefirstmess.com/2023/10/18/vegan-butternut-squash-zuppa-toscana/"),
    (2555, "https://thefirstmess.com/2023/03/08/moist-vegan-carrot-muffins/"),
    (2558, "https://thefirstmess.com/2024/04/24/extra-veggie-vegan-gochujang-noodles/"),
    (2557, "https://thefirstmess.com/2019/03/27/hearty-herbed-chickpea-pancakes-zesty-lemon-tahini-vegan-recipe/"),
    (2551, "https://thefirstmess.com/2025/02/05/morning-glory-bread-recipe/"),
    (2564, "https://thefirstmess.com/2023/05/24/hummus-crunch-salad/"),
    (2559, "https://thefirstmess.com/2024/08/14/spiced-coconut-couscous-roasted-cauliflower-chickpeas/"),
    (2545, "https://thefirstmess.com/2023/08/16/smoky-vegan-corn-chowder-with-potatoes/"),
    (2571, "https://thefirstmess.com/2021/01/13/vegan-sweet-potato-muffins-pecan-streusel/"),
    (2567, "https://thefirstmess.com/2024/02/07/vegan-ranch-slaw-crunchy-baked-buffalo-tofu/"),
    (2565, "https://thefirstmess.com/2025/04/16/vegan-broccoli-caesar-pasta-salad/"),
    (2560, "https://thefirstmess.com/2024/03/20/one-pot-rice-and-veggies-chickpeas-dilly-tahini/"),
    (2561, "https://thefirstmess.com/2024/10/30/harissa-coconut-lentils-kale-roasted-sweet-potatoes/"),
    (2569, "https://thefirstmess.com/2021/11/17/vegan-holiday-farro-salad-roasted-carrots-pomegranate/"),
    (2562, "https://thefirstmess.com/2025/03/12/spring-green-orzo-risotto-vegan/"),
    (2548, "https://thefirstmess.com/2021/01/06/creamy-vegan-mushroom-stew-farro-kale/"),
    (2549, "https://thefirstmess.com/2019/01/02/deep-green-lentil-stew-vegan-recipe/"),
    (2554, "https://thefirstmess.com/2019/04/03/blueberry-coconut-bircher-muesli/"),
    (2566, "https://thefirstmess.com/2022/02/09/kale-power-salad-vegan-spicy-almond-dressing/"),
    (2516, "https://thefirstmess.com/2017/05/17/vegan-gluten-free-easy-breakfast-cookies/"),
    (2553, "https://thefirstmess.com/2014/01/23/winter-grain-miso-bowl/"),
    (2546, "https://thefirstmess.com/2022/10/19/vegan-simple-chickpea-soup-rosemary-garlic/"),
    (2563, "https://thefirstmess.com/2019/04/17/lemony-spring-pasta-salad-vegan-recipe/"),
    (2570, "https://thefirstmess.com/2023/06/14/easy-vegan-berry-cobbler-recipe/"),
    (2547, "https://thefirstmess.com/2018/03/28/quick-smoky-red-lentil-stew-recipe/"),
    (2556, "https://thefirstmess.com/2023/07/05/zucchini-baked-oatmeal-cups-chocolate/"),
    (2550, "https://thefirstmess.com/2020/03/25/creamy-vegan-white-bean-soup-with-pasta/"),
    (2568, "https://thefirstmess.com/2024/07/10/green-lentil-edamame-salad/"),
    # Non-thefirstmess broken ones
    (4043, "https://thefoodietakesflight.com/vegan-korean-pancakes/"),
    (4042, "https://thekoreanvegan.com/vegan-kimbap/"),
    (4091, "https://cookieandkate.com/garlic-sauteed-greens-recipe/"),
    (4109, "https://cookieandkate.com/fresh-corn-salad/"),
    (4116, "https://cookieandkate.com/massaged-kale-salad-recipe/"),
    (4099, "https://cookieandkate.com/strawberry-spinach-salad/"),
    (4115, "https://ohsheglows.com/categories/recipes-2/smoothies/"),
    (4117, "https://thewoksoflife.com/bok-choy-stir-fry/"),
    (4129, "https://www.loveandlemons.com/white-bean-salad/"),
    (4110, "https://itdoesnttastelikechicken.com/vegan-green-bean-almondine/"),
    (4120, "https://itdoesnttastelikechicken.com/vegan-creamed-spinach/"),
    (4101, "https://itdoesnttastelikechicken.com/avocado-black-bean-tacos/"),
    (4105, "https://cookieandkate.com/best-guacamole-recipe/"),
    (4127, "https://cookieandkate.com/tuscan-white-bean-skillet/"),
    (4107, "https://www.loveandlemons.com/caprese-salad/"),
    (4128, "https://www.pickuplimes.com/recipe/noodle-soup-208"),
    (4104, "https://www.pickuplimes.com/recipe/bok-choy-stir-fry-206"),
    (4098, "https://www.pickuplimes.com/recipe/fresh-spring-rolls-212"),
    (4019, "https://www.vegkit.com/recipes/greek-lemon-roasted-cauliflower/"),
    (4015, "https://cdn77-s3.lazycatkitchen.com/wp-content/uploads/2018/07/vegan-dolmades-platter.jpg"),
    (4094, "https://itdoesnttastelikechicken.com/easy-vegan-bruschetta/"),
    (4131, "https://itdoesnttastelikechicken.com/kale-and-chickpea-stir-fry/"),
]

def fetch_og_image(url):
    """Use curl to fetch the page and extract og:image."""
    try:
        result = subprocess.run([
            'curl', '-sL', '--max-time', '15', '--compressed',
            '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
            '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            '-H', 'Accept-Language: en-US,en;q=0.9',
            '-H', 'Accept-Encoding: gzip, deflate, br',
            url
        ], capture_output=True, text=True, timeout=20)
        page = result.stdout
        if not page:
            return None

        # Try multiple og:image patterns
        for pattern in [
            r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\'](https?://[^"\']+)["\']',
            r'<meta[^>]*content=["\'](https?://[^"\']+)["\'][^>]*property=["\']og:image["\']',
            r'"og:image"[^>]*content=["\'](https?://[^"\']+)["\']',
            # Twitter image as fallback
            r'<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\'](https?://[^"\']+)["\']',
            r'<meta[^>]*content=["\'](https?://[^"\']+)["\'][^>]*name=["\']twitter:image["\']',
        ]:
            m = re.search(pattern, page, re.IGNORECASE)
            if m:
                img = html.unescape(m.group(1))
                # Skip placeholder/default images
                if 'placeholder' in img.lower() or 'default' in img.lower():
                    continue
                return img
    except Exception as e:
        return None
    return None

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    total = len(BROKEN)
    print(f"Fixing {total} broken images...\n")

    fixed = 0
    failed = 0
    failed_list = []

    for i, (rid, url) in enumerate(BROKEN):
        # Find current img for this recipe
        m = re.search(rf'id:{rid},title:"([^"]+)".*?img:"([^"]*)"', content)
        if not m:
            print(f"  ⚠️  #{rid}: recipe not found in HTML")
            continue

        title = m.group(1)
        old_img = m.group(2)

        pct = round((i + 1) / total * 100)
        sys.stdout.write(f'\r[{pct:3d}%] {i+1}/{total} — {title[:50]:<50}')
        sys.stdout.flush()

        og_img = fetch_og_image(url)

        if og_img and og_img != old_img:
            pattern = rf'(id:{rid},.*?)img:"{re.escape(old_img)}"'
            new_content = re.sub(pattern, f'\\1img:"{og_img}"', content, count=1)
            if new_content != content:
                content = new_content
                fixed += 1
                print(f'\n  ✅ #{rid}: {title}')
            else:
                failed += 1
                failed_list.append(f"  #{rid}: {title} (regex mismatch)")
        else:
            failed += 1
            failed_list.append(f"  #{rid}: {title} — {url}")

        time.sleep(0.3)

    print(f'\n\n{"="*60}')
    print(f'Fixed: {fixed} | Could not fix: {failed}')

    if fixed > 0:
        with open(HTML_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'\n✅ {HTML_FILE} updated with {fixed} new image URLs.')
        print(f'\nNext: git add index.html && git commit -m "Fix {fixed} broken recipe images" && git push')

    if failed_list:
        print(f'\n⚠️  Still broken ({len(failed_list)}):')
        for line in failed_list:
            print(line)

if __name__ == '__main__':
    main()
