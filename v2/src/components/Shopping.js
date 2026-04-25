/**
 * Shopping — Shopping List tab component.
 *
 * Clean grocery list: each recipe you want to make appears as a card
 * showing its missing ingredients with checkboxes. Share buttons use
 * the Web Share API (iOS share sheet) with clipboard fallback.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes } from '../services/matching.js';
import { escHTML, norm } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';
import { openDetail } from './RecipeDetail.js';
import { GF_SWAPS } from '../data/aliases.js';

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

  wireTopControls();
  renderShopTab();

  subscribe('shopList', renderShopTab);
  subscribe('shopChecked', renderShopTab);
  subscribe('shopRecipes', renderShopTab);
  subscribe('ingredients', renderShopTab);
  subscribe('staples', renderShopTab);
}

/**
 * Wire the top-level Clear All and Send All to Notes buttons.
 */
function wireTopControls() {
  const clearBtn = $('#clearShopBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const shopIds = getRef('shopRecipes');
      if (!shopIds.length) return;
      set('shopRecipes', []);
      set('shopChecked', []);
      autoSync();
      showToast('Shopping List cleared');
    });
  }

  const shareBtn = $('#shareShopBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      _shareAll();
    });
  }
}

/**
 * Share all recipes + manual items to Notes / clipboard.
 */
function _shareAll() {
  const { recipeCards } = _buildShopData();

  if (!recipeCards.length) {
    showToast('Shopping List is empty');
    return;
  }

  const checked = getCheckedSet();
  const title = 'HARVEST Shopping List';
  const sections = [];

  recipeCards.forEach(({ title: rTitle, missing }) => {
    const unchecked = missing.filter(i => !checked.has(norm(i)));
    const done = missing.filter(i => checked.has(norm(i)));
    let s = `🍽 ${rTitle}`;
    if (unchecked.length) s += '\n' + unchecked.map(i => `  • ${i}`).join('\n');
    if (done.length) s += '\n' + done.map(i => `  ✓ ${i}`).join('\n');
    sections.push(s);
  });

  const body = sections.join('\n\n');

  if (navigator.share) {
    navigator.share({ title, text: `${title}\n\n${body}` }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${title}\n\n${body}`).then(() => {
      showToast('Shopping List copied to clipboard!');
    }).catch(() => {
      showToast('Could not copy — try manually');
    });
  }
}

/**
 * Share a single recipe's ingredients to Notes / clipboard.
 */
function _shareSingleRecipe(recipeTitle, missing) {
  if (!missing.length) {
    showToast('All ingredients ready!');
    return;
  }

  const checked = getCheckedSet();
  const unchecked = missing.filter(i => !checked.has(norm(i)));
  const done = missing.filter(i => checked.has(norm(i)));

  let body = `🍽 ${recipeTitle}`;
  if (unchecked.length) body += '\n' + unchecked.map(i => `• ${i}`).join('\n');
  if (done.length) body += '\n' + done.map(i => `✓ ${i}`).join('\n');

  const title = `Shop for ${recipeTitle}`;

  if (navigator.share) {
    navigator.share({ title, text: body }).catch(() => {});
  } else {
    navigator.clipboard.writeText(body).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      showToast('Could not copy — try manually');
    });
  }
}

/* ── GF substitution ─────────────────────────────────────────── */

/**
 * Replace a gluten ingredient with its GF substitute for the shopping list.
 * E.g. "all-purpose flour" → "gluten-free flour", "soy sauce" → "tamari"
 */
function _applyGfSwap(ingredient) {
  const n = norm(ingredient);
  for (const [glutenItem, gfItem] of Object.entries(GF_SWAPS)) {
    if (norm(glutenItem) === n) return gfItem;
  }
  return ingredient;
}

/* ── Data helpers ─────────────────────────────────────────────── */

/**
 * Build the full shopping data: recipe cards + manual items.
 */
function _buildShopData() {
  const shopIds = getRef('shopRecipes');
  const manualItems = getRef('shopList');
  const ings = getRef('ingredients');
  const staples = getRef('staples');

  let recipeCards = [];

  if (shopIds.length) {
    const makeRecipes = shopIds.map(id => _recipes.find(r => r.id === id)).filter(Boolean);
    if (makeRecipes.length) {
      const matched = findRecipes({
        recipes: makeRecipes,
        ingredients: ings,
        staples,
      });

      recipeCards = matched.map(r => ({
        id: r.id,
        title: r.title,
        missing: r.needNames ? r.needNames.map(_applyGfSwap) : [],
        totalIngs: r.ing ? r.ing.length : 0,
        haveCount: r.ing ? r.ing.length - (r.needNames ? r.needNames.length : 0) : 0,
      }));
    }
  }

  return { recipeCards, manualItems: manualItems.map(_applyGfSwap) };
}

/* ── Main render ─────────────────────────────────────────────── */

function renderShopTab() {
  const container = $('#shopList');
  const emptyEl = $('#shopEmpty');
  const makeContainer = $('#makeList');
  if (!container) return;

  // Hide the old makeList container — we're merging everything into shopList
  if (makeContainer) makeContainer.innerHTML = '';

  const { recipeCards } = _buildShopData();
  const checked = getCheckedSet();
  // Clean checked set
  const allNorms = new Set();
  recipeCards.forEach(r => r.missing.forEach(m => allNorms.add(norm(m))));
  let needsClean = false;
  for (const c of checked) {
    if (!allNorms.has(c)) { checked.delete(c); needsClean = true; }
  }
  if (needsClean) saveChecked(checked);

  if (!recipeCards.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  let html = '';

  // ── Recipe cards ──
  recipeCards.forEach(({ id, title, missing, totalIngs, haveCount }) => {
    const ready = !missing.length;
    const allChecked = missing.length > 0 && missing.every(i => checked.has(norm(i)));

    html += `<div class="shop-recipe-card${ready ? ' ready' : ''}${allChecked ? ' all-checked' : ''}" data-shop-recipe="${id}">
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <a class="shop-recipe-title" href="#" data-open-recipe="${id}">${escHTML(title)}</a>
          <div class="shop-recipe-actions">
            ${!ready ? `<button class="icon-btn" data-share-recipe="${id}" title="Share">📤</button>` : ''}
            <button class="icon-btn shop-recipe-delete-btn" data-delete-recipe="${id}" title="Remove recipe">&times;</button>
          </div>
        </div>
        <div class="shop-recipe-meta">
          ${ready
            ? '<span class="shop-recipe-ready">✓ You have everything!</span>'
            : `<span class="shop-recipe-count">${missing.length} ingredient${missing.length !== 1 ? 's' : ''} needed</span>`
          }
        </div>
      </div>
      ${missing.length ? `<div class="shop-recipe-items">
        ${missing.map(item => {
          const isChecked = checked.has(norm(item));
          return `<div class="shop-item${isChecked ? ' done' : ''}" data-shop-item="${escHTML(item)}">
            <div class="shop-check">${isChecked ? '✓' : ''}</div>
            <span>${escHTML(item)}</span>
          </div>`;
        }).join('')}
      </div>` : ''}
    </div>`;
  });

  // ── Empty make list prompt ──
  if (!recipeCards.length) {
    html += '<p style="font-size:0.85rem;color:var(--muted);padding:8px 0;text-align:center">Add recipes to 📌 My Queue, then tap 🛒 to send them here.</p>';
  }

  container.innerHTML = html;

  // ── Event delegation ──
  container.onclick = (e) => {
    // Recipe title link → open detail
    const titleLink = e.target.closest('[data-open-recipe]');
    if (titleLink) {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(titleLink.dataset.openRecipe);
      openDetail(id);
      return;
    }

    // Delete recipe from shopping list
    const deleteBtn = e.target.closest('[data-delete-recipe]');
    if (deleteBtn) {
      e.stopPropagation();
      const id = Number(deleteBtn.dataset.deleteRecipe);
      const current = get('shopRecipes');
      set('shopRecipes', current.filter(i => i !== id));
      autoSync();
      showToast('Removed from list');
      return;
    }

    // Share single recipe's shopping list
    const shareBtn = e.target.closest('[data-share-recipe]');
    if (shareBtn) {
      e.stopPropagation();
      const id = Number(shareBtn.dataset.shareRecipe);
      const card = recipeCards.find(r => r.id === id);
      if (card) _shareSingleRecipe(card.title, card.missing);
      return;
    }

    // Toggle check on ingredient
    const row = e.target.closest('.shop-item');
    if (row) _toggleCheck(row.dataset.shopItem);
  };
}

function _toggleCheck(item) {
  const checked = getCheckedSet();
  const n = norm(item);
  if (checked.has(n)) {
    checked.delete(n);
  } else {
    checked.add(n);
  }
  saveChecked(checked);
}

function _removeManualItem(item) {
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
