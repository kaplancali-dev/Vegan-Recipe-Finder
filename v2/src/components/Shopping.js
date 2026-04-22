/**
 * Shopping — Shopping List tab component.
 *
 * Renders the shopping list with check/uncheck items,
 * clear all functionality, and auto-persistence.
 * Checked state persists to localStorage via shopChecked state key.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { escHTML, norm } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';

/**
 * Get the checked set from persisted state.
 * @returns {Set<string>}
 */
function getCheckedSet() {
  const arr = getRef('shopChecked');
  return new Set(Array.isArray(arr) ? arr : []);
}

/**
 * Persist the checked set to state.
 * @param {Set<string>} checked
 */
function saveChecked(checked) {
  set('shopChecked', [...checked]);
}

/**
 * Initialize the Shopping List tab.
 */
export function initShopping() {
  wireControls();
  renderShopList();

  subscribe('shopList', renderShopList);
  subscribe('shopChecked', renderShopList);
}

/**
 * Wire the Clear All button.
 */
function wireControls() {
  const clearBtn = $('#clearShopBtn');
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    const items = getRef('shopList');
    if (!items.length) return;
    set('shopList', []);
    set('shopChecked', []);
    autoSync();
    showToast('Shopping list cleared');
  });
}

/**
 * Render the shopping list.
 */
function renderShopList() {
  const container = $('#shopList');
  const emptyEl = $('#shopEmpty');
  if (!container) return;

  const items = getRef('shopList');

  if (!items.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  const checked = getCheckedSet();

  // Clean checked set — remove items no longer in list
  const itemSet = new Set(items.map(norm));
  let needsClean = false;
  for (const c of checked) {
    if (!itemSet.has(c)) { checked.delete(c); needsClean = true; }
  }
  if (needsClean) saveChecked(checked);

  // Group items: unchecked first, then checked
  const unchecked = items.filter(i => !checked.has(norm(i)));
  const checkedItems = items.filter(i => checked.has(norm(i)));
  const ordered = [...unchecked, ...checkedItems];

  container.innerHTML = ordered.map(item => {
    const isChecked = checked.has(norm(item));
    return `
      <div class="shop-item${isChecked ? ' done' : ''}" data-shop-item="${escHTML(item)}">
        <div class="shop-check">${isChecked ? '✓' : ''}</div>
        <span>${escHTML(item)}</span>
        <button class="icon-btn" data-remove-shop="${escHTML(item)}" aria-label="Remove" style="margin-left:auto;font-size:0.8rem;opacity:0.5">&times;</button>
      </div>
    `;
  }).join('');

  // Event delegation
  container.onclick = (e) => {
    const removeBtn = e.target.closest('[data-remove-shop]');
    if (removeBtn) {
      e.stopPropagation();
      removeItem(removeBtn.dataset.removeShop);
      return;
    }

    const row = e.target.closest('.shop-item');
    if (row) toggleCheck(row.dataset.shopItem);
  };
}

/**
 * Toggle an item's checked state (persisted).
 * @param {string} item
 */
function toggleCheck(item) {
  const checked = getCheckedSet();
  const n = norm(item);
  if (checked.has(n)) {
    checked.delete(n);
  } else {
    checked.add(n);
  }
  saveChecked(checked);
}

/**
 * Remove an item from the shopping list.
 * @param {string} item
 */
function removeItem(item) {
  const current = get('shopList');
  const n = norm(item);
  const updated = current.filter(i => norm(i) !== n);
  set('shopList', updated);

  // Also remove from checked
  const checked = getCheckedSet();
  if (checked.has(n)) {
    checked.delete(n);
    saveChecked(checked);
  }

  autoSync();
}

/**
 * Add items to the shopping list (called externally).
 * @param {string[]} items
 */
export function addToShopList(items) {
  const current = get('shopList');
  const existing = new Set(current.map(norm));
  let added = 0;

  items.forEach(item => {
    const n = norm(item);
    if (n && !existing.has(n)) {
      current.push(item);
      existing.add(n);
      added++;
    }
  });

  if (added) {
    set('shopList', current);
    autoSync();
    showToast(`Added ${added} item${added > 1 ? 's' : ''} to shopping list`);
  }
}
