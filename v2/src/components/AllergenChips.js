/**
 * AllergenChips — shared allergen toggle chips for filter drawers.
 *
 * Renders toggle-style chips (like category chips) that add/remove
 * allergens from the global state. Used in both Browse and Ready to Make drawers.
 */

import { get, set, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { escHTML } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';

const ALLERGEN_LABELS = {
  peanut: '🥜 Peanuts', 'tree nut': '🌰 Tree Nuts', soy: '🫘 Soy',
  coconut: '🥥 Coconut', corn: '🌽 Corn', mushroom: '🍄 Mushrooms',
  nightshade: '🍅 Nightshades',
};

/**
 * Build allergen toggle chips into a container.
 * Each chip toggles that allergen on/off in global state.
 *
 * @param {string} selector - CSS selector for the container element
 * @param {Function} onChangeCallback - Called after an allergen is toggled
 */
export function buildAllergenFilterChips(selector, onChangeCallback) {
  const container = $(selector);
  if (!container) return;

  const allergies = new Set(getRef('allergies'));

  container.innerHTML = Object.entries(ALLERGEN_LABELS).map(([key, label]) => {
    const isOn = allergies.has(key);
    return `<button class="filter-chip${isOn ? ' on' : ''}" data-allergen="${escHTML(key)}">${label}</button>`;
  }).join('');

  container.onclick = (e) => {
    const chip = e.target.closest('[data-allergen]');
    if (!chip) return;
    const key = chip.dataset.allergen;
    const current = get('allergies');

    if (current.includes(key)) {
      set('allergies', current.filter(a => a !== key));
      showToast('Removed — back on the menu');
    } else {
      current.push(key);
      set('allergies', current);
      showToast('Noted — those recipes are hidden now');
    }
    autoSync();
  };
}
