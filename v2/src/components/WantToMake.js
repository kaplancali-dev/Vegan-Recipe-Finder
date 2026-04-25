/**
 * WantToMake — "Want to Make" tab component.
 *
 * Planning hub: shows all recipes marked "Want to Make", with:
 * - Missing ingredient count + checkbox to send to Shopping
 * - Star rating, date cooked, would-make-again toggle
 * - Favorite heart toggle
 * - Share button (Web Share API)
 * - Cooking History section at bottom
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

/** @type {Array} Full recipe list */
let _recipes = [];

/**
 * Initialize the Want to Make tab.
 * @param {Array} recipes - Full recipe list
 */
export function initWantToMake(recipes) {
  _recipes = recipes || [];

  renderWantToMake();
  wireEvents();

  subscribe('makelist', renderWantToMake);
  subscribe('ingredients', renderWantToMake);
  subscribe('staples', renderWantToMake);
  subscribe('favorites', renderWantToMake);
  subscribe('cookHistory', renderWantToMake);
}

/* ── GF substitution ─────────────────────────────────────────── */

function _applyGfSwap(ingredient) {
  const n = norm(ingredient);
  for (const [glutenItem, gfItem] of Object.entries(GF_SWAPS)) {
    if (norm(glutenItem) === n) return gfItem;
  }
  return ingredient;
}

/* ── Share helper ────────────────────────────────────────────── */

function _shareRecipe(recipe, missing) {
  let body = `📌 ${recipe.title}`;
  if (missing.length) {
    body += `\n\nMissing ingredients:\n` + missing.map(i => `• ${i}`).join('\n');
  } else {
    body += `\n\n✓ You have everything!`;
  }

  const title = recipe.title;

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

/* ── Data building ───────────────────────────────────────────── */

function _buildData() {
  const makeIds = getRef('makelist');
  const ings = getRef('ingredients');
  const staples = getRef('staples');

  if (!makeIds.length) return [];

  const makeRecipes = makeIds.map(id => _recipes.find(r => r.id === id)).filter(Boolean);
  if (!makeRecipes.length) return [];

  const matched = findRecipes({
    recipes: makeRecipes,
    ingredients: ings,
    staples,
  });

  return matched.map(r => ({
    id: r.id,
    title: r.title,
    img: r.img || '',
    url: r.url || '',
    missing: r.needNames ? r.needNames.map(_applyGfSwap) : [],
    totalIngs: r.ing ? r.ing.length : 0,
    haveCount: r.ing ? r.ing.length - (r.needNames ? r.needNames.length : 0) : 0,
  }));
}

/* ── Main render ─────────────────────────────────────────────── */

function renderWantToMake() {
  const container = $('#wantMakeList');
  const emptyEl = $('#wantMakeEmpty');
  const historySection = $('#cookHistorySection');
  if (!container) return;

  const cards = _buildData();
  const favSet = new Set(getRef('favorites'));
  const history = getRef('cookHistory');
  const makeIds = getRef('makelist');

  // ── Render the Want to Make list ──
  if (!cards.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.hidden = !makeIds.length ? false : true;
  } else {
    if (emptyEl) emptyEl.hidden = true;

    let html = '';
    cards.forEach(({ id, title, img, missing }) => {
      const isFav = favSet.has(id);
      const ready = !missing.length;

      // Get cook history for this recipe
      const cooks = history.filter(h => h.id === id);
      const lastCook = cooks.length ? cooks[cooks.length - 1] : null;
      const lastDate = lastCook
        ? new Date(lastCook.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : null;
      const lastRating = lastCook ? lastCook.rating || 0 : 0;
      const wouldAgain = lastCook ? lastCook.wouldMakeAgain : undefined;

      html += `<div class="wm-card" data-wm-recipe="${id}">
        <div class="wm-card-top">
          ${img ? `<img class="wm-card-img" src="${escHTML(img)}" alt="" loading="lazy">` : ''}
          <div class="wm-card-info">
            <a class="wm-card-title" href="#" data-open-recipe="${id}">${escHTML(title)}</a>
            <div class="wm-card-status">
              ${ready
                ? '<span class="wm-ready">✓ You have everything!</span>'
                : `<span class="wm-missing">${missing.length} ingredient${missing.length !== 1 ? 's' : ''} needed</span>`
              }
            </div>
            ${lastDate ? `<div class="wm-card-cooked">
              Last made: ${lastDate}
              ${lastRating ? ' · ' + '★'.repeat(lastRating) + '☆'.repeat(5 - lastRating) : ''}
              ${wouldAgain === true ? ' · <span class="wm-again-yes">Would make again ✓</span>' : ''}
              ${wouldAgain === false ? ' · <span class="wm-again-no">Won\'t make again</span>' : ''}
            </div>` : ''}
          </div>
        </div>
        <div class="wm-card-actions">
          <button class="btn btn-sm wm-btn-fav${isFav ? ' wm-fav-on' : ''}" data-wm-fav="${id}" title="${isFav ? 'Unfavorite' : 'Favorite'}">
            ${isFav ? '❤️' : '🤍'} ${isFav ? 'Favorited' : 'Favorite'}
          </button>
          <button class="btn btn-sm" data-wm-cook="${id}" title="I Made This">🍳 I Made This</button>
          <button class="btn btn-sm" data-wm-share="${id}" title="Share">📤 Share</button>
          ${!ready
            ? `<button class="btn btn-sm btn-green" data-wm-shop="${id}" title="Send to Shopping">🛒 Shop</button>`
            : ''
          }
          <button class="icon-btn" data-wm-remove="${id}" title="Remove">&times;</button>
        </div>
      </div>`;
    });

    container.innerHTML = html;
  }

  // ── Render Cooking History ──
  renderCookHistory(historySection, history);
}

/* ── Cooking History ─────────────────────────────────────────── */

function renderCookHistory(section, history) {
  const list = $('#cookHistoryList');
  if (!section || !list) return;

  if (!history.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  // Deduplicate: keep only newest per recipe
  const seen = new Map();
  [...history].reverse().forEach(h => {
    if (!seen.has(h.id)) seen.set(h.id, h);
  });
  const unique = [...seen.values()].slice(0, 30);

  let html = `<div class="wm-history-table">
    <div class="wm-history-header">
      <span>Recipe</span>
      <span>Rating</span>
      <span>Date</span>
      <span>Again?</span>
      <span></span>
    </div>`;

  unique.forEach(({ id, date, rating, wouldMakeAgain }) => {
    const recipe = _recipes.find(r => r.id === id);
    if (!recipe) return;
    const dateStr = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const stars = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—';
    const again = wouldMakeAgain === true ? '✓ Yes'
      : wouldMakeAgain === false ? '✗ No'
      : '—';

    html += `<div class="wm-history-row" data-history-id="${id}">
      <a class="wm-history-name" href="#" data-open-recipe="${id}">${escHTML(recipe.title)}</a>
      <span class="wm-history-stars">${stars}</span>
      <span class="wm-history-date">${dateStr}</span>
      <span class="wm-history-again">${again}</span>
      <button class="icon-btn wm-history-del" data-del-history="${id}" title="Delete">&times;</button>
    </div>`;
  });

  html += '</div>';
  list.innerHTML = html;
}

/* ── Event wiring ────────────────────────────────────────────── */

function wireEvents() {
  const panel = $('#tab-wantmake');
  if (!panel) return;

  panel.addEventListener('click', (e) => {
    const t = e.target;

    // Open recipe detail
    const openLink = t.closest('[data-open-recipe]');
    if (openLink) {
      e.preventDefault();
      const id = Number(openLink.dataset.openRecipe);
      const recipe = _recipes.find(r => r.id === id);
      if (recipe) openDetail(recipe);
      return;
    }

    // Toggle favorite
    const favBtn = t.closest('[data-wm-fav]');
    if (favBtn) {
      toggleFavorite(Number(favBtn.dataset.wmFav));
      return;
    }

    // I Made This
    const cookBtn = t.closest('[data-wm-cook]');
    if (cookBtn) {
      const id = Number(cookBtn.dataset.wmCook);
      handleCookWithAgain(id);
      return;
    }

    // Share
    const shareBtn = t.closest('[data-wm-share]');
    if (shareBtn) {
      const id = Number(shareBtn.dataset.wmShare);
      const recipe = _recipes.find(r => r.id === id);
      const cards = _buildData();
      const card = cards.find(c => c.id === id);
      if (recipe) _shareRecipe(recipe, card ? card.missing : []);
      return;
    }

    // Send to Shopping (already on makelist, this is a visual confirmation)
    const shopBtn = t.closest('[data-wm-shop]');
    if (shopBtn) {
      showToast('Already on your Shopping List! Switch to 🛒 Shopping tab.');
      return;
    }

    // Remove from Want to Make
    const removeBtn = t.closest('[data-wm-remove]');
    if (removeBtn) {
      const id = Number(removeBtn.dataset.wmRemove);
      const current = get('makelist');
      set('makelist', current.filter(i => i !== id));
      autoSync();
      showToast('Removed from Want to Make');
      return;
    }

    // Delete cook history entry
    const delBtn = t.closest('[data-del-history]');
    if (delBtn) {
      const id = Number(delBtn.dataset.delHistory);
      const hist = get('cookHistory');
      set('cookHistory', hist.filter(h => h.id !== id));
      autoSync();
      showToast('Cook history entry removed');
      return;
    }
  });
}

/* ── Enhanced cook handler with "Would make again?" ──────────── */

async function handleCookWithAgain(id) {
  // Use the standard cook flow first
  await handleCook(id);

  // After cooking, ask "Would you make this again?"
  const history = get('cookHistory');
  const lastEntry = [...history].reverse().find(h => h.id === id);
  if (!lastEntry) return; // User cancelled

  // Small delay so the rating toast clears
  await new Promise(r => setTimeout(r, 400));

  const again = await showWouldMakeAgain();
  if (again !== null) {
    const fresh = get('cookHistory');
    const idx = fresh.findLastIndex(h => h.id === id);
    if (idx !== -1) {
      fresh[idx].wouldMakeAgain = again;
      set('cookHistory', fresh);
      autoSync();
    }
  }
}

/**
 * Show a simple "Would you make this again?" dialog.
 * @returns {Promise<boolean|null>} true = yes, false = no, null = dismissed
 */
function showWouldMakeAgain() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;text-align:center;padding:24px">
        <p style="font-size:1rem;font-weight:600;margin-bottom:16px">Would you make this again?</p>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-green" data-again="yes" style="min-width:80px">👍 Yes</button>
          <button class="btn btn-outline" data-again="no" style="min-width:80px">👎 No</button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-again]');
      if (btn) {
        overlay.remove();
        resolve(btn.dataset.again === 'yes');
        return;
      }
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    });

    document.body.appendChild(overlay);
  });
}
