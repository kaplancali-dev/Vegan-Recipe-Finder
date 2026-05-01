/**
 * MadeIt — Cooking journal tab.
 *
 * Shows all recipes the user has marked as "Made It" with dates,
 * star ratings, and thumbnails. Serves as a personal cooking log.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { escHTML } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';
import { openDetail } from './RecipeDetail.js';

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

      // Recipe link — open detail
      const link = e.target.closest('[data-recipe-id]');
      if (link) {
        e.preventDefault();
        openDetail(Number(link.dataset.recipeId));
        return;
      }
    });
  }

  subscribe('cookHistory', renderMadeIt);
}

/* ── Render ──────────────────────────────────────────────────── */

function renderMadeIt() {
  const historyList = $('#madeItHistory');
  const emptyEl = $('#madeItEmpty');
  const statsEl = $('#madeItStats');
  const journalCard = $('#madeItJournal');
  if (!historyList) return;

  const history = getRef('cookHistory');

  if (!history.length) {
    historyList.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    if (statsEl) statsEl.hidden = true;
    if (journalCard) journalCard.hidden = true;
    return;
  }

  if (emptyEl) emptyEl.hidden = true;
  if (statsEl) statsEl.hidden = false;
  if (journalCard) journalCard.hidden = false;

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

  // Journal list — compact rows with thumbnail, name, rating, date, delete
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
}
