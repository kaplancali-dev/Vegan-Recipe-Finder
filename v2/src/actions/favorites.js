/**
 * Shared favorite toggle action.
 * Used by Browse, Favorites, ReadyToCook, and RecipeDetail.
 *
 * When favoriting, a collection picker appears so the user
 * must categorize the recipe. Unfavoriting skips the picker
 * and also removes the recipe from any collections.
 */

import { get, set } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { COLLECTIONS } from '../data/collections.js';
import { escHTML } from '../utils/text.js';
import { showToast } from '../utils/toast.js';

/**
 * Move a recipe to a different collection (without unfavoriting).
 * Shows the collection picker; on pick, removes from all other
 * collections and adds to the chosen one.
 * @param {number} id - Recipe ID
 */
export function moveToCollection(id) {
  showCollectionPicker(id, true);
}

/**
 * Toggle a recipe's favorite status.
 * If adding, shows a collection picker first.
 * @param {number} id - Recipe ID
 */
export function toggleFavorite(id) {
  const favs = get('favorites');
  const favSet = new Set(favs);
  const wasFav = favSet.has(id);

  if (wasFav) {
    // Unfavorite — remove from favorites and all collections
    favSet.delete(id);
    set('favorites', [...favSet]);

    const cols = get('collections') || {};
    let changed = false;
    for (const key of Object.keys(cols)) {
      if (Array.isArray(cols[key]) && cols[key].includes(id)) {
        cols[key] = cols[key].filter(i => i !== id);
        changed = true;
      }
    }
    if (changed) set('collections', cols);

    autoSync();
    return;
  }

  // Favoriting — show the collection picker
  showCollectionPicker(id);
}

/**
 * Show a modal asking the user to pick a collection for the recipe.
 * The recipe is not favorited until a collection is chosen.
 * In move mode, the recipe stays favorited but switches collections.
 * @param {number} id - Recipe ID
 * @param {boolean} [isMove=false] - Move mode (already favorited)
 */
function showCollectionPicker(id, isMove = false) {
  // Remove any existing picker
  const existing = document.querySelector('.collection-picker-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'collection-picker-overlay';

  const cols = get('collections') || {};

  const buttons = COLLECTIONS.filter(c => c.key !== 'all').map(({ key, icon, label }) => {
    const count = (cols[key] || []).length;
    return `<button class="collection-pick-btn" data-pick="${key}">
      <span>${icon}</span>
      <span>${escHTML(label)}</span>
      <span class="muted" style="font-size:0.72rem;margin-left:auto">${count ? count : ''}</span>
    </button>`;
  }).join('');

  const pickerTitle = isMove ? 'Move to collection' : 'Save to collection';
  const pickerHint = isMove ? 'Pick the new collection:' : 'Pick a collection for this recipe:';

  overlay.innerHTML = `
    <div class="collection-picker-modal card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="font-family:var(--font-sans);font-size:1rem;margin:0">${pickerTitle}</h4>
        <button class="icon-btn" data-picker-close aria-label="Cancel">&times;</button>
      </div>
      <p style="font-size:0.82rem;color:var(--ink-soft);margin-bottom:12px">${pickerHint}</p>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${buttons}
      </div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    // Close on backdrop click
    if (e.target === overlay || e.target.closest('[data-picker-close]')) {
      overlay.remove();
      return;
    }

    const pickBtn = e.target.closest('.collection-pick-btn');
    if (!pickBtn) return;

    const key = pickBtn.dataset.pick;

    const collections = get('collections') || {};

    if (isMove) {
      // Move: remove from all other collections first
      for (const k of Object.keys(collections)) {
        if (Array.isArray(collections[k])) {
          collections[k] = collections[k].filter(i => i !== id);
        }
      }
    } else {
      // Add to favorites
      const favs = get('favorites');
      const favSet = new Set(favs);
      favSet.add(id);
      set('favorites', [...favSet]);
    }

    // Add to the chosen collection
    if (!collections[key]) collections[key] = [];
    if (!collections[key].includes(id)) {
      collections[key].push(id);
    }
    set('collections', collections);

    autoSync();
    overlay.remove();

    const def = COLLECTIONS.find(c => c.key === key);
    showToast(isMove ? `Moved to ${def ? def.label : 'collection'} 📁` : `Saved to ${def ? def.label : 'collection'} ❤️`);
  });

  document.body.appendChild(overlay);
}
