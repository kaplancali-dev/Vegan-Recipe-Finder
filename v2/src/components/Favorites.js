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
import { $ } from '../utils/dom.js';
import { toggleFavorite } from '../actions/favorites.js';
import { handleShareClick } from '../actions/share.js';
import { renderCardList } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';
import { addToShopList } from './Shopping.js';

import { COLLECTIONS } from '../data/collections.js';

/** @type {Array} Full recipe list */
let _recipes = [];

/**
 * Initialize the Favorites tab.
 * @param {Array} recipes
 */
export function initFavorites(recipes) {
  _recipes = recipes;

  renderCollections();
  renderFavList();
  renderCookHistory();

  subscribe('favorites', renderFavList);
  subscribe('collections', renderCollections);
  subscribe('ingredients', renderFavList);
  subscribe('staples', renderFavList);
  subscribe('makelist', renderFavList);
  subscribe('cookHistory', () => { renderFavList(); renderCookHistory(); });
}

/* ── Collections Grid ────────────────────────────────────────── */

function renderCollections() {
  const container = $('#collectionsGrid');
  if (!container) return;

  const collections = get('collections') || {};

  container.innerHTML = COLLECTIONS.map(({ key, icon, label }) => {
    const items = collections[key] || [];
    const count = items.length;
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
 * Open a collection to view/manage its recipes.
 * Shows missing ingredients per recipe and a "Shop for collection" button
 * that adds all missing ingredients to the Shopping List.
 */
function openCollection(key) {
  const def = COLLECTIONS.find(c => c.key === key);
  if (!def) return;

  // Remove any existing popup
  const existing = document.querySelector('.collection-popup');
  if (existing) existing.remove();

  const collections = get('collections') || {};
  const items = collections[key] || [];
  const favIds = getRef('favorites');
  const favRecipes = _recipes.filter(r => favIds.includes(r.id));
  const itemSet = new Set(items);

  const popup = document.createElement('div');
  popup.className = 'collection-popup card';
  popup.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:180;max-height:70dvh;overflow-y:auto;border-radius:12px 12px 0 0;box-shadow:0 -4px 30px rgba(0,0,0,.15);padding:16px';

  // Run matching engine on collection recipes to get missing ingredients
  const savedRecipes = items.map(id => _recipes.find(r => r.id === id)).filter(Boolean);
  const ings = getRef('ingredients');
  const staples = getRef('staples');
  let matchedSaved = [];
  if (savedRecipes.length) {
    matchedSaved = findRecipes({
      recipes: savedRecipes,
      ingredients: ings,
      staples,
    });
  }

  // Collect all missing ingredients across the collection
  const allMissing = new Set();
  matchedSaved.forEach(r => {
    if (r.needNames) r.needNames.forEach(n => allMissing.add(n));
  });

  const availableToAdd = favRecipes.filter(r => !itemSet.has(r.id));

  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h4 style="font-family:var(--font-sans);font-size:1rem">${def.icon} ${escHTML(def.label)}</h4>
      <button class="icon-btn" data-coll-close aria-label="Close">&times;</button>
    </div>

    ${matchedSaved.length ? `
      <div style="margin-bottom:16px">
        <p style="font-size:0.82rem;color:var(--ink-soft);margin-bottom:8px"><strong>In this collection:</strong></p>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${matchedSaved.map(r => {
            const missing = r.needNames || [];
            return `
            <div style="padding:8px 12px;background:var(--green-soft);border-radius:var(--radius)">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-size:0.85rem;font-weight:600">${escHTML(r.title)}</span>
                <button class="icon-btn" data-coll-remove="${r.id}" title="Remove" style="font-size:1rem">&times;</button>
              </div>
              ${missing.length ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:3px">
                ${missing.map(m => `<span style="font-size:0.72rem;padding:2px 6px;background:var(--accent-soft);color:var(--accent);border-radius:4px">need: ${escHTML(m)}</span>`).join('')}
              </div>` : '<span style="font-size:0.72rem;color:var(--green);font-weight:600">✓ Ready to cook</span>'}
            </div>`;
          }).join('')}
        </div>
      </div>

      ${allMissing.size ? `
        <button class="btn btn-primary" data-coll-shop style="width:100%;margin-bottom:16px">
          🛒 Add ${allMissing.size} missing ingredient${allMissing.size !== 1 ? 's' : ''} to Shopping List
        </button>
      ` : '<p style="font-size:0.85rem;color:var(--green);font-weight:600;text-align:center;margin-bottom:16px">✓ You have everything — ready to cook!</p>'}
    ` : '<p style="font-size:0.85rem;color:var(--muted);margin-bottom:16px">No recipes in this collection yet.</p>'}

    ${availableToAdd.length ? `
      <p style="font-size:0.82rem;color:var(--ink-soft);margin-bottom:8px"><strong>Add from favorites:</strong></p>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${availableToAdd.map(r => `
          <button class="btn btn-outline" style="text-align:left;justify-content:flex-start" data-coll-add="${r.id}">
            + ${escHTML(r.title)}
            <span class="muted" style="margin-left:auto;font-size:0.75rem">${r.time ? r.time + 'min' : ''}</span>
          </button>
        `).join('')}
      </div>
    ` : (favIds.length && !savedRecipes.length ? '<p style="font-size:0.85rem;color:var(--muted)">Add some ❤️ favorites first, then organize them into collections.</p>' : '')}
  `;

  popup.addEventListener('click', (e) => {
    // Shop for collection button
    if (e.target.closest('[data-coll-shop]')) {
      addToShopList([...allMissing]);
      popup.remove();
      return;
    }

    const addBtn = e.target.closest('[data-coll-add]');
    if (addBtn) {
      const recipeId = Number(addBtn.dataset.collAdd);
      const cols = get('collections') || {};
      if (!cols[key]) cols[key] = [];
      cols[key].push(recipeId);
      set('collections', cols);
      autoSync();
      popup.remove();
      openCollection(key);
      return;
    }

    const removeBtn = e.target.closest('[data-coll-remove]');
    if (removeBtn) {
      const recipeId = Number(removeBtn.dataset.collRemove);
      const cols = get('collections') || {};
      if (cols[key]) {
        cols[key] = cols[key].filter(id => id !== recipeId);
      }
      set('collections', cols);
      autoSync();
      popup.remove();
      openCollection(key);
      return;
    }

    if (e.target.closest('[data-coll-close]')) {
      popup.remove();
    }
  });

  document.body.appendChild(popup);

  // Close on outside click
  setTimeout(() => {
    const handler = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', handler);
      }
    };
    document.addEventListener('click', handler);
  }, 100);
}

/* ── Favorites List ──────────────────────────────────────────── */

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

  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const favSet = new Set(favIds);

  const results = findRecipes({
    recipes: _recipes.filter(r => favSet.has(r.id)),
    ingredients: ings,
    staples,
  });

  const makeIds = getRef('makelist');
  const cookHistory = getRef('cookHistory');
  container.innerHTML = renderCardList(results, favSet, { showMatch: true, makelist: makeIds, cookHistory, userIngs: [...ings, ...staples] });

  container.onclick = (e) => {
    if (e.target.closest('[data-external]')) return;

    if (handleShareClick(e)) return;

    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.favId);
      toggleFavorite(id);
      return;
    }

    // Make This button — toggle on make list
    const makeBtn = e.target.closest('.make-btn');
    if (makeBtn) {
      e.stopPropagation();
      const id = Number(makeBtn.dataset.makeId);
      const current = get('makelist');
      if (current.includes(id)) {
        set('makelist', current.filter(i => i !== id));
        showToast('Removed from Make list');
      } else {
        current.push(id);
        set('makelist', current);
        showToast('Added to Make list — check Shop tab!');
      }
      autoSync();
      return;
    }

    // Cook button — log "I Made This"
    const cookBtn = e.target.closest('.cook-btn');
    if (cookBtn) {
      e.stopPropagation();
      const id = Number(cookBtn.dataset.cookId);
      const history = get('cookHistory');
      history.push({ id, date: new Date().toISOString() });
      set('cookHistory', history);
      autoSync();
      showToast('Logged in I Made This!');
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

  // Most recent first, limited to 20
  const recent = [...history].reverse().slice(0, 20);

  listEl.innerHTML = recent.map(entry => {
    const recipe = _recipes.find(r => r.id === entry.id);
    const title = recipe ? escHTML(recipe.title) : `Recipe #${entry.id}`;
    const date = new Date(entry.date).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    return `<div class="cook-history-item">
      <span>${title}</span>
      <span class="cook-date">${date}</span>
    </div>`;
  }).join('');
}
