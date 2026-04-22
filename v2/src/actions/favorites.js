/**
 * Shared favorite toggle action.
 * Used by Browse, Favorites, ReadyToCook, and RecipeDetail.
 */

import { get, set } from '../state/store.js';
import { autoSync } from '../services/sync.js';

/**
 * Toggle a recipe's favorite status.
 * @param {number} id - Recipe ID
 * @returns {boolean} New favorite state (true = now favorited)
 */
export function toggleFavorite(id) {
  const favs = get('favorites');
  const favSet = new Set(favs);
  const wasFav = favSet.has(id);

  if (wasFav) {
    favSet.delete(id);
  } else {
    favSet.add(id);
  }

  set('favorites', [...favSet]);
  autoSync();
  return !wasFav;
}
