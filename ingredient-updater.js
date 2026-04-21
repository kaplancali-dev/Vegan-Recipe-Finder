#!/usr/bin/env node

/**
 * ingredient-updater.js
 *
 * Fetches JSON-LD structured data from recipe URLs found in the HARVEST
 * index.html, normalizes ingredient strings, and compares them with the
 * existing `ing` arrays. Processes the first 20 recipes.
 *
 * Usage:  node ingredient-updater.js
 * Requires: Node 18+ (built-in fetch)
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration ──────────────────────────────────────────────────────────

const INDEX_PATH = path.join(
  __dirname,
  'index.html'
);
// Parse --limit=N and --offset=N from command line
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const offsetArg = process.argv.find(a => a.startsWith('--offset='));
const RECIPE_LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20;
const RECIPE_OFFSET = offsetArg ? parseInt(offsetArg.split('=')[1], 10) : 0;
const FETCH_TIMEOUT_MS = 10000;

// ─── Ingredient normalizer ──────────────────────────────────────────────────
//
// Design principles:
//   1. Return an ARRAY — some strings contain multiple ingredients
//      ("salt and black pepper" → ["salt", "black pepper"])
//   2. Preserve meaningful qualifiers: "vegan", "extra-firm", "full-fat",
//      "smoked", "crushed" (when part of a product name like "crushed tomatoes")
//   3. Strip: quantities, units, prep instructions, brand names, parentheticals
//   4. Reject junk: single adjectives, too-short results, nonsense
//   5. Use a known-ingredient map for tricky edge cases

const UNITS = new Set([
  // volume
  'cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'teaspoon', 'teaspoons',
  'tsp', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'litre',
  'litres', 'fl', 'fluid', 'gallon', 'gallons', 'quart', 'quarts', 'pint', 'pints',
  // weight
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds', 'g', 'gram',
  'grams', 'kg', 'kilogram', 'kilograms',
  // count / sizing
  'pinch', 'pinches', 'dash', 'dashes', 'bunch', 'bunches', 'sprig',
  'sprigs', 'handful', 'handfuls', 'clove', 'cloves', 'head', 'heads',
  'stalk', 'stalks', 'piece', 'pieces', 'slice', 'slices', 'can', 'cans',
  'jar', 'jars', 'package', 'packages', 'pkg', 'bag', 'bags', 'box', 'boxes',
  'container', 'containers', 'stick', 'sticks', 'block', 'blocks',
  'inch', 'inches', 'cm', 'tin', 'tins', 'bottle', 'bottles', 'tube',
  'batch', 'batches', 'rack', 'racks', 'sheet', 'sheets',
  'bundle', 'bundles', 'tbsps', 'tsps', 'c', 'drop', 'drops',
  'pack', 'packs', 'carton', 'cartons', 'packet', 'packets',
]);

// Size words — removed as tokens but don't contribute to the ingredient name
const SIZE_WORDS = new Set([
  'small', 'medium', 'large', 'extra-large', 'thin', 'thick', 'tiny', 'big',
  'whole', 'half',
]);

// Word-form numbers to strip (the digit regex catches "1" but not "one")
const WORD_NUMBERS = new Set([
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'twelve', 'fifteen', 'twenty', 'thirty',
]);

// Prep/method words to strip — these describe HOW, not WHAT
const PREP_WORDS = new Set([
  'diced', 'chopped', 'minced', 'sliced', 'grated', 'drained', 'divided',
  'shredded', 'peeled', 'cubed', 'mashed', 'melted', 'softened', 'frozen',
  'thawed', 'packed', 'sifted', 'julienned', 'halved', 'quartered', 'torn',
  'trimmed', 'rinsed', 'soaked', 'toasted', 'blanched', 'steamed', 'cooked',
  'uncooked', 'raw', 'deseeded', 'seeded', 'pitted', 'cored', 'deboned',
  'fresh', 'finely', 'roughly', 'thinly', 'freshly', 'lightly', 'firmly',
  'loosely', 'heaping', 'rounded', 'level', 'generous', 'scant', 'about',
  'approximately', 'optional', 'plus', 'more', 'additional', 'needed',
  'desired', 'warm', 'cold', 'room', 'temperature', 'lukewarm',
  'cracked', 'pressed', 'squeezed', 'zested', 'whisked', 'beaten',
  'sauteed', 'sautéed', 'fried', 'baked', 'boiled', 'grilled', 'broiled',
  'pureed', 'puréed', 'blended', 'strained', 'sieved', 'chilled',
  'warmed', 'cooled', 'deveined', 'cleaned', 'washed', 'ripe', 'overripe',
  'unripe', 'frying', 'searing', 'dollop', 'choice', 'cut', 'riced',
  'bite', 'size', 'sized', 'rectangles', 'cubes', 'strips', 'pieces',
  'chunks', 'wedges', 'rounds', 'rings', 'matchsticks', 'planks',
  'chop', 'cube', 'dice', 'undrained', 'separated', 'removed',
  'stemmed', 'cored', 'hulled', 'pitted', 'needed',
]);

// Words that only make sense as context, never as an ingredient name
const FILLER_WORDS = new Set([
  'of', 'or', 'ot', 'and', 'for', 'with', 'in', 'a', 'an', 'the', 'as', 'if',
  'your', 'my', 'our', 'each', 'per', 'some', 'few', 'to', 'taste', 'top',
  'on', 'at', 'into', 'from', 'up', 'such',
]);

// Single words that are NOT valid ingredient names by themselves
const JUNK_SINGLES = new Set([
  'garnish', 'serving', 'topping', 'coating', 'dusting', 'drizzle',
  'dollop', 'splash', 'glug', 'knob', 'pat', 'other', 'choice',
  'white', 'yellow', 'red', 'green', 'black', 'brown', 'dark', 'light',
  'hot', 'mild', 'whole', 'half', 'extra', 'double', 'plain', 'regular',
  'thick', 'thin', 'dry', 'wet', 'fine', 'coarse',
  'unsweetened', 'sweetened', 'original', 'natural', 'organic',
  'thai', 'indian', 'italian', 'chinese', 'japanese', 'korean', 'mexican',
  'french', 'greek', 'spanish', 'asian', 'african', 'caribbean',
  'oz', 'tbsp', 'tsp',  // units that leak through as standalone
]);

// Known compound ingredients — these override the normalizer when matched
const KNOWN_INGREDIENTS = new Map([
  // "juice of X" patterns
  ['juice of lemon', 'lemon juice'],
  ['juice of lime', 'lime juice'],
  ['juice of orange', 'orange juice'],
  // Common products that look like "prep + noun"
  ['crushed tomatoes', 'crushed tomatoes'],
  ['crushed red pepper', 'crushed red pepper'],
  ['crushed red pepper flakes', 'red pepper flakes'],
  ['ground cumin', 'cumin'],
  ['ground coriander', 'coriander'],
  ['ground turmeric', 'turmeric'],
  ['ground cinnamon', 'cinnamon'],
  ['ground nutmeg', 'nutmeg'],
  ['ground ginger', 'ginger'],
  ['ground cardamom', 'cardamom'],
  ['ground cloves', 'cloves'],
  ['ground allspice', 'allspice'],
  ['ground fenugreek', 'fenugreek'],
  ['ground black pepper', 'black pepper'],
  ['ground white pepper', 'white pepper'],
  ['dried oregano', 'oregano'],
  ['dried basil', 'basil'],
  ['dried thyme', 'thyme'],
  ['dried rosemary', 'rosemary'],
  ['dried dill', 'dill'],
  ['dried parsley', 'parsley'],
  ['dried mint', 'mint'],
  ['smoked paprika', 'smoked paprika'],
  ['sweet paprika', 'paprika'],
  ['hot paprika', 'paprika'],
  ['roasted red peppers', 'roasted red peppers'],
  ['roasted garlic', 'roasted garlic'],
  ['sun-dried tomatoes', 'sun-dried tomatoes'],
  ['fire-roasted tomatoes', 'fire-roasted tomatoes'],
  ['cream cheese', 'vegan cream cheese'],
  ['chili garlic sauce', 'chili garlic sauce'],
  ['green curry paste', 'green curry paste'],
  ['red curry paste', 'red curry paste'],
  ['yellow curry paste', 'yellow curry paste'],
  ['tomato paste', 'tomato paste'],
  ['tomato sauce', 'tomato sauce'],
  ['tomato puree', 'tomato puree'],
  ['soy sauce', 'soy sauce'],
  ['hoisin sauce', 'hoisin sauce'],
  ['light soy sauce', 'soy sauce'],
  ['dark soy sauce', 'soy sauce'],
  ['low-sodium soy sauce', 'soy sauce'],
  ['reduced-sodium soy sauce', 'soy sauce'],
  ['gluten-free soy sauce', 'soy sauce'],
  ['hot sauce', 'hot sauce'],
  ['bbq sauce', 'bbq sauce'],
  ['barbecue sauce', 'bbq sauce'],
  ['worcestershire sauce', 'vegan worcestershire sauce'],
  ['peanut butter', 'peanut butter'],
  ['almond butter', 'almond butter'],
  ['tahini paste', 'tahini'],
  ['coconut cream', 'coconut cream'],
  ['coconut oil', 'coconut oil'],
  ['olive oil', 'olive oil'],
  ['sesame oil', 'sesame oil'],
  ['avocado oil', 'avocado oil'],
  ['vegetable oil', 'vegetable oil'],
  ['canola oil', 'canola oil'],
  ['grapeseed oil', 'grapeseed oil'],
  ['neutral oil', 'oil'],
  ['extra virgin olive oil', 'olive oil'],
  ['extra-virgin olive oil', 'olive oil'],
  ['full-fat coconut milk', 'coconut milk'],
  ['lite coconut milk', 'coconut milk'],
  ['light coconut milk', 'coconut milk'],
  ['coconut milk', 'coconut milk'],
  ['almond milk', 'almond milk'],
  ['oat milk', 'oat milk'],
  ['soy milk', 'soy milk'],
  ['plant-based milk', 'plant-based milk'],
  ['plant milk', 'plant-based milk'],
  ['vegetable broth', 'vegetable broth'],
  ['vegetable stock', 'vegetable broth'],
  ['veg stock', 'vegetable broth'],
  ['nutritional yeast', 'nutritional yeast'],
  ['baking powder', 'baking powder'],
  ['baking soda', 'baking soda'],
  ['apple cider vinegar', 'apple cider vinegar'],
  ['rice vinegar', 'rice vinegar'],
  ['red wine vinegar', 'red wine vinegar'],
  ['white wine vinegar', 'white wine vinegar'],
  ['balsamic vinegar', 'balsamic vinegar'],
  ['maple syrup', 'maple syrup'],
  ['agave nectar', 'agave'],
  ['brown sugar', 'brown sugar'],
  ['coconut sugar', 'coconut sugar'],
  ['powdered sugar', 'powdered sugar'],
  ['confectioners sugar', 'powdered sugar'],
  ['black beans', 'black beans'],
  ['kidney beans', 'kidney beans'],
  ['pinto beans', 'pinto beans'],
  ['cannellini beans', 'cannellini beans'],
  ['white beans', 'white beans'],
  ['navy beans', 'navy beans'],
  ['lima beans', 'lima beans'],
  ['green beans', 'green beans'],
  ['refried beans', 'refried beans'],
  ['red lentils', 'red lentils'],
  ['green lentils', 'green lentils'],
  ['brown lentils', 'brown lentils'],
  ['french lentils', 'french lentils'],
  ['black pepper', 'black pepper'],
  ['white pepper', 'white pepper'],
  ['red pepper flakes', 'red pepper flakes'],
  ['cayenne pepper', 'cayenne pepper'],
  ['bell pepper', 'bell pepper'],
  ['bell peppers', 'bell peppers'],
  ['red bell pepper', 'red bell pepper'],
  ['green bell pepper', 'green bell pepper'],
  ['yellow bell pepper', 'yellow bell pepper'],
  ['jalapeno pepper', 'jalapeño'],
  ['jalapeño pepper', 'jalapeño'],
  ['serrano pepper', 'serrano pepper'],
  ['chipotle pepper', 'chipotle pepper'],
  ['red onion', 'red onion'],
  ['yellow onion', 'onion'],
  ['white onion', 'onion'],
  ['sweet onion', 'onion'],
  ['green onion', 'green onion'],
  ['green onions', 'green onion'],
  ['spring onion', 'green onion'],
  ['spring onions', 'green onion'],
  ['brown rice', 'brown rice'],
  ['white rice', 'white rice'],
  ['jasmine rice', 'jasmine rice'],
  ['basmati rice', 'basmati rice'],
  ['arborio rice', 'arborio rice'],
  ['wild rice', 'wild rice'],
  ['extra-firm tofu', 'extra-firm tofu'],
  ['extra firm tofu', 'extra-firm tofu'],
  ['firm tofu', 'firm tofu'],
  ['silken tofu', 'silken tofu'],
  ['soft tofu', 'soft tofu'],
  ['vegan butter', 'vegan butter'],
  ['vegan cream cheese', 'vegan cream cheese'],
  ['vegan parmesan', 'vegan parmesan'],
  ['vegan parmesan cheese', 'vegan parmesan'],
  ['vegan mozzarella', 'vegan mozzarella'],
  ['vegan cheddar', 'vegan cheddar'],
  ['vegan sour cream', 'vegan sour cream'],
  ['vegan yogurt', 'vegan yogurt'],
  ['vegan mayo', 'vegan mayo'],
  ['vegan mayonnaise', 'vegan mayo'],
  ['vegan feta', 'vegan feta'],
  ['vegan feta cheese', 'vegan feta'],
  ['vegan ground beef', 'vegan ground beef'],
  ['liquid smoke', 'liquid smoke'],
  ['chile powder', 'chili powder'],
  ['red chile powder', 'chili powder'],
  ['indian red chile powder', 'chili powder'],
  ['chili powder', 'chili powder'],
  ['curry powder', 'curry powder'],
  ['garam masala', 'garam masala'],
  ['onion powder', 'onion powder'],
  ['garlic powder', 'garlic powder'],
  ['cumin seeds', 'cumin seeds'],
  ['coriander seeds', 'coriander seeds'],
  ['mustard seeds', 'mustard seeds'],
  ['fennel seeds', 'fennel seeds'],
  ['sesame seeds', 'sesame seeds'],
  ['chia seeds', 'chia seeds'],
  ['flax seeds', 'flax seeds'],
  ['hemp seeds', 'hemp seeds'],
  ['pumpkin seeds', 'pumpkin seeds'],
  ['sunflower seeds', 'sunflower seeds'],
  ['poppy seeds', 'poppy seeds'],
  ['lemon juice', 'lemon juice'],
  ['lime juice', 'lime juice'],
  ['orange juice', 'orange juice'],
  ['lemon zest', 'lemon zest'],
  ['lime zest', 'lime zest'],
  ['orange zest', 'orange zest'],
  ['bay leaf', 'bay leaf'],
  ['bay leaves', 'bay leaf'],
  ['flat-leaf parsley', 'parsley'],
  ['italian parsley', 'parsley'],
  ['fresh basil', 'basil'],
  ['fresh cilantro', 'cilantro'],
  ['fresh parsley', 'parsley'],
  ['fresh thyme', 'thyme'],
  ['fresh rosemary', 'rosemary'],
  ['fresh dill', 'dill'],
  ['fresh mint', 'mint'],
  ['fresh ginger', 'ginger'],
  ['ginger paste', 'ginger'],
  ['garlic paste', 'garlic'],
  ['kosher salt', 'salt'],
  ['sea salt', 'salt'],
  ['flaky salt', 'salt'],
  ['table salt', 'salt'],
  ['pink salt', 'salt'],
  ['all-purpose flour', 'all-purpose flour'],
  ['whole wheat flour', 'whole wheat flour'],
  ['bread flour', 'bread flour'],
  ['coconut flour', 'coconut flour'],
  ['almond flour', 'almond flour'],
  ['chickpea flour', 'chickpea flour'],
  ['corn tortillas', 'corn tortillas'],
  ['flour tortillas', 'flour tortillas'],
  ['corn starch', 'cornstarch'],
  ['arrowroot powder', 'arrowroot powder'],
  ['arrowroot starch', 'arrowroot powder'],
  ['naan bread', 'naan'],
  ['pita bread', 'pita'],
  ['miso paste', 'miso paste'],
  ['white miso paste', 'miso paste'],
  ['brown miso paste', 'miso paste'],
  ['red miso paste', 'miso paste'],
  ['dijon mustard', 'dijon mustard'],
  ['yellow mustard', 'yellow mustard'],
  ['stone-ground mustard', 'stone-ground mustard'],
  ['corn kernels', 'corn'],
  ['sweet corn', 'corn'],
  ['cherry tomatoes', 'cherry tomatoes'],
  ['grape tomatoes', 'grape tomatoes'],
  ['roma tomatoes', 'roma tomatoes'],
  ['diced tomatoes', 'diced tomatoes'],
  ['canned tomatoes', 'canned tomatoes'],
  ['tinned tomatoes', 'canned tomatoes'],
  ['san marzano tomatoes', 'san marzano tomatoes'],
  ['baby spinach', 'spinach'],
  ['baby kale', 'kale'],
  ['baby arugula', 'arugula'],
  // Standalone words that map to canonical names
  ['pepper', 'black pepper'],
  ['salt', 'salt'],
  ['sugar', 'sugar'],
  ['cornstarch', 'cornstarch'],
  ['tahini', 'tahini'],
  ['sriracha', 'sriracha'],
  ['tamari', 'tamari'],
  ['mirin', 'mirin'],
  // Herb leaves
  ['thyme leaves', 'thyme'],
  ['basil leaves', 'basil'],
  ['cilantro leaves', 'cilantro'],
  ['parsley leaves', 'parsley'],
  ['mint leaves', 'mint'],
  ['rosemary leaves', 'rosemary'],
  ['sage leaves', 'sage'],
  ['curry leaves', 'curry leaves'],
  ['fenugreek leaves', 'fenugreek leaves'],
  ['kaffir lime leaves', 'kaffir lime leaves'],
  ['fresh thyme leaves', 'thyme'],
  // Natural/organic prefix
  ['natural yogurt', 'vegan yogurt'],
  ['natural plant-based yogurt', 'vegan yogurt'],
  ['plain yogurt', 'vegan yogurt'],
  // Cardamom
  ['cardamom pods', 'cardamom'],
  ['green cardamom pods', 'cardamom'],
  // Peppercorns
  ['black peppercorns', 'black pepper'],
  ['peppercorns', 'black pepper'],
  // Cinnamon
  ['cinnamon sticks', 'cinnamon'],
  ['cinnamon stick', 'cinnamon'],
  // Chilies
  ['red chilies', 'red chili'],
  ['green chilies', 'green chili'],
  ['red chillies', 'red chili'],
  ['green chillies', 'green chili'],
  // Jackfruit
  ['young green jackfruit', 'jackfruit'],
  ['young green jackfruit in water', 'jackfruit'],
  ['young green jackfruit in brine', 'jackfruit'],
  ['jackfruit in water', 'jackfruit'],
  ['jackfruit in brine', 'jackfruit'],
  // Garbanzo = chickpeas
  ['garbanzo beans', 'chickpeas'],
  ['garbanzo', 'chickpeas'],
  // Ginger
  ['ginger root', 'ginger'],
  ['fresh ginger root', 'ginger'],
  // Zest patterns (reversed word order)
  ['zest lemon', 'lemon zest'],
  ['zest lime', 'lime zest'],
  ['zest orange', 'orange zest'],
  // Brand/product names
  ['better than bouillon vegetable base', 'vegetable broth'],
  ['better than bouillon', 'vegetable broth'],
  // Maple
  ['maple sugar', 'maple sugar'],
  // Misc
  ['vanilla extract', 'vanilla extract'],
  ['almond extract', 'almond extract'],
  ['rolled oats', 'rolled oats'],
  ['steel-cut oats', 'steel-cut oats'],
  ['quick oats', 'oats'],
  ['cocoa powder', 'cocoa powder'],
  ['cacao powder', 'cacao powder'],
]);

// ─── Vegan auto-mapping ──────────────────────────────────────────────────────
// Since HARVEST is a 100% vegan site, non-vegan terms from source recipes
// must be auto-converted to vegan equivalents.
const VEGAN_MAP = new Map([
  ['butter', 'vegan butter'],
  ['unsalted butter', 'vegan butter'],
  ['salted butter', 'vegan butter'],
  ['ghee', 'vegan butter'],
  ['heavy cream', 'vegan cream'],
  ['heavy whipping cream', 'vegan cream'],
  ['whipping cream', 'vegan cream'],
  ['cream', 'vegan cream'],
  ['sour cream', 'vegan sour cream'],
  ['cream cheese', 'vegan cream cheese'],
  ['milk', 'plant-based milk'],
  ['whole milk', 'plant-based milk'],
  ['skim milk', 'plant-based milk'],
  ['buttermilk', 'vegan buttermilk'],
  ['yogurt', 'vegan yogurt'],
  ['greek yogurt', 'vegan yogurt'],
  ['plain yogurt', 'vegan yogurt'],
  ['parmesan', 'vegan parmesan'],
  ['parmesan cheese', 'vegan parmesan'],
  ['parmigiano-reggiano', 'vegan parmesan'],
  ['parmigiano reggiano', 'vegan parmesan'],
  ['mozzarella', 'vegan mozzarella'],
  ['mozzarella cheese', 'vegan mozzarella'],
  ['cheddar', 'vegan cheddar'],
  ['cheddar cheese', 'vegan cheddar'],
  ['feta', 'vegan feta'],
  ['feta cheese', 'vegan feta'],
  ['cheese', 'vegan cheese'],
  ['ricotta', 'vegan ricotta'],
  ['ricotta cheese', 'vegan ricotta'],
  ['goat cheese', 'vegan goat cheese'],
  ['mayo', 'vegan mayo'],
  ['mayonnaise', 'vegan mayo'],
  ['honey', 'maple syrup'],
  ['egg', 'flax egg'],
  ['eggs', 'flax egg'],
  ['chicken broth', 'vegetable broth'],
  ['chicken stock', 'vegetable broth'],
  ['beef broth', 'vegetable broth'],
  ['beef stock', 'vegetable broth'],
  ['fish sauce', 'vegan fish sauce'],
  ['worcestershire sauce', 'vegan worcestershire sauce'],
  ['anchovy paste', 'capers'],
  ['pecorino', 'vegan parmesan'],
  ['pecorino-romano', 'vegan parmesan'],
  ['pecorino romano', 'vegan parmesan'],
  ['romano cheese', 'vegan parmesan'],
  ['gruyere', 'vegan cheese'],
  ['gruyère', 'vegan cheese'],
  ['gouda', 'vegan cheese'],
  ['provolone', 'vegan cheese'],
  ['brie', 'vegan cheese'],
  ['half-and-half', 'vegan cream'],
  ['half and half', 'vegan cream'],
  ['crème fraîche', 'vegan sour cream'],
  ['creme fraiche', 'vegan sour cream'],
]);

/**
 * Normalize a raw ingredient string into one or more clean ingredient names.
 * Returns an array of strings (usually 1, but can be 2+ for "X and Y").
 */
function normalizeIngredient(raw) {
  if (!raw || typeof raw !== 'string') return [];

  let s = raw.toLowerCase().trim();

  // ── Step 1: Strip noise characters ──
  s = s.replace(/\([^)]*\)/g, '');         // (parenthetical notes)
  s = s.replace(/\[[^\]]*\]/g, '');         // [bracketed notes]
  s = s.replace(/[()[\]]/g, '');            // stray brackets
  s = s.replace(/[*®™•·~`†‡§#^]+/g, '');   // footnote markers
  s = s.replace(/[\u00BC-\u00BE\u2150-\u215E]/g, ''); // unicode fractions
  s = s.replace(/\b\d+[\d\/\.\-–—]*\s*/g, '');        // numbers
  s = s.replace(/^[\s\d\/\.\-–—]+/, '');               // leading number junk

  // ── Step 2: Handle colons ──
  // If before-colon is all filler (like "for serving:"), take after-colon part
  if (s.includes(':')) {
    const [before, ...rest] = s.split(':');
    const after = rest.join(':').trim();
    const beforeWords = before.trim().split(/\s+/);
    const allFiller = beforeWords.every(w => FILLER_WORDS.has(w) || PREP_WORDS.has(w) || w === 'serving');
    s = (allFiller && after) ? after : before.trim();
  }

  // ── Step 3: Handle "or" alternatives — take first option ──
  s = s.replace(/\s+or\s+.*$/i, '');

  // ── Step 4: Split on comma — take first part (pre-prep-instructions) ──
  s = s.split(',')[0].trim();

  // ── Step 5: Handle dashes/en-dashes as separator ──
  s = s.replace(/\s+[-–—]+\s+.*$/, '');

  // ── Step 5b: Strip trailing "in X" / "of choice" / packaging phrases ──
  s = s.replace(/\s+in (water|brine|oil|juice|syrup|their own juice)$/i, '');
  s = s.replace(/\s+of choice$/i, '');
  s = s.replace(/\s+for (frying|cooking|serving|garnish|garnishing|topping|drizzling)$/i, '');
  s = s.replace(/\s+for serving$/i, '');
  s = s.replace(/\s+to garnish$/i, '');
  s = s.replace(/\s+to serve$/i, '');
  // Strip "for <specific-use>" — e.g. "olive oil for sweet potatoes" → "olive oil"
  s = s.replace(/\s+for\s+(?:the\s+)?(?:sweet potatoes|sauce|dressing|topping|coating|batter|marinade|filling|crust|glaze|drizzle|roasting|baking|cooking|salad|pasta|bowl|rice|noodles|soup|stew|curry|tacos|wraps|sandwiches|burgers)$/i, '');

  // ── Step 6: Clean up ──
  s = s.replace(/[^a-zà-öø-ÿñ\s'-]/g, ' ');  // keep letters (incl. accented), spaces, hyphens, apostrophes
  s = s.replace(/\s{2,}/g, ' ').trim();

  // ── Step 7: Handle "X and Y" BEFORE known map (so "salt and pepper" splits) ──
  if (/\band\b/.test(s)) {
    const parts = s.split(/\s+and\s+/);
    const results = [];
    for (const part of parts) {
      const p = part.trim();
      // Try known map first for each sub-part
      const km = matchKnownIngredient(p);
      if (km) { results.push(km); continue; }
      const sub = normalizeSingle(p);
      if (sub) {
        // Check if the normalized result maps to something known
        const km2 = matchKnownIngredient(sub);
        results.push(km2 || sub);
      }
    }
    if (results.length > 0) return results;
  }

  // ── Step 8: Check known-ingredient map ──
  const knownMatch = matchKnownIngredient(s);
  if (knownMatch) return [knownMatch];

  // ── Step 9: Handle "X + Y" ──
  if (/\+/.test(s)) {
    const parts = s.split(/\s*\+\s*/);
    const results = [];
    for (const part of parts) {
      const sub = normalizeSingle(part.trim());
      if (sub) results.push(sub);
    }
    if (results.length > 0) return results;
  }

  // ── Step 10: Single ingredient normalization ──
  const result = normalizeSingle(s);
  return result ? [result] : [];
}

/**
 * Try to match a cleaned string against the known-ingredient map.
 * Tries the full string first, then strips leading words progressively.
 */
function matchKnownIngredient(s) {
  // Direct match
  if (KNOWN_INGREDIENTS.has(s)) return KNOWN_INGREDIENTS.get(s);

  // Strip leading words one at a time and try again
  const words = s.split(/\s+/);
  for (let start = 1; start < words.length && start <= 4; start++) {
    const sub = words.slice(start).join(' ');
    if (KNOWN_INGREDIENTS.has(sub)) return KNOWN_INGREDIENTS.get(sub);
  }

  // Try "juice of X" → "X juice"
  const juiceMatch = s.match(/^juice\s+of\s+(.+)/);
  if (juiceMatch) {
    let fruit = juiceMatch[1].trim();
    // De-pluralize common fruits: "limes" → "lime", "lemons" → "lemon"
    fruit = fruit.replace(/s$/, '');
    const juiceKey = fruit + ' juice';
    if (KNOWN_INGREDIENTS.has(juiceKey)) return KNOWN_INGREDIENTS.get(juiceKey);
    if (fruit.length >= 3) return fruit + ' juice';
  }

  return null;
}

// Words that can be stripped from the front if more content follows
const STRIP_PREFIXES = new Set([
  'natural', 'organic', 'unsweetened', 'sweetened', 'original',
  'store-bought', 'homemade', 'good-quality', 'high-quality',
  'salted', 'unsalted', 'old-fashioned', 'neutral', 'low-sodium',
]);

/**
 * Normalize a single ingredient string (no "and"/"+" splitting needed).
 */
function normalizeSingle(s) {
  if (!s || s.length < 2) return null;

  // Check known map first
  const km = matchKnownIngredient(s);
  if (km) return km;

  // Tokenize
  let tokens = s.split(/\s+/).filter(Boolean);

  // Remove word-numbers (one, two, three...)
  let filtered = tokens.filter(t => !WORD_NUMBERS.has(t.replace(/[^a-z-]/g, '')));
  if (filtered.length > 0) tokens = filtered;

  // Remove unit tokens (but keep if it's the ONLY word — edge case like "cloves")
  filtered = tokens.filter(t => !UNITS.has(t.replace(/[^a-z-]/g, '')));
  if (filtered.length > 0) tokens = filtered;

  // Remove size words
  filtered = tokens.filter(t => !SIZE_WORDS.has(t.replace(/[^a-z-]/g, '')));
  if (filtered.length > 0) tokens = filtered;

  // Remove filler words from anywhere FIRST (so "as needed water" → "needed water")
  filtered = tokens.filter(t => !FILLER_WORDS.has(t));
  if (filtered.length > 0) tokens = filtered;

  // Remove STRIP_PREFIXES from front
  while (tokens.length > 1 && STRIP_PREFIXES.has(tokens[0].replace(/[^a-z-]/g, ''))) {
    tokens.shift();
  }

  // Remove LEADING prep words only (not all — "crushed tomatoes" should keep "crushed")
  while (tokens.length > 1 && PREP_WORDS.has(tokens[0].replace(/[^a-z-]/g, ''))) {
    tokens.shift();
  }

  // Remove TRAILING prep/filler words
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1].replace(/[^a-z-]/g, '');
    if (PREP_WORDS.has(last) || FILLER_WORDS.has(last)) {
      tokens.pop();
    } else break;
  }

  // If ALL remaining tokens are prep words, it's junk (e.g., "to taste")
  if (tokens.every(t => PREP_WORDS.has(t.replace(/[^a-z-]/g, '')) || FILLER_WORDS.has(t))) {
    return null;
  }

  let result = tokens.join(' ').trim();

  // Clean trailing/leading punctuation
  result = result.replace(/[^a-zà-öø-ÿñ\s'-]+$/, '').replace(/^[^a-zà-öø-ÿñ]+/, '').trim();

  // Plant-based → vegan
  result = result.replace(/\bplant-based\b/, 'vegan').replace(/\bplant based\b/, 'vegan');

  // Strip trailing "leaves" (but not when it's the whole thing or part of a known phrase)
  if (result.endsWith(' leaves') && !KNOWN_INGREDIENTS.has(result)) {
    result = result.replace(/ leaves$/, '');
  }

  // Final check against known map (post-strip)
  if (KNOWN_INGREDIENTS.has(result)) return KNOWN_INGREDIENTS.get(result);

  // Reject junk results
  if (!result || result.length < 2) return null;
  if (result.split(/\s+/).length === 1 && JUNK_SINGLES.has(result)) return null;

  // ── Vegan auto-mapping ──
  // Since HARVEST is a vegan site, convert non-vegan terms to vegan equivalents
  if (VEGAN_MAP.has(result)) return VEGAN_MAP.get(result);
  // Also check progressively (e.g. "shredded parmesan" → check "parmesan")
  const resultWords = result.split(/\s+/);
  for (let start = 0; start < resultWords.length; start++) {
    const sub = resultWords.slice(start).join(' ');
    if (VEGAN_MAP.has(sub)) return VEGAN_MAP.get(sub);
  }

  return result;
}

// ─── Extract RECIPES from index.html ────────────────────────────────────────

function extractRecipes(html) {
  // The RECIPES array is on a line starting with "const RECIPES = ["
  const marker = 'const RECIPES = [';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error('Could not find RECIPES array in index.html');

  // Find the matching closing bracket. The array is all on one (very long) line
  // terminated by "];\n" (or similar).
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let arrStart = start + marker.length - 1; // position of '['
  let i = arrStart;

  for (; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
    if (ch === '[') depth++;
    if (ch === ']') { depth--; if (depth === 0) break; }
  }

  const arrayStr = html.substring(arrStart, i + 1);

  // The array uses unquoted keys (id:, title:, …). Convert to valid JSON by
  // quoting bare keys.  Pattern: word-char key followed by colon, not inside a string.
  // Easiest approach: use a Function constructor (we trust the source).
  const recipes = new Function('return ' + arrayStr)();
  return recipes;
}

// ─── Fetch JSON-LD from a URL ───────────────────────────────────────────────

async function fetchJsonLdIngredients(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let res;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });
    } catch (fetchErr) {
      const code = fetchErr?.cause?.code || fetchErr?.code || '';
      throw new Error(`Network error${code ? ' (' + code + ')' : ''}: ${fetchErr.message}`);
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const body = await res.text();

    // Find all <script type="application/ld+json"> blocks
    const ldBlocks = [];
    const regex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(body)) !== null) {
      try {
        ldBlocks.push(JSON.parse(match[1]));
      } catch {
        // malformed JSON-LD, skip
      }
    }

    // Search for a Recipe schema in the LD blocks (may be nested in @graph)
    for (const block of ldBlocks) {
      const recipe = findRecipeInLd(block);
      if (recipe && recipe.recipeIngredient) {
        return recipe.recipeIngredient;
      }
    }

    throw new Error('No JSON-LD Recipe with recipeIngredient found');
  } finally {
    clearTimeout(timer);
  }
}

function findRecipeInLd(obj) {
  if (!obj) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findRecipeInLd(item);
      if (r) return r;
    }
    return null;
  }
  if (typeof obj === 'object') {
    const type = obj['@type'];
    if (
      type === 'Recipe' ||
      (Array.isArray(type) && type.includes('Recipe'))
    ) {
      return obj;
    }
    if (obj['@graph']) return findRecipeInLd(obj['@graph']);
  }
  return null;
}

// ─── Deduplicate & sort ingredient list ─────────────────────────────────────

function dedup(arr) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    if (!item) continue;
    const key = item.toLowerCase().trim();
    if (key.length < 2) continue;       // skip single-char junk
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out.sort();
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(70));
  console.log('  HARVEST Ingredient Updater');
  console.log('  Reading index.html and processing first 20 recipes...');
  console.log('='.repeat(70));
  console.log();

  const html = fs.readFileSync(INDEX_PATH, 'utf-8');
  const allRecipes = extractRecipes(html);
  console.log(`Total recipes found: ${allRecipes.length}`);
  console.log(`Processing recipes ${RECIPE_OFFSET + 1} to ${Math.min(RECIPE_OFFSET + RECIPE_LIMIT, allRecipes.length)}...\n`);

  const subset = allRecipes.slice(RECIPE_OFFSET, RECIPE_OFFSET + RECIPE_LIMIT);
  const results = [];

  for (let idx = 0; idx < subset.length; idx++) {
    const recipe = subset[idx];
    const num = idx + 1;
    console.log(`[${num}/${RECIPE_LIMIT}] ${recipe.title}`);
    console.log(`  URL: ${recipe.url}`);

    let rawIngredients;
    try {
      rawIngredients = await fetchJsonLdIngredients(recipe.url);
    } catch (err) {
      console.log(`  SKIPPED: ${err.message}\n`);
      results.push({ recipe, skipped: true, reason: err.message });
      continue;
    }

    // Normalize fetched ingredients (normalizeIngredient returns arrays now)
    const normalized = dedup(
      rawIngredients.flatMap(normalizeIngredient)
    );

    // Safety guard: never replace existing ingredients with an empty list
    if (normalized.length === 0 && recipe.ing.length > 0) {
      console.log(`  SKIPPED: Normalization produced 0 ingredients (recipe has ${recipe.ing.length})\n`);
      results.push({ recipe, skipped: true, reason: 'Normalization produced empty result' });
      continue;
    }

    // Current ingredients (already somewhat normalized in the data)
    const current = dedup(recipe.ing);

    // Compute diff
    const currentSet = new Set(current);
    const newSet = new Set(normalized);

    const added = normalized.filter(i => !currentSet.has(i));
    const removed = current.filter(i => !newSet.has(i));

    console.log(`  Current count: ${current.length}`);
    console.log(`  New count:     ${normalized.length}`);
    if (added.length) {
      console.log(`  + Added (${added.length}):   ${added.join(', ')}`);
    }
    if (removed.length) {
      console.log(`  - Removed (${removed.length}): ${removed.join(', ')}`);
    }
    if (!added.length && !removed.length) {
      console.log('  (no changes)');
    }
    console.log();

    results.push({
      recipe,
      skipped: false,
      rawIngredients,
      normalized,
      current,
      added,
      removed,
    });
  }

  // ─── Summary ────────────────────────────────────────────────────────────

  console.log('='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));

  const processed = results.filter(r => !r.skipped);
  const skipped = results.filter(r => r.skipped);
  const changed = processed.filter(r => r.added.length || r.removed.length);

  console.log(`  Processed:  ${processed.length}`);
  console.log(`  Skipped:    ${skipped.length}`);
  console.log(`  Changed:    ${changed.length}`);
  console.log(`  Unchanged:  ${processed.length - changed.length}`);
  console.log();

  if (skipped.length) {
    console.log('  Skipped recipes:');
    for (const r of skipped) {
      console.log(`    - ${r.recipe.title}: ${r.reason}`);
    }
    console.log();
  }

  if (changed.length) {
    console.log('  Recipes with changes:');
    for (const r of changed) {
      console.log(`    ${r.recipe.title}  (+${r.added.length} / -${r.removed.length})`);
    }
    console.log();
  }

  // ─── Apply changes if --apply flag is set ──────────────────────────────
  const applyMode = process.argv.includes('--apply');

  if (!applyMode) {
    console.log('  DRY RUN — no changes written.');
    console.log('  Review the output above, then run with --apply to write changes.');
    return;
  }

  if (changed.length === 0) {
    console.log('  No changes to apply.');
    return;
  }

  console.log('  APPLYING CHANGES to index.html...');

  let updatedHtml = html;
  let appliedCount = 0;

  for (const r of changed) {
    const recipe = r.recipe;
    const newIng = r.normalized;

    // Build the new ing array string
    const newIngStr = 'ing:[' + newIng.map(i => JSON.stringify(i)).join(',') + ']';

    // Find this recipe in the HTML by its unique id + title combo
    // Pattern: {id:<id>,title:"<title>", ... ing:[...]}
    // We need to find the specific ing:[...] for this recipe
    const titleEscaped = recipe.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const recipePattern = new RegExp(
      `(\\{[^}]*?id:\\s*${recipe.id}\\s*,\\s*title:\\s*"${titleEscaped}"[^}]*?)ing:\\s*\\[[^\\]]*\\]`,
    );

    const match = updatedHtml.match(recipePattern);
    if (match) {
      updatedHtml = updatedHtml.replace(recipePattern, `$1${newIngStr}`);
      appliedCount++;
      console.log(`    Updated: ${recipe.title} (${newIng.length} ingredients)`);
    } else {
      console.log(`    WARN: Could not find recipe "${recipe.title}" (id:${recipe.id}) in HTML`);
    }
  }

  if (appliedCount > 0) {
    // Backup first
    const backupPath = INDEX_PATH + '.backup-' + Date.now();
    fs.writeFileSync(backupPath, html);
    console.log(`\n  Backup saved: ${backupPath}`);

    fs.writeFileSync(INDEX_PATH, updatedHtml);
    console.log(`  Updated ${appliedCount} recipe(s) in index.html.`);
  }
}

// ─── Self-test mode ─────────────────────────────────────────────────────────

function selfTest() {
  console.log('='.repeat(70));
  console.log('  SELF-TEST: Ingredient Normalizer');
  console.log('='.repeat(70));
  console.log();

  // Each test: [input, expected_array]
  // normalizeIngredient now returns an array
  const cases = [
    // ── Basic quantity + unit removal ──
    ['2 cups diced red cabbage', ['red cabbage']],
    ['1 tablespoon olive oil', ['olive oil']],
    ['3 cloves garlic, minced', ['garlic']],
    ['½ cup coconut milk', ['coconut milk']],
    ['¼ cup nutritional yeast', ['nutritional yeast']],
    ['1 lb cremini mushrooms, sliced', ['cremini mushrooms']],
    ['1 medium yellow onion, diced', ['onion']],

    // ── Parentheticals ──
    ['1 (15-ounce) can chickpeas, drained and rinsed', ['chickpeas']],
    ['2 cups chopped kale (about 1 bunch)', ['kale']],
    ['3 cups vegetable broth (low-sodium)', ['vegetable broth']],
    ['1 14-oz can full-fat coconut milk', ['coconut milk']],

    // ── Known ingredient map ──
    ['2 tablespoons tomato paste', ['tomato paste']],
    ['1 cup brown rice, cooked', ['brown rice']],
    ['1 tablespoon red wine vinegar', ['red wine vinegar']],
    ['3 tablespoons maple syrup', ['maple syrup']],
    ['1 block extra-firm tofu, pressed and cubed', ['extra-firm tofu']],
    ['2 tablespoons soy sauce', ['soy sauce']],
    ['1/4 teaspoon freshly cracked black pepper', ['black pepper']],
    ['1 teaspoon smoked paprika', ['smoked paprika']],
    ['1 teaspoon ground cumin', ['cumin']],
    ['1 teaspoon ground turmeric', ['turmeric']],
    ['1/2 teaspoon kosher salt', ['salt']],
    ['1 tablespoon extra virgin olive oil', ['olive oil']],
    ['1 can crushed tomatoes', ['crushed tomatoes']],
    ['1/4 teaspoon red pepper flakes', ['red pepper flakes']],
    ['1 tablespoon apple cider vinegar', ['apple cider vinegar']],
    ['1 cup vegetable stock', ['vegetable broth']],

    // ── "and" splitting ──
    ['Salt and pepper to taste', ['salt', 'black pepper']],
    ['salt and black pepper', ['salt', 'black pepper']],
    ['1 tablespoon chopped parsley and basil', ['parsley', 'basil']],

    // ── "or" alternatives — take first ──
    ['grapeseed oil or other high-heat oil', ['grapeseed oil']],
    ['spaghetti or linguine', ['spaghetti']],
    ['vegan butter or coconut oil', ['vegan butter']],

    // ── "juice of" patterns ──
    ['Juice of 1 lemon', ['lemon juice']],
    ['juice of 2 limes', ['lime juice']],

    // ── Commas with prep instructions ──
    ['garlic, minced', ['garlic']],
    ['onion, diced', ['onion']],
    ['fresh thyme leaves, chopped', ['thyme']],
    ['shallots, thinly sliced', ['shallots']],

    // ── Colons ──
    ['coconut milk: full-fat', ['coconut milk']],

    // ── Dashes ──
    ['tempeh - cubed', ['tempeh']],

    // ── Brand names ──
    ['Original Almond Breeze Almond Milk', ['almond milk']],

    // ── Preserve "vegan" ──
    ['vegan parmesan cheese, grated', ['vegan parmesan']],
    ['vegan butter', ['vegan butter']],
    ['vegan sour cream', ['vegan sour cream']],
    ['plant-based cream', ['vegan cream']],

    // ── Reject junk ──
    ['to taste', []],
    ['for garnish', []],
    ['', []],

    // ── Asterisks and footnotes ──
    ['sea salt*', ['salt']],
    ['black beans*)', ['black beans']],
    ['cornstarch*', ['cornstarch']],

    // ── Complex real-world examples ──
    ['1 15-ounce can black beans, drained and rinsed', ['black beans']],
    ['2 tablespoons finely chopped fresh parsley', ['parsley']],
    ['4-5 large cremini or button mushrooms, sliced', ['cremini']],
    ['1/2 cup raw cashews, soaked 4 hours', ['cashews']],
    ['1 batch green onion', ['green onion']],
    ['natural plant-based yogurt', ['vegan yogurt']],
    ['salted vegan butter', ['vegan butter']],
    ['Indian red chile powder', ['chili powder']],
    ['tin full-fat coconut milk', ['coconut milk']],

    // ── Stress tests from real recipe data ──
    ['2 (15-ounce) cans chickpeas, drained and rinsed', ['chickpeas']],
    ['1 cup uncooked quinoa, rinsed', ['quinoa']],
    ['2 tablespoons low-sodium tamari or soy sauce', ['tamari']],
    ['1½ cups old-fashioned rolled oats', ['rolled oats']],
    ['3 tablespoons unsweetened cocoa powder', ['cocoa powder']],
    ['1 ripe avocado, pitted and sliced', ['avocado']],
    ['2 cups packed fresh baby spinach', ['spinach']],
    ['1/3 cup raw walnuts, roughly chopped', ['walnuts']],
    ['One 14-ounce block extra-firm tofu, pressed', ['extra-firm tofu']],
    ['Freshly squeezed juice of 1 lemon', ['lemon juice']],
    ['1 (13.5 oz) can full-fat coconut milk, refrigerated overnight', ['coconut milk']],
    ['1 tablespoon Dijon mustard', ['dijon mustard']],
    ['3 green onions, thinly sliced', ['green onion']],
    ['2 large sweet potatoes, peeled and cubed', ['sweet potatoes']],
    ['1 bunch fresh cilantro, stems removed', ['cilantro']],
    ['1 teaspoon vanilla extract', ['vanilla extract']],
    ['2 tablespoons white miso paste', ['miso paste']],
    ['1/2 cup tahini', ['tahini']],
    ['Kosher salt and freshly ground black pepper, to taste', ['salt', 'black pepper']],
    ['1/2 cup canned coconut cream', ['coconut cream']],
    ['For serving: rice, naan, or roti', ['rice']],
    ['1 tablespoon + 1 teaspoon sriracha', ['sriracha']],
    ['3/4 cup dried red lentils, rinsed', ['red lentils']],
    ['1-2 tablespoons chili garlic sauce (sambal oelek)', ['chili garlic sauce']],
    ['½ teaspoon ground cinnamon', ['cinnamon']],
    ['2 cloves garlic, pressed or grated', ['garlic']],
    ['2 cups low-sodium vegetable broth', ['vegetable broth']],

    // ── Vegan auto-mapping (non-vegan source terms) ──
    ['1 cup heavy cream', ['vegan cream']],
    ['2 tablespoons butter', ['vegan butter']],
    ['1/4 cup grated parmesan cheese', ['vegan parmesan']],
    ['1/2 cup crumbled feta cheese', ['vegan feta']],
    ['2 eggs', ['flax egg']],
    ['1 tablespoon honey', ['maple syrup']],
    ['1 cup chicken broth', ['vegetable broth']],
    ['1/4 cup mayo', ['vegan mayo']],

    // ── Trailing phrase removal ──
    ['1 can jackfruit in water', ['jackfruit']],
    ['1 cup sun-dried tomatoes in oil', ['sun-dried tomatoes']],
    ['2 cups mixed vegetables of choice', ['mixed vegetables']],
    ['neutral oil for frying', ['oil']],

    // ── Other edge cases from live run ──
    ['maple sugar', ['maple sugar']],
    ['vegan yogurt dollop on top', ['vegan yogurt']],
  ];

  let pass = 0;
  let fail = 0;

  for (const [input, expected] of cases) {
    const result = normalizeIngredient(input);
    const ok = JSON.stringify(result) === JSON.stringify(expected);
    if (ok) {
      pass++;
      console.log(`  PASS: "${input}" -> ${JSON.stringify(result)}`);
    } else {
      fail++;
      console.log(`  FAIL: "${input}"`);
      console.log(`    Expected: ${JSON.stringify(expected)}`);
      console.log(`    Got:      ${JSON.stringify(result)}`);
    }
  }

  console.log();
  console.log(`  Results: ${pass} passed, ${fail} failed out of ${cases.length}`);
  console.log();

  // Also verify recipe extraction
  console.log('  Testing recipe extraction from index.html...');
  try {
    const html = fs.readFileSync(INDEX_PATH, 'utf-8');
    const recipes = extractRecipes(html);
    console.log(`  Found ${recipes.length} recipes.`);
    console.log(`  First recipe: "${recipes[0].title}" (${recipes[0].ing.length} ingredients)`);
    console.log(`  Recipe #20: "${recipes[19].title}" (${recipes[19].ing.length} ingredients)`);
    console.log();
    console.log('  First 20 recipe URLs:');
    for (let i = 0; i < 20 && i < recipes.length; i++) {
      console.log(`    ${i + 1}. ${recipes[i].title}`);
      console.log(`       ${recipes[i].url}`);
      console.log(`       Current ingredients: ${recipes[i].ing.join(', ')}`);
    }
  } catch (err) {
    console.log(`  ERROR extracting recipes: ${err.message}`);
  }

  console.log();
  return fail === 0;
}

// ─── Demo mode — simulate processing with sample JSON-LD data ───────────────

function demo() {
  console.log('='.repeat(70));
  console.log('  DEMO: Simulated processing with sample JSON-LD data');
  console.log('='.repeat(70));
  console.log();

  // Sample JSON-LD recipeIngredient arrays from common vegan recipe sites
  const samples = [
    {
      title: 'Sweet Potato Black Bean Enchiladas',
      currentIng: ['yellow','white corn tortillas*','cubed sweet potatoes)','coconut','avocado oil)','ground cumin','smoked paprika','sea salt','chopped kale)','water','black beans*)','red enchilada sauce)','cilantro','guacamole, avocado','avocado crema'],
      jsonLd: [
        '8 yellow or white corn tortillas (see notes for homemade)',
        '1 ½ cups cubed sweet potatoes (about 1 medium sweet potato // 1/2-inch cubes)',
        '1 Tbsp coconut or avocado oil (if avoiding oil, sub water)',
        '1/2 tsp ground cumin',
        '1/2 tsp smoked paprika',
        '1/4 tsp sea salt',
        '3 cups chopped kale (loosely packed)',
        '2 Tbsp water',
        '1 15-ounce can black beans (drained // rinsed well)',
        '1 ½ cups red enchilada sauce (divided // I use my easy recipe)',
        'Fresh cilantro',
        'Guacamole or avocado',
        'Avocado crema',
      ]
    },
    {
      title: 'Vegan Mushroom Risotto',
      currentIng: ['vegan butter','mixed mushrooms, )','extra virgin olive oil','roughly chopped fresh thyme leaves','garlic cloves','leeks, )','kosher salt','freshly cracked black pepper','carnaroli rice','arborio rice','dry white wine )','vegan parmesan cheese','italian flat-leaf parsley,)'],
      jsonLd: [
        '3 tablespoons vegan butter, divided',
        '1 pound mixed mushrooms (such as cremini, shiitake, oyster), sliced or torn',
        '2 tablespoons extra virgin olive oil',
        '1 tablespoon roughly chopped fresh thyme leaves',
        '4 cloves garlic, minced',
        '2 medium leeks (white and light green parts only), halved and thinly sliced',
        '1 teaspoon kosher salt, plus more to taste',
        '1/2 teaspoon freshly cracked black pepper',
        '1 1/2 cups carnaroli rice or arborio rice',
        '1/2 cup dry white wine (or sub veggie broth)',
        '5 cups warm vegetable broth',
        '1/3 cup vegan parmesan cheese',
        '3 tablespoons chopped Italian flat-leaf parsley',
        '2 tablespoons white miso paste',
      ]
    },
    {
      title: 'Thai Green Curry with Tofu',
      currentIng: ['oil)','garlic','ginger','salt','green curry paste','coconut milk)','vegetable broth)','brown sugar','vegetables of choice','tofu)','basil leaves','rice)'],
      jsonLd: [
        '1 tablespoon coconut oil or avocado oil',
        '4 cloves garlic, minced',
        '1 tablespoon freshly grated ginger',
        '1/2 teaspoon salt',
        '3 tablespoons green curry paste',
        '1 (13.5 oz) can full-fat coconut milk',
        '1 cup vegetable broth',
        '1 tablespoon brown sugar or coconut sugar',
        '2 cups mixed vegetables (bell peppers, snap peas, broccoli, carrots)',
        '14 oz extra-firm tofu, pressed and cubed',
        '1/4 cup fresh Thai basil leaves',
        'Cooked jasmine rice, for serving',
        '1 tablespoon soy sauce',
        'Juice of 1 lime',
      ]
    },
    {
      title: 'Cauliflower Tikka Masala',
      currentIng: ['cauliflower','olive oil','onion','garlic','ginger','tomato paste','crushed tomatoes','coconut milk','garam masala','ground cumin','ground coriander','turmeric','paprika','cayenne pepper','salt','to taste','lemon juice','cilantro'],
      jsonLd: [
        '1 large head cauliflower, cut into florets',
        '2 tablespoons olive oil',
        '1 large onion, diced',
        '4 cloves garlic, minced',
        '1 tablespoon freshly grated ginger',
        '2 tablespoons tomato paste',
        '1 (28-ounce) can crushed tomatoes',
        '1 (13.5-ounce) can full-fat coconut milk',
        '2 teaspoons garam masala',
        '1 teaspoon ground cumin',
        '1 teaspoon ground coriander',
        '1/2 teaspoon ground turmeric',
        '1/2 teaspoon paprika',
        '1/4 teaspoon cayenne pepper',
        'Salt to taste',
        '1 tablespoon lemon juice',
        '1/4 cup chopped fresh cilantro',
        '1 teaspoon sugar',
      ]
    },
    {
      title: 'Crispy Tofu Sandwich',
      currentIng: ['extra-firm tofu','cornstarch','onion powder','garlic powder','salt','pepper','oil','red cabbage','carrot','jalapeño','lemon juice','red wine vinegar','dijon mustard','maple syrup','olive oil','pistachios','basil','lemon zest','nutritional yeast','bread','lettuce','tomatoes','avocado','vegan butter'],
      jsonLd: [
        '1 block extra-firm tofu, pressed and sliced into 4 planks',
        '3 tablespoons cornstarch',
        '1 teaspoon onion powder',
        '1 teaspoon garlic powder',
        '1/2 teaspoon salt',
        '1/4 teaspoon black pepper',
        '2 tablespoons neutral oil for frying',
        '2 cups shredded red cabbage',
        '1 large carrot, julienned',
        '1 jalapeño, thinly sliced',
        '2 tablespoons lemon juice',
        '1 tablespoon red wine vinegar',
        '1 tablespoon Dijon mustard',
        '1 tablespoon maple syrup',
        '3 tablespoons olive oil',
        '1/3 cup pistachios, toasted and roughly chopped',
        '1 cup fresh basil leaves, packed',
        '1 teaspoon lemon zest',
        '2 tablespoons nutritional yeast',
        '4 slices sourdough bread or ciabatta rolls',
        'Butter lettuce leaves',
        '1 ripe tomato, sliced',
        '1 ripe avocado, sliced',
        '2 tablespoons vegan butter, softened',
      ]
    },
  ];

  for (const sample of samples) {
    console.log(`─── ${sample.title} ───`);
    console.log(`  Current (${sample.currentIng.length}): ${sample.currentIng.join(', ')}`);

    const normalized = dedup(sample.jsonLd.flatMap(normalizeIngredient));
    console.log(`  New (${normalized.length}):     ${normalized.join(', ')}`);

    const currentSet = new Set(sample.currentIng.map(i => i.toLowerCase().trim()));
    const newSet = new Set(normalized);
    const added = normalized.filter(i => !currentSet.has(i));
    const removed = sample.currentIng.filter(i => !newSet.has(i.toLowerCase().trim()));

    if (added.length) console.log(`  + Added: ${added.join(', ')}`);
    if (removed.length) console.log(`  - Removed: ${removed.join(', ')}`);
    console.log();
  }
}

// ─── Entry point ────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  const ok = selfTest();
  process.exit(ok ? 0 : 1);
} else if (process.argv.includes('--demo')) {
  demo();
} else {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
