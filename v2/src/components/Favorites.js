/**
 * Favorites — Favorites tab with saved recipes and themed collections.
 *
 * Shows favorited recipes as cards and themed collections
 * (Weekly Meal Plan, Celebration, Romantic Evening, etc.)
 * where users can organize recipes.
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

import { COLLECTIONS } from '../data/collections.js';

/** @type {Array} Full recipe list */
let _recipes = [];

/** Currently selected collection key (null = grid view) */
let _activeColl = null;

/**
 * Initialize the Favorites tab.
 * @param {Array} recipes
 */
export function initFavorites(recipes) {
  _recipes = recipes;

  renderCollections();
  renderCookHistory();

  // Back button
  const backBtn = $('#favCollBack');
  if (backBtn) backBtn.addEventListener('click', closeCollection);

  subscribe('favorites', () => { renderCollections(); if (_activeColl) renderFavList(); });
  subscribe('collections', () => { renderCollections(); if (_activeColl) renderFavList(); });
  subscribe('ingredients', () => { if (_activeColl) renderFavList(); });
  subscribe('staples', () => { if (_activeColl) renderFavList(); });
  subscribe('makelist', () => { if (_activeColl) renderFavList(); });
  subscribe('cookHistory', () => { if (_activeColl) renderFavList(); renderCookHistory(); });

  // Cook history card — click to open recipe or delete entry
  const historyCard = $('#cookHistoryCard');
  if (historyCard) {
    historyCard.addEventListener('click', (e) => {
      const link = e.target.closest('[data-recipe-id]');
      if (link) {
        e.preventDefault();
        openDetail(Number(link.dataset.recipeId));
        return;
      }
      const btn = e.target.closest('[data-cook-delete]');
      if (!btn) return;
      if (!confirm('Remove this recipe from your cook history? This cannot be undone.')) return;
      const id = Number(btn.dataset.cookDelete);
      const history = get('cookHistory');
      set('cookHistory', history.filter(h => h.id !== id));
      autoSync();
      showToast('Removed from Cook History');
    });
  }
}

/* ── Collections Grid ────────────────────────────────────────── */

function renderCollections() {
  const container = $('#collectionsGrid');
  if (!container) return;

  const collections = get('collections') || {};

  const favIds = getRef('favorites');

  container.innerHTML = COLLECTIONS.map(({ key, icon, label }) => {
    const count = key === 'all' ? favIds.length : (collections[key] || []).length;
    return `<button class="collection-btn" data-collection="${key}">
      <span class="collection-icon">${icon}</span>
      <span class="collection-label">${escHTML(label)}</span>
      <span class="collection-count">${count ? count + ' recipe' + (count !== 1 ? 's' : '') : 'Empty'}</span>
    </button>`;
  }).join('');

  container.onclick = (e) => {
    const btn = e.target.closest('.collection-btn');
    if (!btn) return;
    const key = btn.dataset.collection;
    openCollection(key);
  };
}

/**
 * Open a collection inline — show its recipes below the grid.
 */
function openCollection(key) {
  const def = COLLECTIONS.find(c => c.key === key);
  if (!def) return;

  _activeColl = key;

  // Update header
  const titleEl = $('#favCollTitle');
  if (titleEl) titleEl.innerHTML = `${def.icon} ${escHTML(def.label)}`;

  // Show detail section
  const detail = $('#favCollDetail');
  if (detail) detail.hidden = false;

  // Highlight active collection button
  const grid = $('#collectionsGrid');
  if (grid) {
    grid.querySelectorAll('.collection-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.collection === key);
    });
  }

  renderFavList();
}

/**
 * Close collection detail — return to grid-only view.
 */
function closeCollection() {
  _activeColl = null;

  const detail = $('#favCollDetail');
  if (detail) detail.hidden = true;

  // Remove active highlight
  const grid = $('#collectionsGrid');
  if (grid) {
    grid.querySelectorAll('.collection-btn').forEach(b => b.classList.remove('active'));
  }
}

/* ── Favorites List ──────────────────────────────────────────── */

function renderFavList() {
  const container = $('#favList');
  const emptyEl = $('#favEmpty');
  const shopBtn = $('#favCollShop');
  if (!container || !_activeColl) return;

  const favIds = getRef('favorites');
  const collections = get('collections') || {};

  // Get recipe IDs for this collection
  const ids = _activeColl === 'all' ? [...favIds] : (collections[_activeColl] || []);

  if (!ids.length) {
    container.innerHTML = '';
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.innerHTML = _activeColl === 'all'
        ? '<p>No favorites yet. Tap ❤️ on any recipe to save it here.</p>'
        : '<p>No recipes in this collection yet. Tap ❤️ on a recipe, then add it to a collection.</p>';
    }
    if (shopBtn) shopBtn.hidden = true;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const idSet = new Set(ids);
  const favSet = new Set(favIds);

  const results = findRecipes({
    recipes: _recipes.filter(r => idSet.has(r.id)),
    ingredients: ings,
    staples,
  });

  // Collect missing ingredients for "Shop Missing" button
  const allMissing = new Set();
  results.forEach(r => {
    if (r.needNames) r.needNames.forEach(n => allMissing.add(n));
  });

  if (shopBtn) {
    if (allMissing.size) {
      shopBtn.hidden = false;
      shopBtn.textContent = `🛒 Shop ${allMissing.size} Missing`;
      shopBtn.onclick = () => {
        addToShopList([...allMissing]);
        showToast(`Added ${allMissing.size} ingredient${allMissing.size !== 1 ? 's' : ''} to Shopping List`);
      };
    } else {
      shopBtn.hidden = true;
    }
  }

  const makeIds = getRef('makelist');
  const cookHistory = getRef('cookHistory');
  container.innerHTML = renderCardList(results, favSet, { showMatch: true, makelist: makeIds, cookHistory, userIngs: [...ings, ...staples] });

  container.onclick = (e) => {
    if (e.target.closest('[data-recipe-url]')) return;

    if (handleShareClick(e)) return;

    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.favId);
      toggleFavorite(id);
      return;
    }

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

    const cookBtn = e.target.closest('.cook-btn');
    if (cookBtn) {
      e.stopPropagation();
      handleCook(Number(cookBtn.dataset.cookId));
      return;
    }

    const card = e.target.closest('.r-card');
    if (card) {
      const id = Number(card.dataset.recipeId);
      openDetail(id);
    }
  };
}

/* ── Cooking History ────────────────────────────────────────── */

function renderCookHistory() {
  const card = $('#cookHistoryCard');
  const listEl = $('#cookHistoryList');
  if (!card || !listEl) return;

  const history = getRef('cookHistory');
  if (!history.length) {
    card.hidden = true;
    return;
  }

  card.hidden = false;

  // Deduplicate: keep only the most recent entry per recipe
  const seen = new Map();
  for (const entry of history) {
    const prev = seen.get(entry.id);
    if (!prev || new Date(entry.date) > new Date(prev.date)) {
      seen.set(entry.id, entry);
    }
  }
  const unique = [...seen.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);

  listEl.innerHTML = unique.map(entry => {
    const recipe = _recipes.find(r => r.id === entry.id);
    const title = recipe ? escHTML(recipe.title) : `Recipe #${entry.id}`;
    const img = recipe?.img || '';
    const date = new Date(entry.date).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const rating = entry.rating ? '★'.repeat(entry.rating) : '—';
    return `<div class="cook-history-item">
      ${img ? `<img class="cook-history-img" src="${escHTML(img)}" alt="" loading="lazy">` : '<div class="cook-history-img cook-history-img-empty"></div>'}
      <a class="cook-history-link" data-recipe-id="${entry.id}">${title}</a>
      <span class="cook-stars">${rating}</span>
      <span class="cook-date">${date}</span>
      <button class="cook-delete-btn" data-cook-delete="${entry.id}" aria-label="Remove">✕</button>
    </div>`;
  }).join('');
}

