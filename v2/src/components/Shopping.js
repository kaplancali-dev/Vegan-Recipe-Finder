/**
 * Shopping — Shopping List tab component.
 *
 * Renders the shopping list with check/uncheck items,
 * clear all functionality, and auto-persistence.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { escHTML, norm } from '../utils/text.js';
import { showToast } from '../utils/toast.js';

const $ = (sel) => document.querySelector(sel);

/** Track checked (purchased) items locally — stored as part of shopList state */
let _checked = new Set();

/**
 * Initialize the Shopping List tab.
 */
export function initShopping() {
  wireControls();
  renderShopList();

  subscribe('shopList', renderShopList);
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
    _checked.clear();
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

  // Clean checked set — remove items no longer in list
  const itemSet = new Set(items.map(norm));
  for (const c of _checked) {
    if (!itemSet.has(c)) _checked.delete(c);
  }

  // Group items: unchecked first, then checked
  const unchecked = items.filter(i => !_checked.has(norm(i)));
  const checked = items.filter(i => _checked.has(norm(i)));
  const ordered = [...unchecked, ...checked];

  container.innerHTML = ordered.map(item => {
    const isChecked = _checked.has(norm(item));
    return `
      <div class="shop-item${isChecked ? ' done' : ''}" data-shop-item="${escHTML(item)}">
        <div class="shop-check">${isChecked ? '��' : ''}</div>
        <span>${escHTML(item)}</span>
        <button class="icon-btn" data-remove-shop="${escHTML(item)}" aria-label="Remove" style="margin-left:auto;font-size:0.8rem;opacity:0.5">&times;</button>
      </div>
    `;
  }).join('');

  // Event delegation
  container.onclick = (e) => {
    // Remove button
    const removeBtn = e.target.closest('[data-remove-shop]');
    if (removeBtn) {
      e.stopPropagation();
      const item = removeBtn.dataset.removeShop;
      removeItem(item);
      return;
    }

    // Toggle check
    const row = e.target.closest('.shop-item');
    if (row) {
      const item = row.dataset.shopItem;
      toggleCheck(item);
    }
  };
}

/**
 * Toggle an item's checked state.
 * @param {string} item
 */
function toggleCheck(item) {
  const n = norm(item);
  if (_checked.has(n)) {
    _checked.delete(n);
  } else {
    _checked.add(n);
  }
  renderShopList();
}

/**
 * Remove an item from the shopping list.
 * @param {string} item
 */
function removeItem(item) {
  const current = get('shopList');
  const n = norm(item);
  const updated = current.filter(i => norm(i) !== n);
  _checked.delete(n);
  set('shopList', updated);
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
