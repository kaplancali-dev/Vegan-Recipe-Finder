/**
 * Recipe matching engine.
 *
 * Pure functions that take data in and return results out.
 * No DOM access, no global state, no side effects.
 */

import { norm, stem } from '../utils/text.js';
import { INGREDIENT_ALIASES, INGREDIENT_SUBS, ALLERGY_KEYWORDS } from '../data/aliases.js';

/**
 * Expand a user's ingredient list with all aliases and substitutions.
 * e.g., ["olive oil"] → ["olive oil", "coconut oil", "avocado oil", ...]
 *
 * @param {string[]} ings - Raw ingredient names from user
 * @returns {string[]} Expanded list of normalized ingredient names
 */
export function expandWithAliases(ings) {
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

  return [...result];
}

/**
 * Check if a recipe ingredient matches any user ingredient (bidirectional substring).
 *
 * @param {string} recipeIng - Normalized recipe ingredient
 * @param {string[]} userIngs - Expanded normalized user ingredients
 * @returns {boolean}
 */
export function ingredientMatches(recipeIng, userIngs) {
  return userIngs.some(ai => recipeIng.includes(ai) || ai.includes(recipeIng));
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
  const userNorm = expandWithAliases(ingredients);

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
    pool = pool.filter(r => {
      const t = r.title.toLowerCase();
      const ings = (r.ing || []).join(' ').toLowerCase();
      const words = nameSearch.toLowerCase().split(/\s+/);
      return words.every(w => {
        const s = stem(w);
        return t.includes(w) || t.includes(s) || ings.includes(w) || ings.includes(s);
      });
    });
  }

  if (allergies.size) {
    pool = pool.filter(r => ![...allergies].some(key => recipeHasAllergen(r, key)));
  }

  // Score each recipe
  const results = pool.map(r => {
    const rIngs = r.ing.map(norm);
    const have  = rIngs.filter(ri => ingredientMatches(ri, allIngs));
    const need  = rIngs.filter(ri => !ingredientMatches(ri, allIngs));
    const userHave = rIngs.filter(ri => ingredientMatches(ri, userNorm));
    const pct   = rIngs.length ? Math.round(have.length / rIngs.length * 100) : 0;

    // Preserve original ingredient names for display
    const haveNames = r.ing.filter(ing => have.includes(norm(ing)));
    const needNames = r.ing.filter(ing => need.includes(norm(ing)));

    return { ...r, have, need, haveNames, needNames, pct, userHave: userHave.length };
  });

  // Default sort: best match first
  results.sort((a, b) => b.pct - a.pct || b.userHave - a.userHave || a.title.localeCompare(b.title));

  return results;
}

/**
 * Sort results by a given key.
 *
 * @param {Object[]} results
 * @param {'match'|'time'|'serv'|'alpha'} sortKey
 * @returns {Object[]} Sorted array (mutates in place for performance)
 */
export function sortResults(results, sortKey) {
  switch (sortKey) {
    case 'match':
      return results.sort((a, b) => b.pct - a.pct || b.userHave - a.userHave || a.title.localeCompare(b.title));
    case 'time':
      return results.sort((a, b) => (a.time || 999) - (b.time || 999));
    case 'serv':
      return results.sort((a, b) => (b.servings || 0) - (a.servings || 0));
    case 'alpha':
      return results.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return results;
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
  let canMakeNow = 0;
  let eightyPercent = 0;

  recipes.forEach(r => {
    const rIngs = r.ing.map(norm);
    const have = rIngs.filter(ri => ingredientMatches(ri, allIngs));
    const pct = rIngs.length ? have.length / rIngs.length : 0;
    if (pct >= 1 || rIngs.length - have.length <= 1) canMakeNow++;
    if (pct >= 0.8) eightyPercent++;
  });

  return { canMakeNow, eightyPercent, totalRecipes: recipes.length };
}
