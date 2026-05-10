/**
 * Shop+Queue combined action.
 *
 * One-tap behavior for the recipe card 🛒+N button: adds the recipe to
 * Make Soon AND adds its missing ingredients to the shopping list.
 *
 * Make Soon-only (📌 button) remains a separate action for users who have
 * everything in pantry and just want to queue without shopping.
 */
import { get, set } from '../state/store.js';
import { showToast } from '../utils/toast.js';
import { autoSync } from '../services/sync.js';

/**
 * Add a recipe to Make Soon AND its missing ingredients to the shopping list.
 * Idempotent: re-tapping doesn't duplicate entries.
 *
 * @param {number} id - Recipe id
 * @param {string[]} missingNames - Raw missing-ingredient strings
 */
export function shopAndQueue(id, missingNames = []) {
  // Add to makelist (queue) if not already there
  const list = get('makelist') || [];
  if (!list.includes(id)) {
    list.push(id);
    set('makelist', list);
  }
  // Add recipe id to shopRecipes so the Shopping tab groups its ingredients
  // under the recipe's name (instead of "Additional Items").
  const shopRecipes = get('shopRecipes') || [];
  if (!shopRecipes.includes(id)) {
    shopRecipes.push(id);
    set('shopRecipes', shopRecipes);
  }
  // Add missing ingredients to shopping list (deduped via Set)
  if (missingNames.length) {
    const shopSet = new Set(get('shopList') || []);
    missingNames.forEach(n => shopSet.add(n));
    set('shopList', [...shopSet]);
  }
  autoSync();
  const n = missingNames.length;
  showToast(n
    ? `Added to Make Soon · ${n} ingredient${n !== 1 ? 's' : ''} to Shopping 🛒`
    : 'Added to Make Soon 📌');
}
