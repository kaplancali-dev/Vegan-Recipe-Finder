/**
 * MadeIt — Cooking journal tab.
 *
 * Shows all recipes the user has marked as "Made It" with dates,
 * star ratings, and recipe cards. Serves as a personal cooking log.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes } from '../services/matching.js';
import { escHTML } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { handleCook } from '../actions/cook.js';
import { $ } from '../utils/dom.js';
import { toggleFavorite } from '../actions/favorites.js';
import { handleShareClick } from '../actions/share.js';
import { renderCardList } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';
import { addToShopList } from './Shopping.js';

/** @type {Array} Full recipe list */
let _recipes = [];

/**
 * Initialize the Made It tab.
 * @param {Array} recipes
 */
export function initMadeIt(recipes) {
  _recipes = recipes;

  renderMadeIt();

  // Click handlers
  const panel = $('#tab-madeit');
  if (panel) {
    panel.addEventListener('click', (e) => {
      // Delete entry
      const delBtn = e.target.closest('[data-cook-delete]');
      if (delBtn) {
        e.stopPropagation();
        if (!confirm('Remove this recipe from your cooking journal? This cannot be undone.')) return;
        const id = Number(delBtn.dataset.cookDelete);
        const history = get('cookHistory');
        set('cookHistory', history.filter(h => h.id !== id));
        autoSync();
        showToast('Removed from cooking journal');
        return;
      }

      // Recipe link in history list
      const link = e.target.closest('[data-recipe-id]');
      if (link && link.classList.contains('cook-history-link')) {
        e.preventDefault();
        openDetail(Number(link.dataset.recipeId));
        return;
      }

      // Share button on cards
      if (handleShareClick(e)) return;

      // External links
      if (e.target.closest('[data-recipe-url]')) return;

      // Fav button on cards
      const favBtn = e.target.closest('.fav-btn');
      if (favBtn) {
        e.stopPropagation();
        toggleFavorite(Number(favBtn.dataset.favId));
        return;
      }

      // Make button on cards
      const makeBtn = e.target.closest('.make-btn');
      if (makeBtn) {
        e.stopPropagation();
        const id = Number(makeBtn.dataset.makeId);
        const current = get('makelist');
        if (current.includes(id)) {
          set('makelist', current.filter(i => i !== id));
          showToast('Removed from My Queue');
        } else {
          current.push(id);
          set('makelist', current);
          showToast('Added to My Queue 📌');
        }
        autoSync();
        return;
      }

      // Cook button on cards
      const cookBtn = e.target.closest('.cook-btn');
      if (cookBtn) {
        e.stopPropagation();
        handleCook(Number(cookBtn.dataset.cookId));
        return;
      }

      // Card click — open detail
      const card = e.target.closest('.r-card');
      if (card) {
        openDetail(Number(card.dataset.recipeId));
      }
    });
  }

  subscribe('cookHistory', renderMadeIt);
  subscribe('favorites', renderMadeIt);
  subscribe('ingredients', renderMadeIt);
  subscribe('staples', renderMadeIt);
  subscribe('makelist', renderMadeIt);
}

/* ── Render ──────────────────────────────────────────────────── */

function renderMadeIt() {
  const historyList = $('#madeItHistory');
  const cardsEl = $('#madeItCards');
  const emptyEl = $('#madeItEmpty');
  const statsEl = $('#madeItStats');
  if (!historyList) return;

  const history = getRef('cookHistory');

  if (!history.length) {
    historyList.innerHTML = '';
    if (cardsEl) cardsEl.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    if (statsEl) statsEl.hidden = true;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;
  if (statsEl) statsEl.hidden = false;

  // Deduplicate: keep only the most recent entry per recipe
  const seen = new Map();
  for (const entry of history) {
    const prev = seen.get(entry.id);
    if (!prev || new Date(entry.date) > new Date(prev.date)) {
      seen.set(entry.id, entry);
    }
  }
  const unique = [...seen.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Stats
  const totalCooked = unique.length;
  const rated = unique.filter(e => e.rating);
  const avgRating = rated.length
    ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length).toFixed(1)
    : '—';

  if (statsEl) {
    statsEl.innerHTML = `
      <span class="madeit-stat"><strong>${totalCooked}</strong> recipe${totalCooked !== 1 ? 's' : ''} cooked</span>
      <span class="madeit-stat">⭐ ${avgRating} avg rating</span>
    `;
  }

  // History list (all entries, not capped at 20)
  historyList.innerHTML = unique.map(entry => {
    const recipe = _recipes.find(r => r.id === entry.id);
    const title = recipe ? escHTML(recipe.title) : `Recipe #${entry.id}`;
    const img = recipe?.img || '';
    const date = new Date(entry.date).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const rating = entry.rating ? '★'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating) : '—';
    return `<div class="cook-history-item">
      ${img ? `<img class="cook-history-img" src="${escHTML(img)}" alt="" loading="lazy">` : '<div class="cook-history-img cook-history-img-empty"></div>'}
      <a class="cook-history-link" data-recipe-id="${entry.id}">${title}</a>
      <span class="cook-stars">${rating}</span>
      <span class="cook-date">${date}</span>
      <button class="cook-delete-btn" data-cook-delete="${entry.id}" aria-label="Remove">✕</button>
    </div>`;
  }).join('');

  // Also show recipe cards for the most recent 6
  if (cardsEl) {
    const recentIds = unique.slice(0, 6).map(e => e.id);
    const idSet = new Set(recentIds);
    const ings = getRef('ingredients');
    const staples = getRef('staples');
    const favIds = getRef('favorites');
    const favSet = new Set(favIds);
    const makeIds = getRef('makelist');
    const notes = get('instructions');

    const results = findRecipes({
      recipes: _recipes.filter(r => idSet.has(r.id)),
      ingredients: ings,
      staples,
    });

    // Sort by cook order (most recent first)
    results.sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));

    cardsEl.innerHTML = results.length
      ? `<h3 class="card-title" style="margin-bottom:8px">Recently Cooked</h3>` +
        renderCardList(results, favSet, { showMatch: true, makelist: makeIds, cookHistory: history, userIngs: [...ings, ...staples], notes })
      : '';
  }
}
