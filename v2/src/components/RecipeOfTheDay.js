/**
 * Recipe of the Day — deterministic daily spotlight.
 *
 * Uses the current date as a seed to pick one recipe per day.
 * Only picks recipes that have a hero image for visual impact.
 * The same recipe is shown to all users on the same day.
 */

import { getRef } from '../state/store.js';
import { findRecipes } from '../services/matching.js';
import { renderCard } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';
import { toggleFavorite } from '../actions/favorites.js';
import { handleShareClick } from '../actions/share.js';
import { handleCook } from '../actions/cook.js';
import { showToast } from '../utils/toast.js';
import { get, set, subscribe } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { $ } from '../utils/dom.js';

/**
 * Simple hash from a date string → stable integer.
 * @param {string} str
 * @returns {number}
 */
function hashDate(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Pick today's recipe. Deterministic: same date → same recipe.
 * Only picks from recipes that have an image.
 * @param {Array} recipes
 * @returns {Object|null}
 */
function pickROTD(recipes) {
  const withImg = recipes.filter(r => r.img);
  if (!withImg.length) return null;

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const idx = hashDate(dateStr) % withImg.length;
  return withImg[idx];
}

/** @type {Object|null} Today's recipe (raw) */
let _rotdRecipe = null;

/** @type {Array} Full recipes list */
let _recipes = [];

/**
 * Initialize Recipe of the Day.
 * @param {Array} recipes
 */
export function initROTD(recipes) {
  _recipes = recipes;
  _rotdRecipe = pickROTD(recipes);

  if (!_rotdRecipe) return;

  renderROTD();

  // Re-render when user state changes (favorites, pantry, etc.)
  subscribe('ingredients', renderROTD);
  subscribe('staples', renderROTD);
  subscribe('favorites', renderROTD);
  subscribe('makelist', renderROTD);
  subscribe('cookHistory', renderROTD);
}

/**
 * Render (or re-render) the ROTD spotlight card.
 */
function renderROTD() {
  const container = $('#rotdSpotlight');
  if (!container || !_rotdRecipe) return;

  // Score the recipe against user's pantry
  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const favs = new Set(getRef('favorites'));
  const makeIds = getRef('makelist');
  const cookHistory = getRef('cookHistory');

  // Run matching to get scored version
  const results = findRecipes({
    recipes: [_rotdRecipe],
    ingredients: ings,
    staples,
    selectedCats: [],
    allergies: new Set(),
  });

  const scored = results[0] || {
    ..._rotdRecipe,
    pct: 0,
    haveNames: [],
    needNames: _rotdRecipe.ing || [],
  };

  const cookedDates = (cookHistory || []).filter(h => h.id === _rotdRecipe.id);

  const cardHTML = renderCard(scored, {
    showMatch: ings.length > 0,
    isFavorite: favs.has(_rotdRecipe.id),
    isOnMakeList: makeIds.includes(_rotdRecipe.id),
    cookedDates,
    userIngs: [...ings, ...staples],
  });

  container.innerHTML = `
    <div class="rotd-label">🌟 Recipe of the Day</div>
    ${cardHTML}
  `;
  container.hidden = false;

  // Wire up event delegation (same as Browse)
  container.onclick = (e) => {
    // External links
    if (e.target.closest('[data-recipe-url]')) return;

    // Share
    if (handleShareClick(e)) return;

    // Favorite
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      e.stopPropagation();
      toggleFavorite(Number(favBtn.dataset.favId));
      return;
    }

    // My Queue
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

    // Cook
    const cookBtn = e.target.closest('.cook-btn');
    if (cookBtn) {
      e.stopPropagation();
      handleCook(Number(cookBtn.dataset.cookId));
      return;
    }

    // Card click → detail
    const card = e.target.closest('.r-card');
    if (card) {
      openDetail(Number(card.dataset.recipeId));
    }
  };
}
