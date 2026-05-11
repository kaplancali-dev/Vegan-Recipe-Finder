/**
 * Pantry suggestions — "what should I add next to unlock more recipes?"
 *
 * Strategy:
 *   1. Run findRecipes once with the user's current pantry.
 *   2. Identify "missing exactly 1" recipes — the single missing ingredient
 *      is the bottleneck for that recipe.
 *   3. For each candidate ingredient (from the picker = "common, buyable"),
 *      count how many bottleneck recipes it would unlock if added.
 *      A candidate "unlocks" a recipe if its alias expansion (combined with
 *      the user's existing pantry) covers ALL canonical components of the
 *      missing entry — handles combined ingredients like "salt + pepper"
 *      where the user already has salt.
 *   4. Sort by unlock count, return top N.
 *
 * Why this is fast: the matching engine runs ONCE; the per-candidate loop
 * is O(picker × oneShortRecipes) which is roughly 250 × few-hundred = trivial.
 *
 * Why "common ingredients only": the picker is HARVEST's curated list of
 * realistic, buyable ingredients. Surfacing "asafoetida unlocks 12 recipes"
 * isn't actionable for most users; surfacing "coconut milk unlocks 42" is.
 */

import { findRecipes, expandWithAliases } from './matching.js';
import { STAPLE_SECTIONS } from '../components/Onboarding.js';
import { norm } from '../utils/text.js';

/** Flatten the picker into a list of plain ingredient names. */
function _flattenPickerItems() {
  return STAPLE_SECTIONS.flatMap(section =>
    section.items.map(item => (typeof item === 'string' ? item : item.name))
  );
}

// Cache the flattened list — the picker is static for the session.
let _pickerCache = null;
function _getPickerItems() {
  if (!_pickerCache) _pickerCache = _flattenPickerItems();
  return _pickerCache;
}

/**
 * Compute the top N pantry-add suggestions.
 *
 * @param {Object} params
 * @param {Object[]} params.recipes - Full recipe catalog
 * @param {string[]} params.ingredients - User's "today" ingredients
 * @param {string[]} params.staples - User's always-have staples
 * @param {number}   [params.limit=5] - How many suggestions to return
 * @returns {{
 *   currentTotal: number,
 *   suggestions: Array<{ item: string, unlocks: number, newTotal: number }>
 * }}
 *   currentTotal = number of recipes currently at 100% match
 *   suggestions  = sorted desc by unlocks, each with its newTotal projection
 */
export function computeIngredientSuggestions({
  recipes,
  ingredients = [],
  staples = [],
  limit = 5,
}) {
  // Build a normed Set of items the user already has, so we don't suggest
  // things they've already picked.
  const ownedSet = new Set([...ingredients, ...staples].map(norm));

  // The user's current pantry expanded to include all aliases. This is what
  // findRecipes uses internally; we'll use it to check "user already has
  // some component of a combined missing entry".
  const userExpanded = new Set(expandWithAliases([...ingredients, ...staples]));

  // Run the matching engine once.
  const results = findRecipes({ recipes, ingredients, staples });
  const currentTotal = results.filter(r => r.pct >= 100).length;

  // Recipes one ingredient away from 100%.
  const oneShort = results.filter(r => r.pct < 100 && r.need.length === 1);
  if (!oneShort.length) {
    return { currentTotal, suggestions: [] };
  }

  // Score each picker candidate the user doesn't already have.
  const candidates = _getPickerItems().filter(item => !ownedSet.has(norm(item)));

  const impacts = [];
  for (const item of candidates) {
    const expanded = new Set(expandWithAliases([item]));
    let unlocks = 0;

    for (const recipe of oneShort) {
      const needEntry = recipe.need[0];
      // Combined entries display as "salt + pepper" — split into parts.
      // Each part is satisfied if it's covered by either the candidate's
      // expansion OR the user's existing pantry expansion (so "user has
      // salt, candidate adds pepper" still counts).
      const parts = needEntry.split(' + ');
      const covered = parts.every(p => expanded.has(p) || userExpanded.has(p));
      if (covered) unlocks++;
    }

    if (unlocks > 0) impacts.push({ item, unlocks, newTotal: currentTotal + unlocks });
  }

  impacts.sort((a, b) => b.unlocks - a.unlocks || a.item.localeCompare(b.item));
  return { currentTotal, suggestions: impacts.slice(0, limit) };
}
