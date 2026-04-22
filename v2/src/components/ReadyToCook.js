/**
 * ReadyToCook — shows recipes the user can make right now.
 *
 * Filters to recipes missing 1 or fewer ingredients (matching v1 behavior),
 * sorted by match percentage descending. Includes a search bar.
 */

import { subscribe, getRef } from '../state/store.js';
import { findRecipes } from '../services/matching.js';
import { $ } from '../utils/dom.js';
import { toggleFavorite } from '../actions/favorites.js';
import { renderCardList } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';
import { stem } from '../utils/text.js';

/** @type {Array} Full recipe list */
let _recipes = [];

/** Maximum number of missing ingredients to show in Ready to Make */
const MAX_MISSING = 1;

/** Search query for Ready tab */
let _readySearch = '';

/** Debounce timer */
let _searchTimer = null;

/**
 * Initialize the Ready to Cook tab.
 * @param {Array} recipes
 */
export function initReadyToCook(recipes) {
  _recipes = recipes;

  wireReadySearch();
  renderReadyList();

  subscribe('ingredients', renderReadyList);
  subscribe('staples', renderReadyList);
  subscribe('favorites', renderReadyList);
  subscribe('allergies', renderReadyList);
}

/**
 * Wire up the search input for the Ready tab.
 */
function wireReadySearch() {
  const input = $('#readySearch');
  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      _readySearch = input.value.trim();
      renderReadyList();
    }, 250);
  });
}

/**
 * Render the ready-to-cook recipe list.
 */
function renderReadyList() {
  const container = $('#canMakeList');
  const emptyEl = $('#canMakeEmpty');
  const badge = $('#readyCount');
  if (!container) return;

  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const favs = new Set(getRef('favorites'));
  const allergies = getRef('allergies');

  // Only run if user has some ingredients
  if (!ings.length && !staples.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    if (badge) badge.textContent = '';
    return;
  }

  const allResults = findRecipes({
    recipes: _recipes,
    ingredients: ings,
    staples,
    allergies: allergies.length ? new Set(allergies) : undefined,
  });

  // Filter to recipes missing 1 or fewer ingredients (matches v1 behavior)
  let ready = allResults.filter(r => (r.needNames?.length ?? 0) <= MAX_MISSING);

  // Apply search filter if present
  if (_readySearch) {
    ready = ready.filter(r => {
      const t = r.title.toLowerCase();
      const ingStr = (r.ing || []).join(' ').toLowerCase();
      const words = _readySearch.toLowerCase().split(/\s+/);
      return words.every(w => {
        const s = stem(w);
        return t.includes(w) || t.includes(s) || ingStr.includes(w) || ingStr.includes(s);
      });
    });
  }

  if (badge) {
    badge.textContent = ready.length > 0 ? String(ready.length) : '';
  }

  if (!ready.length) {
    container.innerHTML = '';
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.innerHTML = _readySearch
        ? '<p>No matching recipes found. Try a different search term.</p>'
        : ings.length || staples.length
          ? '<p>No recipes with 1 or fewer missing ingredients yet. Add more to your pantry!</p>'
          : '<p>Add ingredients to your pantry to see what you can make!</p>';
    }
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  container.innerHTML = renderCardList(ready, favs);

  // Event delegation
  container.onclick = (e) => {
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.favId);
      toggleFavorite(id);
      return;
    }

    const card = e.target.closest('.r-card');
    if (card) {
      const id = Number(card.dataset.recipeId);
      openDetail(id);
    }
  };
}
