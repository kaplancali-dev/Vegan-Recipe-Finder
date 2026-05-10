/**
 * Shopping — Shopping List tab component.
 *
 * Clean grocery list: each recipe you want to make appears as a card
 * showing its missing ingredients with checkboxes. Share buttons use
 * the Web Share API (iOS share sheet) with clipboard fallback.
 */

import { get, set, subscribe, subscribeForTab, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes } from '../services/matching.js';
import { escHTML, norm, applyGfSwap } from '../utils/text.js';
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

  // PERF: defer render when Shopping tab not visible
  subscribeForTab(['shopList','shopChecked','shopRecipes','ingredients','staples'], 'shopping', renderShopTab);
}

/**
 * Wire the top-level Clear All and Send All to Notes buttons.
 */
function wireTopControls() {
  const clearBtn = $('#clearShopBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const shopIds = getRef('shopRecipes');
      const manualList = getRef('shopList');
      if (!shopIds.length && !manualList.length) return;
      set('shopRecipes', []);
      set('shopList', []);
      set('shopChecked', []);
      autoSync();
      showToast('Clean slate — list wiped');
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
  const { recipeCards, manualItems } = _buildShopData();

  if (!recipeCards.length && !manualItems.length) {
    showToast('Nothing to share yet — queue some recipes first');
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
    let s = '🛒 Additional Items';
    if (unchecked.length) s += '\n' + unchecked.map(i => `  • ${i}`).join('\n');
    if (done.length) s += '\n' + done.map(i => `  ✓ ${i}`).join('\n');
    sections.push(s);
  }

  const body = sections.join('\n\n');

  if (navigator.share) {
    navigator.share({ title, text: `${title}\n\n${body}` }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${title}\n\n${body}`).then(() => {
      showToast("Copied — send it to whoever's driving");
    }).catch(() => {
      showToast('Clipboard said no — try again');
    });
  }
}

/**
 * Share a single recipe's ingredients to Notes / clipboard.
 */
function _shareSingleRecipe(recipeTitle, missing) {
  if (!missing.length) {
    showToast('You already have everything — go cook!');
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
      showToast('Copied — go get the goods');
    }).catch(() => {
      showToast('Clipboard said no — try again');
    });
  }
}

/**
 * Share manual (non-recipe) shopping items.
 */
function _shareManualItems(items) {
  if (!items.length) return;
  const checked = getCheckedSet();
  const unchecked = items.filter(i => !checked.has(norm(i)));
  const done = items.filter(i => checked.has(norm(i)));

  let body = '🛒 Additional Items';
  if (unchecked.length) body += '\n' + unchecked.map(i => `• ${i}`).join('\n');
  if (done.length) body += '\n' + done.map(i => `✓ ${i}`).join('\n');

  if (navigator.share) {
    navigator.share({ title: 'Shopping List', text: body }).catch(() => {});
  } else {
    navigator.clipboard.writeText(body).then(() => {
      showToast('Copied — go get the goods');
    }).catch(() => {
      showToast('Clipboard said no — try again');
    });
  }
}

/* ── GF substitution (shared helper) ────────────────────────── */

function _applyGfSwap(ingredient) {
  return applyGfSwap(ingredient, GF_SWAPS);
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
  // Build a set of every ingredient that's already covered by a recipe
  // section, so we can dedupe the manual list against it. This catches
  // legacy entries left in shopList from before the shopAndQueue fix that
  // was double-writing ingredients into both shopRecipes and shopList.
  const coveredByRecipe = new Set();

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

      // Add every recipe ingredient (raw and GF-swapped form) to the dedupe set
      matched.forEach(r => {
        (r.needNames || []).forEach(n => {
          coveredByRecipe.add(n);
          coveredByRecipe.add(_applyGfSwap(n));
        });
        (r.ing || []).forEach(n => coveredByRecipe.add(n));
      });
    }
  }

  // Filter manualItems to drop anything already in a recipe section
  const dedupedManualItems = manualItems
    .filter(item => !coveredByRecipe.has(item))
    .map(_applyGfSwap);

  return { recipeCards, manualItems: dedupedManualItems };
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
  // Clean checked set
  const allNorms = new Set();
  recipeCards.forEach(r => r.missing.forEach(m => allNorms.add(norm(m))));
  manualItems.forEach(m => allNorms.add(norm(m)));
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

  // ── Manual items (added individually from recipe detail) ──
  if (manualItems.length) {
    const uncheckedManual = manualItems.filter(i => !checked.has(norm(i)));
    const checkedManual = manualItems.filter(i => checked.has(norm(i)));
    const allManualChecked = manualItems.length > 0 && uncheckedManual.length === 0;

    html += `<div class="shop-recipe-card${allManualChecked ? ' all-checked' : ''}" data-shop-manual>
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <span class="shop-recipe-title" style="cursor:default">Additional Items</span>
          <div class="shop-recipe-actions">
            <button class="icon-btn" data-share-manual title="Share">📤</button>
            <button class="icon-btn shop-recipe-delete-btn" data-clear-manual title="Clear all">&times;</button>
          </div>
        </div>
        <div class="shop-recipe-meta">
          <span class="shop-recipe-count">${manualItems.length} item${manualItems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="shop-recipe-items">
        ${manualItems.map(item => {
          const isChecked = checked.has(norm(item));
          return `<div class="shop-item${isChecked ? ' done' : ''}" data-shop-item="${escHTML(item)}">
            <div class="shop-check">${isChecked ? '✓' : ''}</div>
            <span>${escHTML(item)}</span>
            <button class="icon-btn shop-manual-remove" data-remove-manual="${escHTML(item)}" title="Remove" style="margin-left:auto;font-size:0.75rem">&times;</button>
          </div>`;
        }).join('')}
      </div>
    </div>`;
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

    // Delete recipe from shopping list — removes BOTH the recipe section
    // AND that recipe's missing ingredients from the shopping list.
    // (Without removing the ingredients, they'd silently move to "Additional
    // Items" and look like they came back on refresh.)
    const deleteBtn = e.target.closest('[data-delete-recipe]');
    if (deleteBtn) {
      e.stopPropagation();
      const id = Number(deleteBtn.dataset.deleteRecipe);
      // Find this recipe's missing-ingredient strings to remove from shopList
      const card = recipeCards.find(r => r.id === id);
      const ingsToRemove = new Set(card ? card.missing : []);
      // Also include the un-GF-swapped raw versions in case shopList stored them
      const recipe = _recipes.find(r => r.id === id);
      if (recipe && recipe.ing) {
        recipe.ing.forEach(rawIng => ingsToRemove.add(rawIng));
      }
      // Update shopRecipes
      const currentRecipes = get('shopRecipes');
      set('shopRecipes', currentRecipes.filter(i => i !== id));
      // Update shopList — remove any ingredient that belonged to this recipe
      const currentShop = get('shopList') || [];
      set('shopList', currentShop.filter(ing => !ingsToRemove.has(ing)));
      autoSync();
      showToast('Off the list — one less thing');
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

    // Remove single manual item
    const removeManualBtn = e.target.closest('[data-remove-manual]');
    if (removeManualBtn) {
      e.stopPropagation();
      _removeManualItem(removeManualBtn.dataset.removeManual);
      return;
    }

    // Clear all manual items
    const clearManualBtn = e.target.closest('[data-clear-manual]');
    if (clearManualBtn) {
      e.stopPropagation();
      set('shopList', []);
      autoSync();
      showToast('Extra items cleared');
      return;
    }

    // Share manual items
    const shareManualBtn = e.target.closest('[data-share-manual]');
    if (shareManualBtn) {
      e.stopPropagation();
      _shareManualItems(manualItems);
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
    showToast(`${added} item${added > 1 ? 's' : ''} added — happy shopping`);
  }
}
