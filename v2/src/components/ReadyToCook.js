/**
 * ReadyToCook — shows recipes the user can make right now.
 *
 * Filters to recipes with >=80% pantry match, sorted by
 * match percentage descending.
 */

import { get, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes } from '../services/matching.js';
import { renderCardList } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';

const $ = (sel) => document.querySelector(sel);

/** @type {Array} Full recipe list */
let _recipes = [];

/** Minimum match percentage to show in Ready to Cook */
const MIN_MATCH = 80;

/**
 * Initialize the Ready to Cook tab.
 * @param {Array} recipes
 */
export function initReadyToCook(recipes) {
  _recipes = recipes;

  renderReadyList();

  subscribe('ingredients', renderReadyList);
  subscribe('staples', renderReadyList);
  subscribe('favorites', renderReadyList);
  subscribe('allergies', renderReadyList);
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

  // Filter to >=80% match
  const ready = allResults.filter(r => r.pct >= MIN_MATCH);

  if (badge) {
    badge.textContent = ready.length > 0 ? String(ready.length) : '';
  }

  if (!ready.length) {
    container.innerHTML = '';
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.innerHTML = ings.length || staples.length
        ? '<p>No recipes at 80%+ match yet. Add more ingredients to your pantry!</p>'
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

/**
 * Toggle favorite status.
 * @param {number} id
 */
function toggleFavorite(id) {
  const favs = get('favorites');
  const favSet = new Set(favs);
  if (favSet.has(id)) {
    favSet.delete(id);
  } else {
    favSet.add(id);
  }
  set('favorites', [...favSet]);
  autoSync();
}
