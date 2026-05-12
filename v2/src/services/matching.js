/**
 * Recipe matching engine.
 *
 * Pure functions that take data in and return results out.
 * No DOM access, no global state, no side effects.
 * Includes memoization for expensive alias expansion.
 */

import { norm, stem, stripMeasure } from '../utils/text.js';
import { INGREDIENT_ALIASES, INGREDIENT_SUBS, ALLERGY_KEYWORDS, PERISHABLES, GF_SWAPS, HARD_GLUTEN_REGEX } from '../data/aliases.js';

/**
 * Returns true if a recipe contains a structural gluten ingredient with no
 * viable GF substitute (farro, couscous, barley, seitan, beer, etc.).
 * HARVEST is gluten-free by default — these recipes are excluded from
 * results so users never see something they can't make.
 *
 * Wheat-based ingredients with GF alternatives (pasta, bread, flour,
 * tortillas) are NOT filtered — those count as matches when the user has
 * the GF version, via _GF_MATCH_SWAPS below.
 */
export function isGlutenRecipe(recipe) {
  if (!recipe || !recipe.ing) return false;
  for (const ing of recipe.ing) {
    if (HARD_GLUTEN_REGEX.test(ing)) return true;
  }
  return false;
}

/**
 * GF substitution map for MATCHING (not display).
 * If recipe needs the LEFT (gluten-containing) ingredient and user has any of
 * the RIGHT (GF alternatives), count as MATCH. The display chip already shows
 * the swap suggestion; this just makes the match accurate so users with GF
 * pantries can see they CAN make wheat-based recipes via substitution.
 */
const _GF_MATCH_SWAPS = {
  // Pasta family
  'pasta': ['gf pasta','gluten-free pasta','red lentil pasta','red lentil penne','chickpea pasta','brown rice pasta','quinoa pasta','rice noodles'],
  'whole wheat pasta': ['gf pasta','gluten-free pasta','red lentil pasta','chickpea pasta','brown rice pasta','rice noodles'],
  'whole wheat short pasta': ['gf pasta','gluten-free pasta'],
  'wheat pasta': ['gf pasta','gluten-free pasta'],
  'spaghetti': ['gf spaghetti','gluten-free spaghetti','rice noodles'],
  'penne pasta': ['gf penne','gluten-free penne','red lentil penne','chickpea penne'],
  'penne': ['gf penne','gluten-free penne','red lentil penne','chickpea penne'],
  'linguine': ['gf linguine','rice noodles'],
  'fettuccine': ['gf fettuccine','rice noodles'],
  'macaroni': ['gf macaroni','gf elbow pasta'],
  'elbow macaroni': ['gf macaroni','gf elbow pasta'],
  'tagliatelle': ['gf tagliatelle','gluten-free tagliatelle','gf pasta','rice noodles'],
  'pappardelle': ['gf pappardelle','gluten-free pappardelle','gf pasta'],
  'orzo': ['gf orzo','gluten-free orzo','gf pasta'],
  'orecchiette': ['gf orecchiette','gf pasta'],
  'ditalini': ['gf ditalini','gf pasta'],
  'rotini': ['gf rotini','gf pasta'],
  'fusilli': ['gf fusilli','gf pasta'],
  'rigatoni': ['gf rigatoni','gf pasta'],
  'farfalle': ['gf farfalle','gf pasta'],
  'angel hair': ['gf angel hair','gf pasta'],
  'lasagna': ['gf lasagna','gf lasagna sheets','gf lasagna noodles'],
  'lasagne': ['gf lasagna','gf lasagne','gf lasagna sheets','gf lasagne sheets'],
  'lasagne sheets': ['gf lasagna sheets','gf lasagne sheets'],
  'lasagna noodles': ['gf lasagna noodles','gf lasagna sheets','gf lasagna'],
  'lasagna sheets': ['gf lasagna sheets','gf lasagna'],
  'gnocchi': ['gf gnocchi','gluten-free gnocchi','potato gnocchi','cauliflower gnocchi'],
  'noodles': ['rice noodles','gf noodles','glass noodles'],
  'egg noodles': ['rice noodles','gf noodles'],
  'ramen noodles': ['rice noodles','gf ramen','rice ramen'],
  'udon noodles': ['rice noodles'],
  // Bread family
  'bread': ['gf bread','gluten-free bread'],
  'whole wheat bread': ['gf bread','gluten-free bread'],
  'sandwich bread': ['gf bread'],
  'sourdough bread': ['gf bread'],
  'breadcrumbs': ['gf breadcrumbs','gluten-free breadcrumbs','gf panko'],
  'bread crumbs': ['gf breadcrumbs','gluten-free breadcrumbs','gf panko'],
  'panko': ['gf panko','gf breadcrumbs'],
  'panko breadcrumbs': ['gf panko','gf breadcrumbs'],
  'hamburger buns': ['gf buns','gf hamburger buns','gf bread'],
  'whole wheat hamburger buns': ['gf buns','gf hamburger buns','gf bread'],
  'burger buns': ['gf buns','gf hamburger buns','gf bread'],
  'tortillas': ['gf tortillas','corn tortillas'],
  'flour tortillas': ['gf tortillas','corn tortillas'],
  'wraps': ['gf tortillas','gf wraps'],
  'pita bread': ['gf pita','gf bread'],
  'naan': ['gf naan','gf bread'],
  // Flour family — wheat-based recipes match if user has GF flour
  'flour': ['gluten-free flour','gf flour','almond flour','oat flour','rice flour','coconut flour','cassava flour','chickpea flour','tapioca flour'],
  'all-purpose flour': ['gluten-free flour','gf flour','1:1 gf flour','1:1 gluten-free flour'],
  'plain flour': ['gluten-free flour','gf flour'],
  'whole wheat flour': ['gluten-free flour','gf flour'],
  'whole wheat pastry flour': ['gluten-free flour','gf flour'],
  'white whole wheat flour': ['gluten-free flour','gf flour'],
  'bread flour': ['gluten-free flour','gf flour'],
  'spelt flour': ['gluten-free flour','gf flour'],
  'cake flour': ['gluten-free flour','gf flour'],
  'pastry flour': ['gluten-free flour','gf flour'],
  'self-rising flour': ['gluten-free flour','gf flour'],
  // Soy sauce → tamari (already handled in tamari alias above)
  'soy sauce': ['tamari','coconut aminos','liquid aminos','gluten-free soy sauce','gf soy sauce'],
};

/**
 * Allergen-conditional substitution map. Only fires when the corresponding
 * allergy is ACTIVE in the user's settings — these are NOT universal aliases.
 *
 * Why allergen-conditional: most cooks who don't have an allergy wouldn't
 * naturally substitute sunflower butter for almond butter (the flavors differ).
 * But a tree-nut-allergic user DEFINITELY has the seed-butter/seed-milk
 * substitutes already in their kitchen — they live with the substitution
 * every day. So when the allergy is active, the matcher should treat their
 * substitutes as covering the original.
 *
 * Same pattern as _GF_MATCH_SWAPS above (HARVEST is GF by default → wheat
 * recipes match if user has GF version), but gated on allergy state instead
 * of always-on.
 *
 * Only ingredients with TRUE substitutes are listed. Nut flours (almond,
 * coconut), tofu, mushrooms, tomatoes — these are structural to their
 * recipes and a substitution would produce a failed dish, so we don't
 * pretend otherwise. Recipe stays filtered.
 */
const _ALLERGEN_SWAPS = {
  'tree nut': {
    // Plant milks: rice/oat/soy/hemp work cleanly in any recipe calling
    // for almond/cashew/macadamia/pistachio/hazelnut milk.
    'almond milk':      ['oat milk','soy milk','rice milk','hemp milk'],
    'cashew milk':      ['oat milk','soy milk','rice milk','hemp milk'],
    'macadamia milk':   ['oat milk','soy milk','rice milk','hemp milk'],
    'pistachio milk':   ['oat milk','soy milk','rice milk','hemp milk'],
    'hazelnut milk':    ['oat milk','soy milk','rice milk','hemp milk'],
    // Nut butters → seed butters / tahini. Same fat/binding role.
    'almond butter':    ['sunflower butter','sunflower seed butter','tahini','pumpkin seed butter'],
    'cashew butter':    ['sunflower butter','sunflower seed butter','tahini','pumpkin seed butter'],
    'macadamia butter': ['sunflower butter','sunflower seed butter','tahini','pumpkin seed butter'],
    'hazelnut butter':  ['sunflower butter','sunflower seed butter','tahini','pumpkin seed butter'],
    'pecan butter':     ['sunflower butter','sunflower seed butter','tahini','pumpkin seed butter'],
    'walnut butter':    ['sunflower butter','sunflower seed butter','tahini','pumpkin seed butter'],
  },
  'peanut': {
    // Peanut butter → tree-nut butters or seed butters. Pantry check
    // naturally excludes nut butters for users who ALSO have tree-nut
    // allergy (they wouldn't have those in their pantry).
    'peanut butter':    ['sunflower butter','sunflower seed butter','tahini','pumpkin seed butter','almond butter','cashew butter'],
    'peanut oil':       ['olive oil','avocado oil','sesame oil','vegetable oil','sunflower oil','grapeseed oil'],
  },
  'soy': {
    // Soy milk → other plant milks. NOT tofu/tempeh/edamame which are
    // structural ingredients with no clean swap.
    'soy milk':         ['oat milk','almond milk','rice milk','hemp milk','cashew milk','macadamia milk','pistachio milk'],
  },
};

/**
 * Check whether a recipe with a given allergen is "satisfiable" — i.e.,
 * every allergen-containing ingredient has at least one substitute the
 * user has available in their pantry.
 *
 * Returns true → recipe should be allowed through the allergy filter.
 * Returns false → at least one allergen ingredient has no available
 * substitute, so the recipe stays excluded (the user genuinely can't
 * make it safely).
 *
 * @param {{ ing: string[] }} recipe
 * @param {string} allergenKey - e.g. 'tree nut', 'peanut', 'soy'
 * @param {Set<string>} userIngSet - Pre-built Set of normed user ingredients
 * @param {string[]} userIngs - Expanded normed user ingredients (for substring fallback)
 * @returns {boolean}
 */
function _isAllergyRecipeSatisfiable(recipe, allergenKey, userIngSet, userIngs) {
  const swaps = _ALLERGEN_SWAPS[allergenKey];
  if (!swaps) return false; // No swap rules → no substitution possible → keep filtered

  const keywords = ALLERGY_KEYWORDS[allergenKey] || [allergenKey];

  for (const ing of recipe.ing) {
    if (!ing) continue;
    const ingLow = ing.toLowerCase();

    // Skip ingredients that don't contain the allergen at all
    if (!keywords.some(kw => ingLow.includes(kw))) continue;

    // This ingredient contains the allergen — does any swap rule cover it
    // AND does the user have one of the substitutes?
    let satisfied = false;
    for (const [allergenItem, alts] of Object.entries(swaps)) {
      if (ingLow.includes(allergenItem)) {
        if (alts.some(alt => userIngSet.has(alt) || userIngs.some(ui => ui.includes(alt)))) {
          satisfied = true;
          break;
        }
      }
    }

    if (!satisfied) return false;
  }
  return true;
}

/** Flat set of all perishable ingredient names (normed) for fast lookup */
const _perishableSet = new Set();
PERISHABLES.forEach(cat => cat.items.forEach(item => _perishableSet.add(norm(item))));

/** Pre-compiled word-boundary regexes for perishable matching */
const _perishableRegexes = [..._perishableSet].map(p => ({
  name: p,
  re: new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
}));

/**
 * Check if an ingredient name matches a perishable.
 * @param {string} normedIng - Already norm()'d ingredient name
 * @returns {boolean}
 */
export function isPerishableIng(normedIng) {
  if (_perishableSet.has(normedIng)) return true;

  // Non-perishable shelf-stable forms — never highlight these
  const shelfStable = [
    'oil','vinegar','extract','powder','dried','sauce','paste',
    'starch','syrup','butter','cream','milk','flour','juice',
    'jam','jelly','preserve','canned','frozen','pickled','chips',
    'flakes','seasoning','spice','sugar','diced','crushed',
    'puree','concentrate','ground','roasted','toasted',
    'herb','cilantro','parsley','basil','mint','dill',
    'rosemary','thyme','chives','oregano','cumin',
  ];
  const low = normedIng.toLowerCase();
  if (shelfStable.some(s => low.includes(s))) return false;

  // Word-boundary match: "corn" matches "fresh corn" but not "cornstarch"
  for (const { re } of _perishableRegexes) {
    if (re.test(normedIng)) return true;
  }
  return false;
}

/**
 * Convenience catch-all alias keys. Variants under these are NOT equivalents
 * — the user explicitly opts into broad coverage by selecting the catch-all.
 * The matcher only does parent → variants for these (not variant → parent).
 *
 * Example: "any cooking oil" → olive, coconut, avocado, etc. The user picks
 * "any cooking oil" to mean "I have several cooking oils, any will do."
 * But having JUST olive oil does NOT mean the user has "any cooking oil"
 * — coconut oil's solidify-at-room-temp property isn't satisfied by olive.
 */
// Listed in NORMALIZED form. norm() lowercases, STRIPS punctuation
// (including dashes — "plant-based" becomes "plantbased" with no space),
// and collapses whitespace. Test entries against norm() output, not raw.
//
// Plant-based milks DELIBERATELY EXCLUDED from one-way: almond, soy, oat,
// cashew, rice, hemp, macadamia, pistachio milks are widely interchangeable
// for the vast majority of uses (smoothies, baking, sauces, savory cooking).
// User with any one milk should match recipes calling for any other.
// (Coconut milk is correctly excluded from the "plant-based milk (any)"
// alias group because canned coconut milk is genuinely different.)
const ONE_WAY_CATCHALLS = new Set([
  'any cooking oil',
  'nut butter any',
  'pasta any',
  'sweetener any',
  'natural sweetener any',
  'leafy greens any',
  'lettuce any',
  'vinegar any',
  'flour any',
  'fresh herbs any',
  'soy sauce tamari coconut aminos',
  // Lentils: types behave very differently (red dissolve, green hold shape).
  // User picking generic "lentils" wants flexibility, but having red lentils
  // shouldn't claim green lentils coverage.
  'lentils',
  // Generic "flour" same logic — different flours bake differently.
  'flour',
]);

/** Memoization cache for expandWithAliases */
const _aliasCache = new Map();
const ALIAS_CACHE_MAX = 64;

/**
 * Expand a user's ingredient list with all aliases and substitutions.
 * e.g., ["olive oil"] → ["olive oil", "coconut oil", "avocado oil", ...]
 * Results are memoized by sorted input key.
 *
 * @param {string[]} ings - Raw ingredient names from user
 * @returns {string[]} Expanded list of normalized ingredient names
 */
export function expandWithAliases(ings) {
  // Build cache key from sorted normalized ingredients
  const cacheKey = ings.map(norm).sort().join('\0');
  if (_aliasCache.has(cacheKey)) return _aliasCache.get(cacheKey);

  const result = new Set(ings.map(norm));

  ings.forEach(ing => {
    const key = norm(ing);

    // Expand generic aliases.
    //
    // Some alias keys are TRUE CATEGORIES (members are equivalents):
    //   "white beans" ↔ cannellini, navy, great northern
    //   "vegetable broth" ↔ vegetable stock
    //   "bell peppers (any)" ↔ red/green/yellow bell peppers
    //   These are bidirectional — having any member counts as having the
    //   category, AND having the category counts as having any member.
    //
    // Other alias keys are CONVENIENCE CATCH-ALLS (user explicitly opting
    // into broad coverage — "I'm flexible about leafy greens"). Variants
    // are NOT equivalents:
    //   "leafy greens (any)" → spinach, kale, etc. (kale ≠ spinach)
    //   "any cooking oil"     → olive, coconut, etc. (olive ≠ coconut)
    //   These are ONE-WAY — only parent → variants. Variant does not
    //   imply parent.
    Object.entries(INGREDIENT_ALIASES).forEach(([alias, variants]) => {
      const aliasKey = norm(alias);
      if (aliasKey === key) {
        // Parent → variants (always works for both kinds)
        variants.forEach(v => result.add(norm(v)));
      } else if (!ONE_WAY_CATCHALLS.has(aliasKey) && variants.some(v => norm(v) === key)) {
        // Variant → parent (only for true categories, NOT catch-alls)
        result.add(aliasKey);
        variants.forEach(v => result.add(norm(v)));
      }
    });

    // Expand one-way substitutions (loose substitutes — only fire if user
    // has the LEFT side, never reverse)
    Object.entries(INGREDIENT_SUBS).forEach(([sub, covers]) => {
      if (norm(sub) === key) covers.forEach(v => result.add(norm(v)));
    });
  });

  const expanded = [...result];

  // Evict oldest entries if cache is full
  if (_aliasCache.size >= ALIAS_CACHE_MAX) _aliasCache.delete(_aliasCache.keys().next().value);
  _aliasCache.set(cacheKey, expanded);

  return expanded;
}

/**
 * Clear the alias expansion cache (useful for testing).
 */
export function clearAliasCache() {
  _aliasCache.clear();
}

/**
 * Check if a recipe ingredient matches any user ingredient.
 * Uses word-boundary matching to avoid false positives
 * (e.g. "rice" should not match "licorice").
 *
 * @param {string} recipeIng - Normalized recipe ingredient
 * @param {string[]} userIngs - Expanded normalized user ingredients
 * @param {Set<string>} [userIngSet] - Optional pre-built Set for O(1) exact lookup
 * @returns {boolean}
 */
/**
 * Stem each word in a multi-word ingredient. Handles plural/singular and
 * common verb forms so "onions" matches "onion", "tomatoes" matches "tomato",
 * "walnuts" matches "walnut", "seeds" matches "seed", etc.
 */
function _stemAll(ing) {
  return ing.split(/\s+/).map(stem).join(' ');
}

/**
 * Optionally pre-stem user ingredients ONCE per render. Pass the stems
 * array as the 4th arg to ingredientMatches to avoid re-stemming for every
 * recipe ingredient match. Big perf win on large pantries (the same user
 * pantry is used for all 4,500 recipes; without caching, _stemAll runs
 * ~9 million times per page render).
 */
export function precomputeUserStems(userIngs) {
  return userIngs.map(_stemAll);
}

export function ingredientMatches(recipeIng, userIngs, userIngSet, userIngStems) {
  // Fast path: exact match via Set (avoids all string ops for ~40% of cases)
  if (userIngSet && userIngSet.has(recipeIng)) return true;

  // Pre-compute stemmed recipe ingredient (one allocation per recipe ing)
  const recipeStem = _stemAll(recipeIng);

  // Two checks per user ingredient:
  //   1) Recipe-as-haystack: applies STRICT modifier guard. If the recipe is
  //      asking for "white chocolate chips" and user has plain "chocolate
  //      chips", the "white" prefix means recipe wants something specific
  //      the user doesn't have — REJECT.
  //   2) User-as-haystack: applies LOOSE modifier guard. If the user has
  //      "red onion" and recipe asks for "onion", the user has a specific
  //      instance of what the recipe wants — ACCEPT.
  // Each check is also tried against STEMMED forms so plural/singular
  // mismatches don't cause false negatives ("onions" matches "onion").
  for (let i = 0; i < userIngs.length; i++) {
    const ai = userIngs[i];
    if (_wordBoundaryMatch(recipeIng, ai, /* strictPrefix */ true)) return true;
    if (_wordBoundaryMatch(ai, recipeIng, /* strictPrefix */ false)) return true;

    // Stem-aware fallback. Use pre-stemmed array if provided (perf win)
    // otherwise compute on-demand.
    const aiStem = userIngStems ? userIngStems[i] : _stemAll(ai);
    if (aiStem !== ai || recipeStem !== recipeIng) {
      if (_wordBoundaryMatch(recipeStem, aiStem, /* strictPrefix */ true)) return true;
      if (_wordBoundaryMatch(aiStem, recipeStem, /* strictPrefix */ false)) return true;
    }
  }
  return false;
}

/**
 * Suffixes that change an ingredient's identity.
 * "avocado oil" is NOT a type of avocado, "coconut milk" is NOT coconut, etc.
 * When the longer string ends with one of these, don't match the shorter base word.
 *
 * Includes spice-mix terms because "pumpkin pie spice" and "pumpkin spice" are
 * blends of OTHER spices (cinnamon, nutmeg, ginger, clove) — they contain zero
 * pumpkin. Same for "apple pie spice", "chinese five spice", etc.
 */
// All entries listed in BOTH singular and plural to survive stemming
// (the matcher applies stem() to handle plural/singular variants).
const IDENTITY_SUFFIXES = new Set([
  // Liquid/oil/dairy forms — base ingredient ≠ derived liquid/fat
  'oil', 'oils', 'milk', 'milks', 'butter', 'butters',
  'cream', 'creams', 'water', 'waters', 'juice', 'juices', 'nectar',
  // Powdered/ground/processed forms — base ≠ processed form
  'flour', 'flours', 'powder', 'powders', 'paste', 'pastes',
  'starch', 'starches', 'extract', 'extracts',
  // Sweet/sour derivatives
  'sugar', 'sugars', 'syrup', 'syrups', 'vinegar', 'vinegars',
  // Seeds
  'seed', 'seeds',
  // Spice mixes — base ≠ blend
  'spice', 'spices', 'pie spice', 'spice blend', 'spice mix', 'seasoning', 'seasonings',
  // Sauces and condiments — base ≠ derived sauce
  'sauce', 'sauces', 'aminos', 'mayo', 'mayonnaise', 'mustard',
  // Wrappers/papers (rice paper, etc.) — base ≠ derived sheet
  'paper', 'papers', 'wrapper', 'wrappers',
  // Soup/broth derivatives — base ≠ liquid
  'broth', 'broths', 'stock', 'stocks', 'bouillon', 'bisque', 'consommé', 'consomme',
  // Preserves/spreads — base ≠ jam/jelly form
  'jam', 'jams', 'jelly', 'jellies', 'preserve', 'preserves',
  'marmalade', 'compote',
  // Dried/snack/baking-chip forms — base ≠ derived chip product.
  // Confection chips (peanut butter chips, butterscotch chips, caramel
  // chips) are NOT actual chips OF those ingredients — they're manufactured
  // baking products. Users who have "chocolate chips (any)" via the
  // staples picker get the chip alias automatically.
  'leather', 'jerky', 'crisp', 'crisps', 'chip', 'chips',
  // Sprouts — bean sprouts, alfalfa sprouts, broccoli sprouts are
  // distinct fresh produce items, NOT the same as dried beans or seeds
  // they grow from. User with "kidney beans" (which alias-expands to
  // include generic "beans") should NOT match recipes calling for
  // "bean sprouts". Same logic for alfalfa → alfalfa sprouts, etc.
  'sprout', 'sprouts',
  // Shoots — "bamboo shoots" is the edible young shoot, sold canned
  // or fresh, distinct from "bamboo" (which by itself isn't a kitchen
  // ingredient). Same pattern as sprouts.
  'shoot', 'shoots',
  // Pudding — "rice pudding" and "chia pudding" are distinct prepared
  // dishes, not the base ingredient. Recipe calling for "rice pudding"
  // or "chia pudding" needs the FINISHED product, not raw rice/chia.
  'pudding', 'puddings',
  // Alcohol and infusions
  'wine', 'wines', 'liqueur', 'liqueurs', 'beer', 'beers', 'tea', 'teas',
  // (Note: "pasta" and "noodles" deliberately EXCLUDED from this list.
  // They're collective nouns for a category, not identity-changing suffixes.
  // Penne IS pasta; rice noodles ARE noodles. User with "pasta" or "noodles"
  // should match recipes ending in "X pasta" or "X noodles".)
]);

/**
 * Color/type modifiers that change an ingredient's identity when they appear
 * before the matched word in the recipe ingredient. E.g., a recipe needing
 * "white chocolate chips" is NOT satisfied by user's plain "chocolate chips" —
 * the "white" is doing real work. Same for dark/milk chocolate, white/brown
 * rice, white/red wine vinegar, etc.
 */
const COLOR_TYPE_MODIFIERS = new Set([
  'white', 'dark', 'milk', 'black', 'brown', 'red', 'green', 'yellow',
]);

/**
 * Check if `needle` appears in `haystack` at a word boundary.
 * A boundary is the start/end of string, a space, or a hyphen.
 * Guards against false positives where a compound ingredient
 * (e.g. "avocado oil") matches a different ingredient ("avocado").
 * @param {string} haystack
 * @param {string} needle
 * @returns {boolean}
 */
function _wordBoundaryMatch(haystack, needle, strictPrefix = true) {
  if (haystack === needle) return true;
  const idx = haystack.indexOf(needle);
  if (idx === -1) return false;
  const before = idx === 0 || haystack[idx - 1] === ' ' || haystack[idx - 1] === '-';
  const after = idx + needle.length === haystack.length
    || haystack[idx + needle.length] === ' '
    || haystack[idx + needle.length] === '-';
  if (!before || !after) return false;

  // Guard: if needle is at the start and the remaining word(s) include any
  // identity-changing suffix, reject the match. Examples:
  //   "avocado oil"        → remainder "oil"          → reject ("avocado" ≠ oil)
  //   "rice wine vinegar"  → remainder "wine vinegar" → reject (wine OR vinegar identity-shifts rice)
  //   "rice paper wrappers"→ remainder "paper wrappers" → reject
  //   "pumpkin pie spice"  → remainder "pie spice"    → reject (spice = blend)
  // Checks both the full remainder string (catches multi-word suffixes like
  // "pie spice" if explicitly listed) AND each individual word (catches any
  // suffix anywhere in the remainder).
  if (haystack.length > needle.length) {
    let remainder = haystack.slice(idx + needle.length).trim().replace(/^-/, '').trim();

    // "AND X" requires BOTH components — single-component user pantry can't
    // satisfy "salt and pepper" via just having "salt". Reject the substring
    // match so the scoring loop's combined-ingredient logic kicks in to
    // verify user has all components. Same for "&" and "+".
    //
    // Check ANYWHERE in remainder (catches "X and Y" with needle at start)
    // AND in prefix (catches "X and Y" with needle at end). This handles
    // multi-item lists like "cumin, coriander, and turmeric" too (after
    // norm strips commas → "cumin coriander and turmeric").
    //
    // EXCEPTION: if the words around the connector are PREP STATES (drained,
    // rinsed, chopped, etc.) it's a prep description, not combined ingredients
    // ("black beans drained and rinsed" should match "black beans"). Skip the
    // combined guard for these.
    const PREP_WORD_RE = /^(?:drained|rinsed|chopped|diced|minced|sliced|crushed|grated|shredded|peeled|seeded|cooked|warmed|cooled|melted|softened|cubed|quartered|halved|divided|rolled|beaten|whipped|sifted|toasted|roasted|trimmed|stemmed|cleaned|squeezed|patted)$/i;
    const hasCombinedAndInRemainder = /^(?:and|&|\+)\s+/i.test(remainder) || /\s+(?:and|&|\+)\s+/i.test(remainder);
    if (hasCombinedAndInRemainder) {
      // Inspect the words around the connector — if they're all prep words,
      // it's prep noise like "drained and rinsed", not a combined ingredient.
      const remainderWords = remainder.split(/\s+/);
      const allPrep = remainderWords.every(w => PREP_WORD_RE.test(w) || /^(?:and|&|\+)$/i.test(w));
      if (!allPrep) return false;
      // else: fall through, treat as prep noise and continue with normal checks
    }
    const prefixForCombined = haystack.slice(0, idx).trim();
    if (/\s+(?:and|&|\+)$/i.test(prefixForCombined) || /^(?:and|&|\+)$/i.test(prefixForCombined)) return false;

    // Strip "or X" alternative qualifiers — recipes like "vegetable stock
    // or water" present an EITHER/OR choice; the "or water" doesn't change
    // the identity of "vegetable stock". Match both "...word or X" and
    // remainder starting with "or X" (after needle the rest is alternatives).
    // Also strip parenthetical notes like "(drained and rinsed)".
    remainder = remainder
      .replace(/^or\s+.*$/i, '')
      .replace(/\s+or\s+.*$/i, '')
      .replace(/\s*\(.*$/, '')
      .trim();
    if (IDENTITY_SUFFIXES.has(remainder)) return false;
    // Word-by-word check: any identity-changing suffix in the remainder
    // means the haystack is a derived form of something else.
    const remainderWords = remainder ? remainder.split(/\s+/) : [];
    if (remainderWords.some(w => IDENTITY_SUFFIXES.has(w))) return false;
    // Also check if needle is the suffix and the prefix changes identity.
    // ONLY apply in strict direction (recipe-as-haystack):
    //   STRICT: recipe needs "olive oil", user has "oil" → user's plain "oil"
    //   doesn't satisfy recipe's specific "olive oil". REJECT.
    //   LOOSE: user has "olive oil", recipe needs generic "oil" → user has
    //   a specific instance of what recipe wants. ACCEPT.
    const prefix = haystack.slice(0, idx).trim().replace(/-$/, '').trim();
    if (strictPrefix && prefix && IDENTITY_SUFFIXES.has(needle)) return false;

    // Color/type modifier guard: if the word immediately before `needle` in
    // the haystack is a color/type modifier ("white", "dark", "red", etc.),
    // the haystack is a specifically-modified version that isn't equivalent
    // to the unmodified base. Apply in BOTH directions:
    //
    //   STRICT (recipe-as-haystack): recipe needs "white chocolate chips",
    //   user has plain "chocolate chips" → user's plain doesn't satisfy
    //   recipe's specific. REJECT.
    //
    //   LOOSE (user-as-haystack): user has "red onion", recipe needs plain
    //   "onion" → red onion is sharp/sweet/raw-friendly and NOT the default
    //   cooking onion. Don't pretend it satisfies generic "onion". REJECT.
    //
    // Where colors ARE interchangeable (red bell pepper IS a bell pepper,
    // jasmine rice IS rice), the explicit INGREDIENT_ALIASES groups handle
    // the match via Set lookup BEFORE this guard runs. So this guard only
    // fires for ingredients without an explicit "color is default" alias.
    if (prefix) {
      const lastPrefixWord = prefix.split(/\s+/).pop();
      if (COLOR_TYPE_MODIFIERS.has(lastPrefixWord)) return false;
    }
  }
  return true;
}

/**
 * Detect ingredients marked as optional. These shouldn't count toward the
 * recipe's required ingredient total — a cook who's missing them can still
 * make the recipe. Patterns recognized:
 *   "tomatoes (optional)"
 *   "1 jalapeño, optional"
 *   "optional toppings: berries, cacao nibs"
 *   "optional add-ins: nuts"
 *   "optional, for heat: 1 jalapeño"
 */
function _isOptional(rawIng) {
  return /\boptional\b/i.test(rawIng);
}

/**
 * Universal ingredients: things every kitchen has by default. These should
 * never count against a user's match %. Includes water (660 recipes use it
 * as a measured ingredient), ice, etc. Detected by exact-match against the
 * ingredient name after stripping measurements.
 */
const UNIVERSAL_INGREDIENTS = new Set([
  'water', 'tap water', 'cold water', 'warm water', 'hot water',
  'boiling water', 'filtered water', 'cool water', 'lukewarm water',
  'room temperature water', 'iced water', 'ice water',
  'ice', 'ice cubes', 'crushed ice',
  'air',
]);

function _isUniversal(rawOrNormalized) {
  // Strip measurements first ("3 ½ cups water" → "water")
  const stripped = norm(stripMeasure(rawOrNormalized));
  if (UNIVERSAL_INGREDIENTS.has(stripped)) return true;
  // Stem-aware (handles "ice cubes" → "ice cube")
  const stemmed = stripped.split(/\s+/).map(stem).join(' ');
  return UNIVERSAL_INGREDIENTS.has(stemmed);
}

/**
 * Strip recipe ingredient noise that doesn't affect ingredient identity:
 *   - "for cooking/frying/serving/garnish/drizzling/etc." (usage instructions)
 *   - "to taste"
 *   - ", divided" / ", melted" / ", softened" / ", room temperature"
 *   - footnote markers (*, **, †)
 *   - parenthetical notes
 *   - bracketed measurements
 *
 * Example: "oil for cooking" → "oil"
 *          "olive oil for drizzling" → "olive oil"
 *          "salt to taste" → "salt"
 *          "vegan butter, melted" → "vegan butter"
 *          "almond milk* (see notes)" → "almond milk"
 */
// Pre-compiled regexes (huge perf win — these used to compile on every call,
// running up to 45,000 times per recipe-list render).
const _RE_FOOTNOTE = /[*†‡]+/g;
const _RE_PARENS = /\s*\([^)]*\)/g;
const _RE_BRACKETS = /\s*\[[^\]]*\]/g;
const _RE_FOR_USAGE = /\s*[,\-]?\s*\bfor\s+(cooking|frying|sauté|sauteing|sautéing|greasing|brushing|drizzling|garnish|garnishing|serving|topping|finishing|dusting|sprinkling|coating|baking|roasting|the\s+top|extra)\b.*$/i;
const _RE_TO_TASTE = /\s*[,\-]?\s*\bto\s+taste\b.*$/i;
const _PREP = '(?:divided|melted|softened|room\\s+temperature|chilled|warmed|cooled|drained|rinsed|cubed|diced|chopped|sliced|minced|crushed|grated|shredded|peeled|seeded|deseeded|cooked|raw|toasted|rolled|frozen|thawed|optional|halved|quartered|pitted|stemmed|trimmed|cleaned|patted\\s+dry|squeezed|drained\\s+well|finely\\s+chopped|finely\\s+diced|thinly\\s+sliced|roughly\\s+chopped|coarsely\\s+chopped|cut\\s+into\\s+\\w+(?:\\s+\\w+)*)';
const _RE_PREP_STATE = new RegExp(`\\s*,\\s*${_PREP}(?:\\s*(?:,|and)\\s*${_PREP})*\\b.*$`, 'i');

function _stripUsageNotes(rawIng) {
  return rawIng
    .replace(_RE_FOOTNOTE, '')
    .replace(_RE_PARENS, '')
    .replace(_RE_BRACKETS, '')
    .replace(_RE_FOR_USAGE, '')
    .replace(_RE_TO_TASTE, '')
    .replace(_RE_PREP_STATE, '')
    .trim();
}

/**
 * Detect combined ingredients (e.g. "salt and pepper", "garlic powder and
 * onion powder", "salt, pepper, and onion powder") and split into components.
 * The matcher treats these as a single ingredient line that requires ALL
 * components to be in the user's pantry.
 *
 * Returns an array of component names, or null if not combined.
 */
function _splitCombined(rawIng) {
  let cleaned = rawIng.toLowerCase();
  // Strip parens, footnote markers, "to taste", "optional" qualifier
  cleaned = cleaned.replace(/\(.*?\)/g, '').replace(/[*†‡]+/g, '').trim();
  cleaned = cleaned.replace(/\bto\s+taste\b/g, '').replace(/\boptional\b/g, '').trim();
  // Strip leading measurements/quantities ("3 ½ cups", "1 tbsp", etc.)
  cleaned = cleaned.replace(/^[\d½¼¾⅓⅔.,/\s-]+/, '').trim();
  cleaned = cleaned.replace(/^(?:tbsp|tsp|teaspoons?|tablespoons?|cups?|pinch(?:es)?|dash(?:es)?|splash(?:es)?|sprigs?|leaves?|cloves?|pieces?|grams?|g|ml|l|oz|lb|lbs|ounces?|pounds?)\.?\s+(?:of\s+)?/i, '').trim();
  cleaned = cleaned.replace(/^pinch\s+of\s+/i, '').replace(/^splash\s+of\s+/i, '');

  // Hyphen-combined ingredients followed by a compound product noun:
  //   "ginger-garlic paste", "lemon-herb sauce", "soy-ginger marinade"
  // The trailing noun (paste/sauce/etc.) signals a BLEND, so the two
  // hyphenated parts are distinct ingredients that need to BOTH be in
  // pantry. Convert hyphen to " and " so the splitter below sees them
  // as components.
  // (This is different from "extra-firm tofu" or "plant-based milk" where
  // the hyphenated part is a single modifier; those don't end in a blend
  // suffix so this regex won't fire.)
  cleaned = cleaned.replace(
    /\b([a-z]+)-([a-z]+)\s+(?:paste|sauce|blend|mix|mixture|marinade|rub|seasoning|dressing|glaze|relish|chutney|salsa|pesto)\b/g,
    '$1 and $2'
  );
  // Same idea for known space-separated combined-product names. These are
  // narrowly-scoped two-word combos that read as a single product but are
  // really blends of the two named ingredients.
  const KNOWN_BLENDS = [
    /\bginger\s+garlic\s+(?:paste|sauce)\b/g,
    /\bgarlic\s+ginger\s+(?:paste|sauce)\b/g,
    /\blemon\s+garlic\s+(?:sauce|dressing|marinade)\b/g,
    /\bgarlic\s+herb\s+(?:butter|seasoning|blend|sauce)\b/g,
  ];
  for (const re of KNOWN_BLENDS) {
    cleaned = cleaned.replace(re, m => {
      const words = m.split(/\s+/);
      // Keep the first two ingredient words, drop the trailing product noun
      return words[0] + ' and ' + words[1];
    });
  }

  // Normalize "X, Y, and Z" → "X and Y and Z" so we can split uniformly
  cleaned = cleaned.replace(/,\s*(?:and\s+)?/g, ' and ').trim();
  // Strip a trailing connector word that the split regex below can't consume
  // (split needs \s+ on BOTH sides of "and"; .trim() above removes trailing
  // whitespace, leaving e.g. "...pepper and" — the lone "and" then survives
  // into the last part and inflates its word count, tripping the
  // too-many-words guard. Real example: "Sea salt and freshly ground black
  // pepper, to taste" comma-replaced becomes "...pepper and" after trim.)
  cleaned = cleaned.replace(/\s+(?:and|&|\+)\s*$/i, '').trim();

  // Split on connector words. Use lookahead so we don't split inside compounds
  // that legitimately contain "and" (rare for ingredient names).
  const parts = cleaned.split(/\s+(?:and|&|\+)\s+/i)
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  // Reject if any component is too long (likely an instruction like
  // "drained and rinsed", "stirred and warmed", "minced and ready").
  // Real ingredient names are 1-4 words.
  if (parts.some(p => p.split(/\s+/).length > 4)) return null;

  // Reject if any component is just a prep word (e.g., "drained", "rinsed",
  // "warmed") — those are usage notes, not separate ingredients.
  const PREP_WORDS = new Set([
    'drained','rinsed','chopped','diced','sliced','minced','crushed','grated',
    'shredded','peeled','seeded','cooked','warmed','cooled','melted','softened',
    'cubed','quartered','halved','divided','rolled','beaten','whipped','sifted',
  ]);
  if (parts.some(p => PREP_WORDS.has(p))) return null;

  return parts;
}

/**
 * Check if a recipe contains a specific allergen.
 *
 * @param {{ ing: string[] }} recipe
 * @param {string} allergenKey - e.g., 'peanut', 'soy', 'nightshade'
 * @returns {boolean}
 */
export function recipeHasAllergen(recipe, allergenKey) {
  const keywords = ALLERGY_KEYWORDS[allergenKey] || [allergenKey];
  const ingStr = recipe.ing.join(' ').toLowerCase();
  return keywords.some(kw => ingStr.includes(kw));
}

/**
 * Score and rank recipes against a user's ingredient list.
 *
 * @param {Object} params
 * @param {Object[]} params.recipes - Full recipe array
 * @param {string[]} params.ingredients - User's "today" ingredients
 * @param {string[]} params.staples - User's always-have staples
 * @param {string[]} [params.selectedCats] - Category filters
 * @param {string} [params.selectedSite] - Site filter
 * @param {number} [params.maxTime] - Max cook time filter (0 = no limit)
 * @param {string} [params.nameSearch] - Text search query
 * @param {Set<string>} [params.allergies] - Active allergy filter keys
 * @returns {Object[]} Scored/ranked recipes with have/need/pct fields
 */
export function findRecipes({
  recipes,
  ingredients = [],
  staples = [],
  selectedCats = [],
  selectedSite = '',
  maxTime = 0,
  nameSearch = '',
  allergies = new Set(),
}) {
  const allIngs  = expandWithAliases([...ingredients, ...staples]);
  const allIngSet = new Set(allIngs);
  const userNorm = expandWithAliases(ingredients);
  const userNormSet = new Set(userNorm);
  // Pre-compute stems ONCE per render (huge perf win — used to re-stem
  // user pantry ingredients for every recipe ingredient match attempt,
  // millions of redundant calls per page load).
  const allIngsStems = precomputeUserStems(allIngs);
  const userNormStems = precomputeUserStems(userNorm);

  // Apply filters
  // Always exclude recipes containing structural gluten ingredients with no
  // viable GF substitute (farro, couscous, barley, seitan, beer, etc.).
  // HARVEST is gluten-free by default — these never surface to users.
  let pool = recipes.filter(r => !isGlutenRecipe(r));

  if (selectedCats.length) {
    pool = pool.filter(r => r.cats && selectedCats.every(c => {
      if (c === 'High-Protein') return r.nut && r.nut.pro >= 15;
      return c.includes('|')
        ? c.split('|').some(s => r.cats.includes(s.trim()))
        : r.cats.includes(c);
    }));
  }

  if (selectedSite) {
    pool = pool.filter(r => r.site === selectedSite);
  }

  if (maxTime > 0) {
    pool = pool.filter(r => r.time && r.time <= maxTime);
  }

  if (nameSearch) {
    const q = nameSearch.toLowerCase();
    // Strip quotes/punctuation so "Meatballs" → Meatballs for matching
    const stripPunc = s => s.replace(/[“”‘’„‚«»"']/g, '');

    // Pre-compile regex for each search word (avoids creating per-recipe)
    const words = q.split(/\s+/);
    const wordPatterns = words.map(w => {
      const s = stem(w);
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[\\s,\\-\\(])${esc}($|[\\s,\\-\\)])`);
      const reStem = w !== s ? new RegExp(`(^|[\\s,\\-\\(])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s,\\-\\)])`) : null;
      return { re, reStem };
    });

    pool = pool.filter(r => {
      const t = stripPunc(r.title.toLowerCase());
      const ings = stripPunc((r.ing || []).join(' ').toLowerCase());

      // Full-phrase match — covers multi-word terms like "ice cream"
      if (t.includes(q) || ings.includes(q)) return true;

      // Word-boundary fallback — each word must appear at a word boundary
      return wordPatterns.every(({ re, reStem }) =>
        re.test(t) || re.test(ings) || (reStem && (reStem.test(t) || reStem.test(ings)))
      );
    });
  }

  if (allergies.size) {
    pool = pool.filter(r => {
      // Recipe passes if, for every active allergy, the recipe is either
      // (a) free of that allergen, OR (b) every allergen-containing
      // ingredient has a viable substitute the user has in their pantry.
      // This is the smart-substitution path: a tree-nut-allergic user with
      // oat milk can still see almond-milk recipes (using their oat milk).
      for (const key of allergies) {
        if (!recipeHasAllergen(r, key)) continue;
        if (!_isAllergyRecipeSatisfiable(r, key, allIngSet, allIngs)) return false;
      }
      return true;
    });
  }

  // Score each recipe
  const results = pool.map(r => {
    const have = [];          // normalized ingredients user has
    const need = [];          // normalized ingredients user is missing (REQUIRED only)
    const haveNames = [];     // original ingredient strings user has
    const needNames = [];     // original ingredient strings user needs
    let requiredCount = 0;    // count of ingredients excluding "(optional)"
    let userHaveCount = 0;    // count of recipe ings matched against user-typed ingredients only
    // Records ingredients that were matched via allergen substitution. Keyed
    // by the displayCanonical (same string as appears in r.have), so the
    // card/detail render layers can look up the swap when drawing chips.
    //   { 'almond milk': { substitute: 'oat milk', allergen: 'tree nut' } }
    const allergenSwaps = {};

    // Use pre-canonicalized iclean array if present (built by
    // scripts/canonicalize-ingredients.mjs at build time). Each iclean[i]
    // is an array of canonical ingredient names for ing[i]:
    //   normal:    ["onion"]
    //   combined:  ["salt", "pepper"]
    //   dropped:   []  (was a section header / empty / cross-recipe reference)
    //
    // For a recipe ing[i] to count as MATCHED, ALL canonical names in
    // iclean[i] must be in user's expanded pantry (combined ingredients
    // need every component).
    //
    // Falls back to runtime stripMeasure if iclean is missing (legacy
    // recipes that haven't been re-canonicalized yet).
    const hasICleanField = Array.isArray(r.iclean) && r.iclean.length === r.ing.length;

    for (let i = 0; i < r.ing.length; i++) {
      const rawIng = r.ing[i];
      if (!rawIng || !rawIng.trim()) continue;

      // ─── New iclean-based path ───────────────────────────────
      if (hasICleanField) {
        const components = r.iclean[i];
        if (!components || components.length === 0) continue; // dropped

        const optional = _isOptional(rawIng);

        // Universal ingredients (water, ice) are SKIPPED entirely — don't
        // show in have/need chips, don't count toward required total.
        // Showing "water" in a recipe's "you have" list looks absurd.
        if (_isUniversal(rawIng)) continue;

        let matched = false;
        // Captured allergen swap for this ingredient, if any component
        // was satisfied only via an allergen substitute. Recorded later
        // under displayCanonical when matched succeeds.
        let allergenSwapForThis = null;

        if (!matched) {
          // For each canonical component, check user pantry.
          // Combined (multi-component) ingredients need ALL satisfied.
          matched = components.every(c => {
            if (allIngSet.has(c)) return true;
            // Word-boundary fallback for partial matches (e.g., "olive oil"
            // pantry covering "extra virgin olive oil" components etc.)
            if (ingredientMatches(c, allIngs, allIngSet, allIngsStems)) return true;
            // GF auto-swap: if a wheat ingredient and user has GF variant
            for (const [wheatItem, gfAlts] of Object.entries(_GF_MATCH_SWAPS)) {
              if (c.includes(wheatItem) || c === wheatItem) {
                if (gfAlts.some(alt => allIngSet.has(alt) || allIngs.some(ai => ai.includes(alt)))) {
                  return true;
                }
              }
            }
            // Allergen-conditional swap: if an allergen ingredient and the
            // user has a substitute in pantry (only applies when the
            // matching allergy is active in user settings). Capture which
            // substitute matched so the UI can show "use your X instead".
            if (allergies.size) {
              for (const allergenKey of allergies) {
                const swaps = _ALLERGEN_SWAPS[allergenKey];
                if (!swaps) continue;
                for (const [allergenItem, alts] of Object.entries(swaps)) {
                  if (c.includes(allergenItem) || c === allergenItem) {
                    const matchedAlt = alts.find(alt =>
                      allIngSet.has(alt) || allIngs.some(ai => ai.includes(alt))
                    );
                    if (matchedAlt) {
                      // Record swap for the first allergen-substituted component
                      // we encounter. Stored under displayCanonical below.
                      if (!allergenSwapForThis) {
                        allergenSwapForThis = {
                          original: allergenItem,
                          substitute: matchedAlt,
                          allergen: allergenKey,
                        };
                      }
                      return true;
                    }
                  }
                }
              }
            }
            return false;
          });
        }

        const displayCanonical = components.join(' + ');
        if (matched) {
          have.push(displayCanonical);
          haveNames.push(rawIng);
          if (allergenSwapForThis) {
            allergenSwaps[displayCanonical] = allergenSwapForThis;
          }
          if (components.some(c => userNormSet.has(c) || ingredientMatches(c, userNorm, userNormSet, userNormStems))) {
            userHaveCount++;
          }
        }
        if (!optional) {
          requiredCount++;
          if (!matched) {
            need.push(displayCanonical);
            needNames.push(rawIng);
          }
        }
        continue;
      }

      // ─── Legacy fallback path (when iclean missing) ──────────
      const trimmedLower = rawIng.trim().toLowerCase().replace(/[:*]+$/, '');
      if (/^(?:for\s+(?:the\s+)?(?:topping|serving|garnish|sauce|dressing|filling|base|crust|frosting|glaze|drizzle|coating|marinade|dough|crumble|streusel|assembly|the\s+\w+))$/i.test(trimmedLower) ||
          /^optional\s+(?:topping|toppings|add\s*-?\s*ins?|extras?|garnish(?:es)?)$/i.test(trimmedLower)) {
        continue;
      }
      if (/^[\d½¼¾⅓⅔.,/\s-]*(?:recipe|batch|portion)\s+\w+/i.test(rawIng.trim())) {
        continue;
      }
      // Universal ingredients (water, ice) — skip entirely
      if (_isUniversal(rawIng)) continue;

      const optional = _isOptional(rawIng);
      const measureStripped = stripMeasure(rawIng);
      const cleaned = _stripUsageNotes(measureStripped)
        .replace(/\s*\/\s*/g, ' or ')
        .replace(/\s*&\s*/g, ' and ')
        .replace(/\s*\+\s*/g, ' and ');
      const ri = norm(cleaned);

      let matched = false;
      if (!matched) {
        matched = ingredientMatches(ri, allIngs, allIngSet, allIngsStems);
      }
      if (!matched) {
        const components = _splitCombined(rawIng);
        if (components) {
          matched = components.every(c => ingredientMatches(c, allIngs, allIngSet, allIngsStems));
        }
      }
      if (!matched) {
        for (const [wheatItem, gfAlts] of Object.entries(_GF_MATCH_SWAPS)) {
          if (ri.includes(wheatItem)) {
            if (gfAlts.some(alt => allIngSet.has(alt) || allIngs.some(ai => ai.includes(alt)))) {
              matched = true;
              break;
            }
          }
        }
      }
      // Allergen-conditional swap (legacy path) — same behavior as the
      // iclean path above. Only fires when the allergy is active.
      let legacyAllergenSwap = null;
      if (!matched && allergies.size) {
        for (const allergenKey of allergies) {
          const swaps = _ALLERGEN_SWAPS[allergenKey];
          if (!swaps) continue;
          for (const [allergenItem, alts] of Object.entries(swaps)) {
            if (ri.includes(allergenItem)) {
              const matchedAlt = alts.find(alt =>
                allIngSet.has(alt) || allIngs.some(ai => ai.includes(alt))
              );
              if (matchedAlt) {
                matched = true;
                legacyAllergenSwap = {
                  original: allergenItem,
                  substitute: matchedAlt,
                  allergen: allergenKey,
                };
                break;
              }
            }
          }
          if (matched) break;
        }
      }

      if (matched) {
        have.push(ri);
        haveNames.push(rawIng);
        if (legacyAllergenSwap) {
          allergenSwaps[ri] = legacyAllergenSwap;
        }
        if (ingredientMatches(ri, userNorm, userNormSet, userNormStems)) userHaveCount++;
      }

      if (!optional) {
        requiredCount++;
        if (!matched) {
          need.push(ri);
          needNames.push(rawIng);
        }
      }
    }

    // pct: how much of the REQUIRED (non-optional) ingredients does user have
    const haveRequiredCount = requiredCount - need.length;
    const pct = requiredCount ? Math.round(haveRequiredCount / requiredCount * 100) : 100;

    // Count how many of the user's perishable ingredients this recipe uses
    const perishHave = have.filter(h => isPerishableIng(h)).length;

    return { ...r, have, need, haveNames, needNames, pct, userHave: userHaveCount, perishHave, allergenSwaps };
  });

  // Default sort: best match first, then perishable priority, then alphabetical
  results.sort((a, b) => b.pct - a.pct || b.perishHave - a.perishHave || b.userHave - a.userHave || a.title.localeCompare(b.title));

  return results;
}

/**
 * Sort results by a given key.
 * Returns a new sorted array (does not mutate the input).
 *
 * @param {Object[]} results
 * @param {'match'|'time'|'serv'|'alpha'|'protein'|'fiber'|'cal'|'pronutri'} sortKey
 * @returns {Object[]} New sorted array
 */
export function sortResults(results, sortKey) {
  const copy = [...results];
  switch (sortKey) {
    case 'match':
      return copy.sort((a, b) => b.pct - a.pct || b.perishHave - a.perishHave || b.userHave - a.userHave || a.title.localeCompare(b.title));
    case 'time':
      return copy.sort((a, b) => (a.time || 999) - (b.time || 999));
    case 'serv':
      return copy.sort((a, b) => (b.servings || 0) - (a.servings || 0));
    case 'alpha':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'protein':
      return copy.sort((a, b) => ((b.nut && b.nut.pro) || 0) - ((a.nut && a.nut.pro) || 0) || a.title.localeCompare(b.title));
    case 'fiber':
      return copy.sort((a, b) => ((b.nut && b.nut.fib) || 0) - ((a.nut && a.nut.fib) || 0) || a.title.localeCompare(b.title));
    case 'cal':
      return copy.sort((a, b) => ((a.nut && a.nut.cal) || 999) - ((b.nut && b.nut.cal) || 999) || a.title.localeCompare(b.title));
    case 'pronutri':
      // Combined protein + fiber per serving, descending. The Browse default —
      // surfaces the most nutritionally dense recipes first, regardless of category.
      return copy.sort((a, b) => {
        const aScore = ((a.nut && a.nut.pro) || 0) + ((a.nut && a.nut.fib) || 0);
        const bScore = ((b.nut && b.nut.pro) || 0) + ((b.nut && b.nut.fib) || 0);
        return bScore - aScore || a.title.localeCompare(b.title);
      });
    default:
      return copy;
  }
}

/**
 * Compute Pantry Power stats.
 *
 * @param {Object[]} recipes - Full recipe array
 * @param {string[]} ingredients - User's today ingredients
 * @param {string[]} staples - User's staples
 * @returns {{ canMakeNow: number, eightyPercent: number, totalRecipes: number }}
 */
export function computePantryPower(recipes, ingredients, staples) {
  const allIngs = expandWithAliases([...ingredients, ...staples]);
  const allIngSet = new Set(allIngs);
  let canMakeNow = 0;
  let eightyPercent = 0;

  // Match findRecipes — exclude un-GF-able recipes from the catalog.
  const pool = recipes.filter(r => !isGlutenRecipe(r));

  pool.forEach(r => {
    const rIngs = r.ing.map(norm);
    const have = rIngs.filter(ri => ingredientMatches(ri, allIngs, allIngSet));
    const pct = rIngs.length ? have.length / rIngs.length : 0;
    if (pct >= 1 || rIngs.length - have.length <= 1) canMakeNow++;
    if (pct >= 0.8) eightyPercent++;
  });

  return { canMakeNow, eightyPercent, totalRecipes: pool.length };
}
