/**
 * Shopping — Shopping List tab component.
 *
 * Shows "Recipes to Make" queue at the top — recipes the user
 * wants to cook. Missing ingredients from those recipes auto-populate
 * the shopping list below. Users can check off recipes when done
 * and manually add/remove shopping items.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes } from '../services/matching.js';
import { escHTML, norm } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';

/** @type {Array} Full recipe list — set by initShopping */
let _recipes = [];

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
 * @param {Array} recipes - Full recipe list
 */
export function initShopping(recipes) {
  _recipes = recipes || [];

  wireControls();
  renderMakeList();
  renderShopList();

  subscribe('shopList', renderShopList);
  subscribe('shopChecked', renderShopList);
  subscribe('makelist', () => {
    renderMakeList();
    renderShopList();
  });
  subscribe('ingredients', () => {
    renderMakeList();
    renderShopList();
  });
  subscribe('staples', () => {
    renderMakeList();
    renderShopList();
  });
}

/**
 * Wire the Clear All and Send to Notes buttons.
 */
function wireControls() {
  const clearBtn = $('#clearShopBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const items = getRef('shopList');
      if (!items.length) return;
      set('shopList', []);
      set('shopChecked', []);
      autoSync();
      showToast('Shopping list cleared');
    });
  }

  const notesBtn = $('#sendToNotesBtn');
  if (notesBtn) {
    notesBtn.addEventListener('click', () => {
      const manualItems = getRef('shopList');
      const autoItems = getMakeListMissing();
      const manualSet = new Set(manualItems.map(norm));
      const combined = [...manualItems];
      autoItems.forEach(item => {
        if (!manualSet.has(norm(item))) {
          combined.push(item);
          manualSet.add(norm(item));
        }
      });

      if (!combined.length) {
        showToast('Shopping list is empty');
        return;
      }

      const checked = getCheckedSet();
      const unchecked = combined.filter(i => !checked.has(norm(i)));
      const checkedItems = combined.filter(i => checked.has(norm(i)));

      const title = 'HARVEST Shopping List';
      let body = '';
      if (unchecked.length) {
        body += unchecked.map(i => `• ${i}`).join('\n');
      }
      if (checkedItems.length) {
        body += (unchecked.length ? '\n\n' : '') + 'Done:\n' + checkedItems.map(i => `✓ ${i}`).join('\n');
      }

      // On iPhone/iPad use share sheet (which includes Notes), otherwise clipboard
      if (/iPhone|iPad|iPod/.test(navigator.userAgent) && navigator.share) {
        navigator.share({
          title,
          text: `${title}\n\n${body}`,
        }).catch(() => {});
      } else if (navigator.share) {
        navigator.share({
          title,
          text: `${title}\n\n${body}`,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${title}\n\n${body}`).then(() => {
          showToast('Shopping list copied to clipboard!');
        }).catch(() => {
          showToast('Could not copy — try manually');
        });
      }
    });
  }
}

/* ── Recipes to Make section ──────────────────────────────────── */

function renderMakeList() {
  const container = $('#makeList');
  if (!container) return;

  const makeIds = getRef('makelist');

  if (!makeIds.length) {
    container.innerHTML = '<p style="font-size:0.85rem;color:var(--muted);padding:8px 0">Tap "📌 Make This" on any recipe to add it here.</p>';
    return;
  }

  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const makeRecipes = makeIds.map(id => _recipes.find(r => r.id === id)).filter(Boolean);

  // Run matching engine to find missing ingredients
  const matched = findRecipes({
    recipes: makeRecipes,
    ingredients: ings,
    staples,
  });

  container.innerHTML = matched.map(r => {
    const missing = r.needNames || [];
    const ready = !missing.length;
    return `
      <div class="make-recipe-item${ready ? ' ready' : ''}" data-make-recipe="${r.id}">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          <span style="font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHTML(r.title)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          ${ready
            ? '<span style="font-size:0.75rem;color:var(--green);font-weight:700">✓ Ready</span>'
            : `<span style="font-size:0.72rem;color:var(--accent)">${missing.length} needed</span>`}
          <button class="icon-btn" data-remove-make="${r.id}" title="Remove" style="font-size:1rem;opacity:0.5">&times;</button>
        </div>
      </div>
      ${missing.length ? `<div style="display:flex;flex-wrap:wrap;gap:3px;padding:0 12px 8px">
        ${missing.map(m => `<span style="font-size:0.7rem;padding:2px 6px;background:var(--accent-soft);color:var(--accent);border-radius:4px">${escHTML(m)}</span>`).join('')}
      </div>` : ''}
    `;
  }).join('');

  container.onclick = (e) => {
    const removeBtn = e.target.closest('[data-remove-make]');
    if (removeBtn) {
      e.stopPropagation();
      const id = Number(removeBtn.dataset.removeMake);
      const current = get('makelist');
      set('makelist', current.filter(i => i !== id));
      autoSync();
      showToast('Removed from Make list');
      return;
    }
  };
}

/* ── Shopping List (manual + auto from make list) ─────────────── */

/**
 * Get all missing ingredients from the make list recipes.
 * @returns {string[]}
 */
function getMakeListMissing() {
  const makeIds = getRef('makelist');
  if (!makeIds.length) return [];

  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const makeRecipes = makeIds.map(id => _recipes.find(r => r.id === id)).filter(Boolean);

  if (!makeRecipes.length) return [];

  const matched = findRecipes({
    recipes: makeRecipes,
    ingredients: ings,
    staples,
  });

  const allMissing = new Set();
  matched.forEach(r => {
    if (r.needNames) r.needNames.forEach(n => allMissing.add(n));
  });
  return [...allMissing];
}

/**
 * Render the shopping list.
 */
function renderShopList() {
  const container = $('#shopList');
  const emptyEl = $('#shopEmpty');
  if (!container) return;

  // Combine manual items + auto-generated from make list
  const manualItems = getRef('shopList');
  const autoItems = getMakeListMissing();

  // Merge: manual items + auto items that aren't already manual
  const manualSet = new Set(manualItems.map(norm));
  const combined = [...manualItems];
  autoItems.forEach(item => {
    if (!manualSet.has(norm(item))) {
      combined.push(item);
      manualSet.add(norm(item));
    }
  });

  if (!combined.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  const checked = getCheckedSet();

  // Clean checked set
  const itemSet = new Set(combined.map(norm));
  let needsClean = false;
  for (const c of checked) {
    if (!itemSet.has(c)) { checked.delete(c); needsClean = true; }
  }
  if (needsClean) saveChecked(checked);

  // Group: unchecked first, then checked
  const unchecked = combined.filter(i => !checked.has(norm(i)));
  const checkedItems = combined.filter(i => checked.has(norm(i)));
  const ordered = [...unchecked, ...checkedItems];

  // Track which are auto-generated
  const autoSet = new Set(autoItems.map(norm));

  container.innerHTML = ordered.map(item => {
    const isChecked = checked.has(norm(item));
    const isAuto = autoSet.has(norm(item)) && !getRef('shopList').some(s => norm(s) === norm(item));
    return `
      <div class="shop-item${isChecked ? ' done' : ''}" data-shop-item="${escHTML(item)}">
        <div class="shop-check">${isChecked ? '✓' : ''}</div>
        <span>${escHTML(item)}${isAuto ? ' <span style="font-size:0.65rem;color:var(--muted)">(from recipes)</span>' : ''}</span>
        <button class="icon-btn" data-remove-shop="${escHTML(item)}" aria-label="Remove" style="margin-left:auto;font-size:0.8rem;opacity:0.5">&times;</button>
      </div>
    `;
  }).join('');

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

function removeItem(item) {
  const current = get('shopList');
  const n = norm(item);
  const updated = current.filter(i => norm(i) !== n);
  set('shopList', updated);

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
