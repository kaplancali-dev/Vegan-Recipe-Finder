# HARVEST Recipe Pipeline

Scripts to expand the recipe database from 1,107 to 2,000+ recipes.

## Strategy

- **Favor naturally GF recipes** — rice-based, bean-based, whole-food dishes
- **Allow simple swaps** — soy sauce → tamari, pasta → GF pasta, flour → GF flour
- **Skip complex gluten** — seitan, bread baking, wheat-dependent recipes
- **All photos on Supabase** — no hotlinked external images

## Pipeline Steps

### 1. Scrape recipes

```bash
# Install dependencies
pip install requests beautifulsoup4 Pillow

# Scrape from a URL list
python scrape-recipes.py urls.txt

# Or scrape a single URL
python scrape-recipes.py --url https://example.com/recipe-name/
```

Output: `scraped-recipes.json`

The scraper extracts JSON-LD recipe schema (used by nearly all food blogs), normalizes ingredients, auto-categorizes, and flags gluten status.

### 2. Upload photos

```bash
# Set your Supabase service key first (edit upload-photos.py line 30)
# Get it from: Supabase Dashboard → Settings → API → service_role key

# Preview without uploading
python upload-photos.py --dry-run

# Upload for real
python upload-photos.py
```

For each recipe:
1. Tries the original recipe photo first
2. Falls back to Pexels search
3. Resizes to 800×600, compresses to ~80 KB JPEG
4. Uploads to Supabase `recipe-images` bucket

### 3. Merge into database

```bash
python merge-recipes.py
```

Reads `scraped-recipes.json`, de-duplicates against existing `recipes.json`, assigns IDs, and writes the merged result.

### 4. Build and deploy

```bash
cd ../
npm run build
cp dist/index.html ../../
cp dist/assets/* ../../assets/
cd ../../
git add .
git commit -m "Add N new recipes"
git push
```

## Target Sources

Priority creators (international, large catalogs, lean GF):

| Creator | Country | Site | Est. Recipes | Notes |
|---------|---------|------|-------------|-------|
| Pick Up Limes | Netherlands | pickuplimes.com | 200+ | Mostly GF, nutrition-focused |
| BOSH | UK | bosh.tv | 800+ | Large catalog, varied |
| WoonHeng | Malaysia | woonheng.com | 100+ | Asian, naturally GF (rice-based) |
| Ela Vegan | Germany | elavegan.com | 200+ | All GF, clean ingredients |
| Bianca Zapatka | Germany | biancazapatka.com | 300+ | International, many GF |
| Mob Kitchen | UK | mobkitchen.co.uk | 2000+ | Filter for vegan, large catalog |
| The Korean Vegan | USA | thekoreanvegan.com | 100+ | Korean, many GF |
| Hot Thai Kitchen | Thailand | hotthaikitchen.com | 50+ | Thai, naturally GF |
| Wok of Life | USA | thewoksoflife.com | 100+ | Chinese, filter for vegan |
| Pickled Plum | Japan | pickledplum.com | 100+ | Japanese, many GF |

## URL List Format

One URL per line in `urls.txt`. Lines starting with `#` are comments.

```
# Pick Up Limes — Naturally GF
https://www.pickuplimes.com/recipe/creamy-one-pot-pasta-810
https://www.pickuplimes.com/recipe/thai-peanut-noodles-123

# WoonHeng — Asian GF
https://woonheng.com/vegan-pad-woon-sen/
```

## Recipe Schema

Each recipe in `recipes.json`:

```json
{
  "id": 4371,
  "title": "Thai Peanut Noodles",
  "site": "Pick Up Limes",
  "url": "https://pickuplimes.com/recipe/...",
  "img": "https://zhncgdbhgkeiybdbzsql.supabase.co/storage/v1/object/public/recipe-images/4371.jpg",
  "cats": ["Dinner", "Asian", "Thai", "Gluten-Free", "Quick Meals"],
  "time": 20,
  "servings": 4,
  "ing": ["rice noodles", "peanut butter", "tamari", "lime", "garlic", "ginger", "maple syrup", "sriracha", "edamame", "carrots", "cilantro", "peanuts"],
  "nut": {"cal": 420, "pro": 15, "carb": 52, "fat": 18, "fib": 6}
}
```

## Current Stats

- Total recipes: 1,107
- Naturally GF: 358 (32%)
- Target: 2,000 (893 needed)
- Goal GF %: 50%+ (aim for ~450 GF in the new batch)
