/**
 * Recipe matching engine.
 *
 * Pure functions that take data in and return results out.
 * No DOM access, no global state, no side effects.
 * Includes memoization for expensive alias expansion.
 */

import { norm, stem } from '../utils/text.js';
import { INGREDIENT_ALIASES, INGREDIENT_SUBS, ALLERGY_KEYWORDS, PERISHABLES } from '../data/aliases.js';

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

    // Expand generic aliases (bidirectional)
    Object.entries(INGREDIENT_ALIASES).forEach(([alias, variants]) => {
      if (norm(alias) === key) variants.forEach(v => result.add(norm(v)));
    });

    // Expand one-way substitutions
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
export function ingredientMatches(recipeIng, userIngs, userIngSet) {
  // Fast path: exact match via Set (avoids all string ops for ~40% of cases)
  if (userIngSet && userIngSet.has(recipeIng)) return true;

  // Two checks per user ingredient:
  //   1) Recipe-as-haystack: applies STRICT modifier guard. If the recipe is
  //      asking for "white chocolate chips" and user has plain "chocolate
  //      chips", the "white" prefix means recipe wants something specific
  //      the user doesn't have — REJECT.
  //   2) User-as-haystack: applies LOOSE modifier guard. If the user has
  //      "red onion" and recipe asks for "onion", the user has a specific
  //      instance of what the recipe wants — ACCEPT.
  return userIngs.some(ai =>
    _wordBoundaryMatch(recipeIng, ai, /* strictPrefix */ true) ||
    _wordBoundaryMatch(ai, recipeIng, /* strictPrefix */ false)
  );
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
const IDENTITY_SUFFIXES = new Set([
  // Liquid/oil/dairy forms — base ingredient ≠ derived liquid/fat
  'oil', 'milk', 'butter', 'cream', 'water', 'juice', 'nectar',
  // Powdered/ground/processed forms — base ≠ processed form
  'flour', 'powder', 'paste', 'starch', 'extract',
  // Sweet/sour derivatives
  'sugar', 'syrup', 'vinegar',
  // Seeds (e.g. "pumpkin seeds" vs "pumpkin", "sunflower seeds" vs "sunflower")
  'seed', 'seeds',
  // Spice mixes — base ≠ blend
  'spice', 'pie spice', 'spice blend', 'spice mix', 'seasoning',
  // Sauces and condiments — base ≠ derived sauce
  'sauce', 'aminos', 'mayo', 'mayonnaise', 'mustard',
  // Wrappers/papers (rice paper, etc.) — base ≠ derived sheet
  'paper', 'wrapper', 'wrappers',
  // Soup/broth derivatives — base ≠ liquid
  'broth', 'stock', 'bouillon', 'bisque', 'consommé', 'consomme',
  // Preserves/spreads — base ≠ jam/jelly form
  'jam', 'jelly', 'preserves', 'marmalade', 'compote', 'butter',
  // Dried/snack/baking-chip forms — base ≠ derived chip product
  // "Chips" is a distinct manufactured form. Even chocolate chips, while
  // similar to chocolate, are a specific shape that doesn't exist as a
  // generic chocolate property. Confection chips (peanut butter chips,
  // butterscotch chips, caramel chips) are MUCH further from their base.
  // Users who have "chocolate chips (any)" via the staples picker get the
  // chip alias automatically; users who have just "chocolate" can chop a
  // bar but the matcher should be honest about what they actually have.
  'leather', 'jerky', 'crisps', 'chips',
  // Alcohol and infusions
  'wine', 'liqueur', 'beer', 'tea',
  // Pasta/noodle forms
  'noodles', 'pasta',
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
    const remainder = haystack.slice(idx + needle.length).trim().replace(/^-/, '').trim();
    if (IDENTITY_SUFFIXES.has(remainder)) return false;
    // Word-by-word check: any identity-changing suffix in the remainder
    // means the haystack is a derived form of something else.
    const remainderWords = remainder.split(/\s+/);
    if (remainderWords.some(w => IDENTITY_SUFFIXES.has(w))) return false;
    // Also check if needle is the suffix and the prefix changes identity
    const prefix = haystack.slice(0, idx).trim().replace(/-$/, '').trim();
    if (prefix && IDENTITY_SUFFIXES.has(needle)) return false;

    // Color/type modifier guard: if the word immediately before `needle` in
    // the haystack is a color/type modifier ("white", "dark", etc.), the
    // recipe is calling for a specifically-modified ingredient that the
    // unmodified user ingredient can't satisfy. E.g., recipe needs "white
    // chocolate chips" but user only has "chocolate chips" — reject.
    //
    // ONLY apply this guard when haystack is the recipe ingredient
    // (strictPrefix=true). When the user has the specific version (e.g.
    // "red onion") and the recipe asks for the generic ("onion"), the user
    // legitimately HAS what the recipe wants — accept that match.
    if (strictPrefix && prefix) {
      const lastPrefixWord = prefix.split(/\s+/).pop();
      if (COLOR_TYPE_MODIFIERS.has(lastPrefixWord)) return false;
    }
  }
  return true;
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

  // Apply filters
  let pool = recipes;

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
    pool = pool.filter(r => ![...allergies].some(key => recipeHasAllergen(r, key)));
  }

  // Score each recipe
  const results = pool.map(r => {
    const rIngs = r.ing.map(norm);
    // Compute matches once and partition into have/need
    const have = [];
    const need = [];
    for (const ri of rIngs) {
      (ingredientMatches(ri, allIngs, allIngSet) ? have : need).push(ri);
    }
    const userHave = rIngs.filter(ri => ingredientMatches(ri, userNorm, userNormSet));
    const pct   = rIngs.length ? Math.round(have.length / rIngs.length * 100) : 0;

    // Preserve original ingredient names for display
    const haveNames = r.ing.filter(ing => have.includes(norm(ing)));
    const needNames = r.ing.filter(ing => need.includes(norm(ing)));

    // Count how many of the user's perishable ingredients this recipe uses
    const perishHave = have.filter(h => isPerishableIng(h)).length;

    return { ...r, have, need, haveNames, needNames, pct, userHave: userHave.length, perishHave };
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

  recipes.forEach(r => {
    const rIngs = r.ing.map(norm);
    const have = rIngs.filter(ri => ingredientMatches(ri, allIngs, allIngSet));
    const pct = rIngs.length ? have.length / rIngs.length : 0;
    if (pct >= 1 || rIngs.length - have.length <= 1) canMakeNow++;
    if (pct >= 0.8) eightyPercent++;
  });

  return { canMakeNow, eightyPercent, totalRecipes: recipes.length };
}
