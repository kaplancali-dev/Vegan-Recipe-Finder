/**
 * Favorites — Favorites tab with saved recipes and 7-day meal planner.
 *
 * Shows favorited recipes as cards and a weekly meal planner grid
 * where users can assign recipes to days.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes, sortResults } from '../services/matching.js';
import { escHTML } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';
import { toggleFavorite } from '../actions/favorites.js';
import { renderCardList } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** @type {Array} Full recipe list */
let _recipes = [];

/**
 * Initialize the Favorites tab.
 * @param {Array} recipes
 */
export function initFavorites(recipes) {
  _recipes = recipes;

  renderFavList();
  renderMealSlots();

  subscribe('favorites', renderFavList);
  subscribe('mealPlan', renderMealSlots);
  subscribe('ingredients', renderFavList);
  subscribe('staples', renderFavList);
}

/* ── Favorites List ───────────��──────────────────────────────── */

function renderFavList() {
  const container = $('#favList');
  const emptyEl = $('#favEmpty');
  if (!container) return;

  const favIds = getRef('favorites');

  if (!favIds.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  // Get scored results for favorite recipes
  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const favSet = new Set(favIds);

  const results = findRecipes({
    recipes: _recipes.filter(r => favSet.has(r.id)),
    ingredients: ings,
    staples,
  });

  container.innerHTML = renderCardList(results, favSet, { showMatch: true });

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

/* ── Meal Planner ────────────────────────────────────────────── */

function renderMealSlots() {
  const container = $('#mealSlots');
  if (!container) return;

  const plan = getRef('mealPlan');
  // plan is an array of 7 slots, each is a recipe ID or null
  const slots = Array.isArray(plan) && plan.length === 7
    ? plan
    : [null, null, null, null, null, null, null];

  container.innerHTML = DAYS.map((day, i) => {
    const recipeId = slots[i];
    const recipe = recipeId ? _recipes.find(r => r.id === recipeId) : null;

    return `
      <div class="meal-slot${recipe ? ' filled' : ''}" data-meal-day="${i}">
        <span class="day-label">${day}</span>
        ${recipe
          ? `<span style="font-size:0.7rem;line-height:1.2">${escHTML(recipe.title.split(' ').slice(0, 3).join(' '))}</span>`
          : '<span style="font-size:1.2rem;opacity:0.3">+</span>'
        }
      </div>
    `;
  }).join('');

  // Click to assign/clear a meal slot
  container.onclick = (e) => {
    const slot = e.target.closest('.meal-slot');
    if (!slot) return;
    const dayIdx = Number(slot.dataset.mealDay);
    handleMealSlotClick(dayIdx);
  };
}

/**
 * Handle click on a meal slot — assign from favorites or clear.
 * @param {number} dayIdx - 0-6 (Mon-Sun)
 */
function handleMealSlotClick(dayIdx) {
  const plan = get('mealPlan');
  const slots = Array.isArray(plan) && plan.length === 7
    ? [...plan]
    : [null, null, null, null, null, null, null];

  // If slot is filled, clear it
  if (slots[dayIdx]) {
    slots[dayIdx] = null;
    set('mealPlan', slots);
    autoSync();
    showToast(`${DAYS[dayIdx]} cleared`);
    return;
  }

  // If slot is empty, show a picker from favorites
  const favIds = getRef('favorites');
  if (!favIds.length) {
    showToast('Add some favorites first!');
    return;
  }

  showMealPicker(dayIdx, slots);
}

/**
 * Show a simple meal picker popup.
 */
function showMealPicker(dayIdx, slots) {
  // Remove any existing picker
  const existing = document.querySelector('.meal-picker');
  if (existing) existing.remove();

  const favIds = getRef('favorites');
  const favRecipes = _recipes.filter(r => favIds.includes(r.id));

  const picker = document.createElement('div');
  picker.className = 'meal-picker card';
  picker.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:180;max-height:50dvh;overflow-y:auto;border-radius:12px 12px 0 0;box-shadow:0 -4px 30px rgba(0,0,0,.15);padding:16px';

  picker.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h4 style="font-family:var(--font-sans);font-size:0.9rem">Pick a recipe for ${DAYS[dayIdx]}</h4>
      <button class="icon-btn" data-meal-close aria-label="Close">&times;</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${favRecipes.map(r => `
        <button class="btn btn-outline" style="text-align:left;justify-content:flex-start" data-meal-pick="${r.id}">
          ${escHTML(r.title)}
          <span class="muted" style="margin-left:auto;font-size:0.75rem">${r.time ? r.time + 'min' : ''}</span>
        </button>
      `).join('')}
    </div>
  `;

  picker.addEventListener('click', (e) => {
    const pickBtn = e.target.closest('[data-meal-pick]');
    if (pickBtn) {
      const recipeId = Number(pickBtn.dataset.mealPick);
      slots[dayIdx] = recipeId;
      set('mealPlan', slots);
      autoSync();
      picker.remove();
      const recipe = _recipes.find(r => r.id === recipeId);
      showToast(`${DAYS[dayIdx]}: ${recipe?.title || 'Recipe'}`);
      return;
    }

    if (e.target.closest('[data-meal-close]')) {
      picker.remove();
    }
  });

  document.body.appendChild(picker);

  // Close on outside click (after a tick)
  setTimeout(() => {
    const handler = (e) => {
      if (!picker.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', handler);
      }
    };
    document.addEventListener('click', handler);
  }, 100);
}
