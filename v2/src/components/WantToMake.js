/**
 * WantToMake — "Want to Make" tab component.
 *
 * Planning hub with two sub-tabs:
 *   1. Recipes — compact one-line cards with actions
 *   2. History — cooking log with ratings, dates, would-make-again
 *
 * Shopping flow: "Shop" button explicitly sends a recipe to the
 * Shopping tab (shopRecipes state). Recipes are NOT auto-added.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes } from '../services/matching.js';
import { escHTML, norm, applyGfSwap } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { handleCook } from '../actions/cook.js';
import { $ } from '../utils/dom.js';
import { toggleFavorite } from '../actions/favorites.js';
import { openDetail } from './RecipeDetail.js';
import { GF_SWAPS } from '../data/aliases.js';

/** @type {Array} Full recipe list */
let _recipes = [];

/** Which sub-tab is active: 'recipes' | 'history' */
let _activeSubTab = 'recipes';

/** History sort state */
let _sortCol = 'date';   // 'recipe' | 'rating' | 'date' | 'again'
let _sortAsc = false;     // default: newest first

/**
 * Initialize the Want to Make tab.
 * @param {Array} recipes - Full recipe list
 */
export function initWantToMake(recipes) {
  _recipes = recipes || [];

  renderWantToMake();
  wireEvents();

  subscribe('makelist', renderWantToMake);
  subscribe('shopRecipes', renderWantToMake);
  subscribe('ingredients', renderWantToMake);
  subscribe('staples', renderWantToMake);
  subscribe('favorites', renderWantToMake);
  subscribe('cookHistory', renderWantToMake);
}

/* ── GF substitution (shared helper) ────────────────────────── */

function _applyGfSwap(ingredient) {
  return applyGfSwap(ingredient, GF_SWAPS);
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
  const historyContainer = $('#wmHistoryList');
  if (!container) return;

  const cards = _buildData();
  const favSet = new Set(getRef('favorites'));
  const shopSet = new Set(getRef('shopRecipes'));
  const history = getRef('cookHistory');
  const makeIds = getRef('makelist');

  // ── Sub-tab buttons ──
  const subTabBar = $('#wmSubTabs');
  if (subTabBar) {
    subTabBar.querySelectorAll('.wm-subtab').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.wmSub === _activeSubTab);
    });
  }

  // ── Recipes sub-tab ──
  if (_activeSubTab === 'recipes') {
    if (historyContainer) historyContainer.hidden = true;
    container.hidden = false;

    if (!cards.length) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.hidden = !makeIds.length ? false : true;
    } else {
      if (emptyEl) emptyEl.hidden = true;

      let html = '';
      cards.forEach(({ id, title, img, missing }) => {
        const isFav = favSet.has(id);
        const inShop = shopSet.has(id);
        const ready = !missing.length;

        // Get cook history for this recipe
        const cooks = history.filter(h => h.id === id);
        const lastCook = cooks.length ? cooks[cooks.length - 1] : null;

        html += `<div class="wm-row" data-wm-recipe="${id}">
          ${img ? `<img class="wm-row-img" src="${escHTML(img)}" alt="" loading="lazy">` : '<div class="wm-row-img wm-row-img-empty"></div>'}
          <a class="wm-row-title" href="#" data-open-recipe="${id}">${escHTML(title)}</a>
          <span class="wm-row-status ${ready ? 'wm-ready' : 'wm-missing'}">
            ${ready ? '✓ Ready' : `${missing.length} needed`}
          </span>
          <div class="wm-row-actions">
            <button class="wm-icon-btn${isFav ? ' wm-fav-on' : ''}" data-wm-fav="${id}" title="${isFav ? 'Unfavorite' : 'Favorite'}">${isFav ? '❤️' : '🤍'}<span class="wm-btn-label">${isFav ? 'Saved' : 'Favorite'}</span></button>
            <button class="wm-icon-btn${lastCook ? ' wm-cooked' : ''}" data-wm-cook="${id}" title="I Made This">${lastCook ? '✅' : '☐'}<span class="wm-btn-label">${lastCook ? 'Made It' : 'I Made This'}</span></button>
            <button class="wm-icon-btn" data-wm-share="${id}" title="Share">📤<span class="wm-btn-label">Share</span></button>
            <button class="wm-icon-btn wm-shop-btn${inShop ? ' wm-in-shop' : ''}" data-wm-shop="${id}" title="${inShop ? 'In Shopping' : 'Send to Shopping'}">${inShop ? '✓🛒' : '🛒'}<span class="wm-btn-label">${inShop ? 'In Cart' : 'Shop'}</span></button>
            <button class="wm-icon-btn wm-remove-btn" data-wm-remove="${id}" title="Remove">×<span class="wm-btn-label">Remove</span></button>
          </div>
        </div>`;
      });

      container.innerHTML = html;
    }
  }

  // ── History sub-tab ──
  if (_activeSubTab === 'history') {
    container.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    if (historyContainer) {
      historyContainer.hidden = false;
      renderCookHistory(historyContainer, history, favSet, shopSet);
    }
  }
}

/* ── Cooking History ─────────────────────────────────────────── */

function renderCookHistory(container, history, favSet, shopSet) {
  if (!history.length) {
    container.innerHTML = '<p class="wm-empty-hint">No cooking history yet. Tap ✅ on a recipe after you make it!</p>';
    return;
  }

  // Deduplicate: keep only newest per recipe
  const seen = new Map();
  [...history].reverse().forEach(h => {
    if (!seen.has(h.id)) seen.set(h.id, h);
  });
  let unique = [...seen.values()].slice(0, 30);

  // Resolve recipe titles for sorting
  const resolved = unique.map(h => {
    const recipe = _recipes.find(r => r.id === h.id);
    return { ...h, _title: recipe ? recipe.title : '' };
  });

  // Sort
  resolved.sort((a, b) => {
    let cmp = 0;
    switch (_sortCol) {
      case 'recipe':
        cmp = a._title.localeCompare(b._title);
        break;
      case 'rating':
        cmp = (a.rating || 0) - (b.rating || 0);
        break;
      case 'date':
        cmp = new Date(a.date) - new Date(b.date);
        break;
      case 'again': {
        const val = v => v === true ? 2 : v === false ? 1 : 0;
        cmp = val(a.wouldMakeAgain) - val(b.wouldMakeAgain);
        break;
      }
    }
    return _sortAsc ? cmp : -cmp;
  });

  // Sort arrow helper
  const arrow = (col) => _sortCol === col ? (_sortAsc ? ' ▲' : ' ▼') : '';

  let html = `<div class="wm-history-table">
    <div class="wm-history-header">
      <span class="wm-sort-col" data-sort-col="recipe">Recipe${arrow('recipe')}</span>
      <span class="wm-sort-col" data-sort-col="rating">Rating${arrow('rating')}</span>
      <span class="wm-sort-col" data-sort-col="date">Date${arrow('date')}</span>
      <span class="wm-sort-col" data-sort-col="again">Again?${arrow('again')}</span>
      <span>Fav</span>
      <span>Shop</span>
      <span></span>
    </div>`;

  resolved.forEach(({ id, date, rating, wouldMakeAgain, _title }) => {
    if (!_title) return;
    const dateStr = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const stars = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—';
    const again = wouldMakeAgain === true ? '✓'
      : wouldMakeAgain === false ? '✗'
      : '—';
    const isFav = favSet.has(id);
    const inShop = shopSet.has(id);

    html += `<div class="wm-history-row" data-history-id="${id}">
      <a class="wm-history-name" href="#" data-open-recipe="${id}">${escHTML(_title)}</a>
      <span class="wm-history-stars">${stars}</span>
      <span class="wm-history-date">${dateStr}</span>
      <span class="wm-history-again ${wouldMakeAgain === true ? 'wm-again-yes' : wouldMakeAgain === false ? 'wm-again-no' : ''}">${again}</span>
      <button class="wm-icon-btn wm-hist-fav${isFav ? ' wm-fav-on' : ''}" data-wm-fav="${id}" title="Favorite">${isFav ? '❤️' : '🤍'}</button>
      <button class="wm-icon-btn wm-hist-shop${inShop ? ' wm-in-shop' : ''}" data-wm-shop="${id}" title="Send to Shopping">${inShop ? '✓🛒' : '🛒'}</button>
      <button class="wm-icon-btn wm-remove-btn" data-del-history="${id}" title="Delete">×</button>
    </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

/* ── Event wiring ────────────────────────────────────────────── */

function wireEvents() {
  const panel = $('#tab-wantmake');
  if (!panel) return;

  panel.addEventListener('click', (e) => {
    const t = e.target;

    // Sub-tab toggle
    const subTab = t.closest('.wm-subtab');
    if (subTab) {
      _activeSubTab = subTab.dataset.wmSub;
      renderWantToMake();
      return;
    }

    // Sort column header click
    const sortCol = t.closest('[data-sort-col]');
    if (sortCol) {
      const col = sortCol.dataset.sortCol;
      if (_sortCol === col) {
        _sortAsc = !_sortAsc;
      } else {
        _sortCol = col;
        _sortAsc = col === 'recipe'; // alpha defaults ascending, others descending
      }
      renderWantToMake();
      return;
    }

    // Open recipe detail
    const openLink = t.closest('[data-open-recipe]');
    if (openLink) {
      e.preventDefault();
      const id = Number(openLink.dataset.openRecipe);
      if (id) openDetail(id);
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

    // Send to Shopping
    const shopBtn = t.closest('[data-wm-shop]');
    if (shopBtn) {
      const id = Number(shopBtn.dataset.wmShop);
      const current = get('shopRecipes');
      if (current.includes(id)) {
        // Remove from shopping
        set('shopRecipes', current.filter(i => i !== id));
        autoSync();
        showToast('Removed from Shopping');
      } else {
        // Add to shopping
        set('shopRecipes', [...current, id]);
        autoSync();
        showToast('Added to Shopping List! 🛒');
      }
      return;
    }

    // Remove from Want to Make
    const removeBtn = t.closest('[data-wm-remove]');
    if (removeBtn) {
      const id = Number(removeBtn.dataset.wmRemove);
      const current = get('makelist');
      set('makelist', current.filter(i => i !== id));
      // Also remove from shopRecipes if present
      const shopCurrent = get('shopRecipes');
      if (shopCurrent.includes(id)) {
        set('shopRecipes', shopCurrent.filter(i => i !== id));
      }
      autoSync();
      showToast('Removed from My Queue');
      return;
    }

    // Delete cook history entry
    const delBtn = t.closest('[data-del-history]');
    if (delBtn) {
      const id = Number(delBtn.dataset.delHistory);
      const hist = get('cookHistory');
      set('cookHistory', hist.filter(h => h.id !== id));
      autoSync();
      showToast('History entry removed');
      return;
    }
  });
}

/* ── Enhanced cook handler with "Would make again?" ──────────── */

async function handleCookWithAgain(id) {
  await handleCook(id);

  const history = get('cookHistory');
  const lastEntry = [...history].reverse().find(h => h.id === id);
  if (!lastEntry) return;

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
