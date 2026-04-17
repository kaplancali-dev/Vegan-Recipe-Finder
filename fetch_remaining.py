#!/usr/bin/env python3
"""Fetch images for the 22 remaining recipes with new replacement URLs."""
import time, sys
try:
    import requests
except ImportError:
    import subprocess; subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"]); import requests
try:
    from bs4 import BeautifulSoup
except ImportError:
    import subprocess; subprocess.check_call([sys.executable, "-m", "pip", "install", "beautifulsoup4"]); from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

RECIPES = [
    (248, "Roasted Beet and Lentil Salad", "https://minimalistbaker.com/kale-lentil-roasted-beet-salad/"),
    (3002, "Gluten-Free Vegan Banana Bread", "https://thebananadiaries.com/best-vegan-banana-bread-recipe/"),
    (3004, "Best Vegan Gluten-Free Zucchini Bread", "https://minimalistbaker.com/the-best-vegan-gluten-free-zucchini-bread/"),
    (3012, "Easy Gluten-Free Sandwich Bread", "https://theveganharvest.com/2020/05/30/easy-gluten-free-sandwich-bread-vegan-too/"),
    (3020, "Vegan Gluten-Free English Muffins", "https://minimalistbaker.com/gluten-free-english-muffins/"),
    (3030, "Vegan Meal Prep Taco Bowls", "https://plantyou.com/vegan-taco-bowl/"),
    (3037, "Crispy Baked Tofu", "https://sarahsvegankitchen.com/recipes/crispy-baked-tofu/"),
    (3057, "Vegan Fresh Spring Rolls", "https://www.veganricha.com/vegan-fresh-spring-rolls-with-peanut-sauce/"),
    (3085, "Vegan Sundubu Jjigae", "https://www.maangchi.com/recipe/sundubu-jjigae"),
    (3087, "Green Smoothie", "https://minimalistbaker.com/my-favorite-green-smoothie/"),
    (3090, "Chocolate Peanut Butter Smoothie", "https://www.noracooks.com/peanut-butter-banana-smoothie/"),
    (3093, "Berry Beet Smoothie", "https://www.thefirstmess.com/2016/05/07/vegan-berry-beet-velvet-smoothie-smoothie/"),
    (3103, "Seitan Bacon Strips", "https://itdoesnttastelikechicken.com/vegan-wheat-starch-bacon/"),
    (3105, "Cashew Mozzarella", "https://www.elephantasticvegan.com/cashew-mozzarella/"),
    (3107, "Vegan Feta Cheese", "https://rainbowplantlife.com/greek-style-vegan-feta/"),
    (3108, "Vegan Parmesan", "https://itdoesnttastelikechicken.com/homemade-vegan-parmesan-cheese/"),
    (3111, "Vegan Pho", "https://www.gimmesomeoven.com/vegetarian-vegan-pho-recipe/"),
    (3119, "Vegan Miso Soup", "https://eatplant-based.com/shiitake-miso-soup/"),
    (3120, "Vegan Teriyaki Tofu", "https://itdoesnttastelikechicken.com/easy-sticky-teriyaki-tofu/"),
    (3122, "Vegan Thai Green Curry", "https://hot-thai-kitchen.com/vegan-green-curry/"),
    (4015, "Vegan Dolmades", "https://godairyfree.org/recipes/vegan-dolmas"),
    (4060, "Vegan Cao Lau", "https://www.sbs.com.au/food/recipe/hoi-an-noodles-cao-lau/cuslyawb2"),
]

def get_og_image(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        og = soup.find("meta", property="og:image")
        if og and og.get("content"): return og["content"]
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"): return tw["content"]
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if src and any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                if "logo" not in src.lower() and "icon" not in src.lower() and "avatar" not in src.lower():
                    return src
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

results = []
for i, (rid, title, url) in enumerate(RECIPES):
    print(f"[{i+1}/{len(RECIPES)}] {title}...", end=" ", flush=True)
    img = get_og_image(url)
    if img:
        results.append(f"{rid}|{url}|{img}")
        print("OK")
    else:
        print("FAILED")
    if i % 3 == 2: time.sleep(0.5)

with open("remaining_results.txt", "w") as f:
    f.write("\n".join(results))

print(f"\nDone! Found {len(results)}/{len(RECIPES)}. Saved to remaining_results.txt")
