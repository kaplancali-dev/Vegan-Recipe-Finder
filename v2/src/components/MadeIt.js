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
        const id = Number(delBtn.dataset.cookDelete);
        const history = get('cookHistory');
        set('cookHistory', history.filter(h => h.id !== id));
        autoSync();
        showToast('Removed from cooking journal');
        return;
      }

      // Star rating click
      const star = e.target.closest('.star-btn');
      if (star) {
        e.stopPropagation();
        const id = Number(star.dataset.starId);
        const newRating = Number(star.dataset.star);
        const history = get('cookHistory');
        set('cookHistory', history.map(h =>
          h.id === id ? { ...h, rating: newRating } : h
        ));
        autoSync();
        showToast(`Rated ${newRating} star${newRating !== 1 ? 's' : ''}`);
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
  subscribe('instructions', renderMadeIt);
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

  // Deduplicate: keep the earliest entry per recipe (first made),
  // but preserve the latest rating if updated
  const seen = new Map();
  for (const entry of history) {
    const prev = seen.get(entry.id);
    if (!prev) {
      seen.set(entry.id, { ...entry });
    } else {
      if (new Date(entry.date) < new Date(prev.date)) prev.date = entry.date;
      if (entry.rating) prev.rating = entry.rating;
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

  // Journal list — compact rows with thumbnail, name, notes preview, rating, date, delete
  const allNotes = get('instructions') || {};

  historyList.innerHTML = unique.map(entry => {
    const recipe = _recipes.find(r => r.id === entry.id);
    const title = recipe ? escHTML(recipe.title) : `Recipe #${entry.id}`;
    const img = recipe?.img || '';
    const date = new Date(entry.date).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const r = entry.rating || 0;
    const stars = [1,2,3,4,5].map(n =>
      `<span class="star-btn${n <= r ? ' on' : ''}" data-star="${n}" data-star-id="${entry.id}">${n <= r ? '★' : '☆'}</span>`
    ).join('');
    const note = allNotes[entry.id] || '';
    const notePreview = note ? escHTML(note.length > 50 ? note.slice(0, 50) + '…' : note) : '';
    const noteHtml = notePreview
      ? `<span class="cook-note-preview" title="${escHTML(note)}">📝 ${notePreview}</span>`
      : '<span class="cook-note-preview"></span>';
    return `<div class="cook-history-item">
      ${img ? `<img class="cook-history-img" src="${escHTML(img)}" alt="" loading="lazy">` : '<div class="cook-history-img cook-history-img-empty"></div>'}
      <a class="cook-history-link" data-recipe-id="${entry.id}">${title}</a>
      ${noteHtml}
      <span class="cook-stars cook-stars-editable">${stars}</span>
      <span class="cook-date">${date}</span>
      <button class="cook-delete-btn" data-cook-delete="${entry.id}" aria-label="Remove">✕</button>
    </div>`;
  }).join('');
}
