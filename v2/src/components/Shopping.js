/**
 * Shopping — Shopping List tab component.
 *
 * Recipe-centric shopping: each recipe you want to make appears as a card
 * showing its missing ingredients with checkboxes. Each card has its own
 * "Send to Notes" button and a delete button. The top-level "Notes" button
 * exports everything grouped by recipe.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes } from '../services/matching.js';
import { escHTML, norm } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { handleCook } from '../actions/cook.js';
import { $ } from '../utils/dom.js';
import { toggleFavorite } from '../actions/favorites.js';
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
  subscribe('makelist', renderShopTab);
  subscribe('ingredients', renderShopTab);
  subscribe('staples', renderShopTab);
  subscribe('favorites', renderShopTab);
}

/**
 * Wire the top-level Clear All and Send All to Notes buttons.
 */
function wireTopControls() {
  const clearBtn = $('#clearShopBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const makeIds = getRef('makelist');
      const manualItems = getRef('shopList');
      if (!makeIds.length && !manualItems.length) return;
      set('makelist', []);
      set('shopList', []);
      set('shopChecked', []);
      autoSync();
      showToast('Shopping list cleared');
    });
  }

  const notesBtn = $('#sendToNotesBtn');
  if (notesBtn) {
    notesBtn.addEventListener('click', () => {
      _shareAll();
    });
  }
}

/**
 * Share all recipes + manual items to Notes / clipboard.
 */
function _shareAll() {
  const { recipeCards, manualItems } = _buildShopData();

  if (!recipeCards.length && !manualItems.length) {
    showToast('Shopping list is empty');
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

  if (manualItems.length) {
    const unchecked = manualItems.filter(i => !checked.has(norm(i)));
    const done = manualItems.filter(i => checked.has(norm(i)));
    let s = recipeCards.length ? '📝 Other Items' : '📝 Shopping List';
    if (unchecked.length) s += '\n' + unchecked.map(i => `  • ${i}`).join('\n');
    if (done.length) s += '\n' + done.map(i => `  ✓ ${i}`).join('\n');
    sections.push(s);
  }

  const body = sections.join('\n\n');

  if (navigator.share) {
    navigator.share({ title, text: `${title}\n\n${body}` }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${title}\n\n${body}`).then(() => {
      showToast('Shopping list copied to clipboard!');
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
  const makeIds = getRef('makelist');
  const manualItems = getRef('shopList');
  const ings = getRef('ingredients');
  const staples = getRef('staples');

  let recipeCards = [];

  if (makeIds.length) {
    const makeRecipes = makeIds.map(id => _recipes.find(r => r.id === id)).filter(Boolean);
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

  const { recipeCards, manualItems } = _buildShopData();
  const checked = getCheckedSet();
  const favSet = new Set(getRef('favorites'));

  // Clean checked set
  const allNorms = new Set(manualItems.map(norm));
  recipeCards.forEach(r => r.missing.forEach(m => allNorms.add(norm(m))));
  let needsClean = false;
  for (const c of checked) {
    if (!allNorms.has(c)) { checked.delete(c); needsClean = true; }
  }
  if (needsClean) saveChecked(checked);

  if (!recipeCards.length && !manualItems.length) {
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
    const isFav = favSet.has(id);

    html += `<div class="shop-recipe-card${ready ? ' ready' : ''}${allChecked ? ' all-checked' : ''}" data-shop-recipe="${id}">
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <a class="shop-recipe-title" href="#" data-open-recipe="${id}">${escHTML(title)}</a>
          <div class="shop-recipe-actions">
            ${!isFav ? `<button class="btn btn-sm shop-recipe-fav-btn" data-fav-recipe="${id}" title="Favorite">🤍 Favorite</button>` : ''}
            <button class="btn btn-sm shop-recipe-cook-btn" data-cook-recipe="${id}" title="I Made This">🍳 I Made This</button>
            ${!ready ? `<button class="icon-btn shop-recipe-notes-btn" data-notes-recipe="${id}" title="Send to Notes">📝</button>` : ''}
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

  // ── Manual items ──
  if (manualItems.length) {
    html += `<div class="shop-recipe-card manual">
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <span class="shop-recipe-title">${recipeCards.length ? 'Other Items' : 'Shopping List'}</span>
        </div>
      </div>
      <div class="shop-recipe-items">
        ${manualItems.map(item => {
          const isChecked = checked.has(norm(item));
          return `<div class="shop-item${isChecked ? ' done' : ''}" data-shop-item="${escHTML(item)}">
            <div class="shop-check">${isChecked ? '✓' : ''}</div>
            <span>${escHTML(item)}</span>
            <button class="icon-btn" data-remove-shop="${escHTML(item)}" aria-label="Remove" style="margin-left:auto;font-size:0.8rem;opacity:0.5">&times;</button>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ── Empty make list prompt ──
  if (!recipeCards.length && !manualItems.length) {
    html += '<p style="font-size:0.85rem;color:var(--muted);padding:8px 0;text-align:center">Tap "📌 Make This" on any recipe to start building your shopping list.</p>';
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

    // Favorite button
    const favBtn = e.target.closest('[data-fav-recipe]');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.favRecipe);
      toggleFavorite(id);
      return;
    }

    // "I Made This" — rate, log cook history, remove from make list
    const cookBtn = e.target.closest('[data-cook-recipe]');
    if (cookBtn) {
      e.stopPropagation();
      handleCook(Number(cookBtn.dataset.cookRecipe), { removeFromMakelist: true });
      return;
    }

    // Delete recipe from make list
    const deleteBtn = e.target.closest('[data-delete-recipe]');
    if (deleteBtn) {
      e.stopPropagation();
      const id = Number(deleteBtn.dataset.deleteRecipe);
      const current = get('makelist');
      set('makelist', current.filter(i => i !== id));
      autoSync();
      showToast('Removed from list');
      return;
    }

    // Send single recipe to Notes
    const notesBtn = e.target.closest('[data-notes-recipe]');
    if (notesBtn) {
      e.stopPropagation();
      const id = Number(notesBtn.dataset.notesRecipe);
      const card = recipeCards.find(r => r.id === id);
      if (card) _shareSingleRecipe(card.title, card.missing);
      return;
    }

    // Remove manual item
    const removeBtn = e.target.closest('[data-remove-shop]');
    if (removeBtn) {
      e.stopPropagation();
      _removeManualItem(removeBtn.dataset.removeShop);
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
