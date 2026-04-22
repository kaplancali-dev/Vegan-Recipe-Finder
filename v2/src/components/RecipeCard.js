/**
 * RecipeCard — renders a single recipe card in a list.
 *
 * Matches v1 layout: vertical card with hero image on top,
 * title/meta, progress bar, nutrition row, ingredient chips,
 * and action buttons. Parent handles click events via delegation.
 */

import { escHTML, colorDigits } from '../utils/text.js';

/**
 * Return a CSS class for the match percentage tier.
 * @param {number} pct
 * @returns {string}
 */
function matchTier(pct) {
  if (pct >= 80) return 'hi';
  if (pct >= 40) return 'md';
  return 'lo';
}

/**
 * Render a single ingredient chip.
 * @param {string} name
 * @param {string} cls - 'c-have' or 'c-need'
 */
function ingChip(name, cls) {
  return `<span class="${cls}">${escHTML(name)}</span>`;
}

/**
 * Render a recipe card as an HTML string.
 *
 * @param {Object} result - Scored recipe from findRecipes().
 * @param {Object} [opts]
 * @param {boolean} [opts.showMatch=true]
 * @param {boolean} [opts.isFavorite=false]
 * @returns {string} HTML string
 */
export function renderCard(result, opts = {}) {
  const { showMatch = true, isFavorite = false } = opts;
  const r = result;

  const tier = matchTier(r.pct);
  const heroClass = r.img ? ' has-hero' : '';
  const hero = r.img
    ? `<div class="hero-wrap"><img loading="lazy" decoding="async" src="${escHTML(r.img)}" alt="${escHTML(r.title)}"></div>`
    : '';

  const matchPill = showMatch && r.pct !== undefined
    ? `<span class="match-pill ${tier}">${colorDigits(r.pct)}%</span>`
    : '';

  const timeStr = r.time ? `<span>⏱ ${r.time} min</span>` : '';
  const servStr = r.servings ? `<span>👤 ${r.servings} servings</span>` : '';

  // Nutrition row
  const nut = r.nut || {};
  const nutRow = r.nut ? `
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${nut.cal ?? '—'}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${nut.pro ?? '—'}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${nut.carb ?? '—'}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${nut.fat ?? '—'}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${nut.fib ?? '—'}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>` : '';

  // Ingredient chips (have / need)
  const haveNames = r.haveNames || [];
  const needNames = r.needNames || [];
  const haveChips = haveNames.length
    ? `<div class="chip-label-sm">You have</div><div class="chips">${haveNames.map(n => ingChip(n, 'c-have')).join('')}</div>`
    : '';
  const needChips = needNames.length
    ? `<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${needNames.map(n => ingChip(n, 'c-need')).join('')}</div>`
    : '';

  // Action buttons
  const favLabel = isFavorite ? '❤️ Saved' : '🤍 Save';

  return `
    <article class="r-card ${tier}${heroClass}" data-recipe-id="${r.id}">
      ${hero}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${escHTML(r.title)}</div>
            <div class="r-site">${escHTML(r.site || '')}</div>
          </div>
          <div class="r-right">
            ${matchPill}
          </div>
        </div>
        ${showMatch ? `<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${r.pct ?? 0}%"></div></div></div>` : ''}
        <div class="r-meta">
          ${timeStr}${servStr}
          <span>✅ ${haveNames.length}/${r.ing?.length ?? 0} ingredients</span>
        </div>
        ${nutRow}
        ${haveChips}
        ${needChips}
        <div class="r-actions">
          ${r.url ? `<a href="${escHTML(r.url)}" target="_blank" rel="noopener" class="btn-sm btn-link" data-external>📖 View Instructions</a>` : ''}
          <button class="btn-sm btn-fav fav-btn${isFavorite ? ' on' : ''}" data-fav-id="${r.id}" aria-label="Toggle favorite">${favLabel}</button>
          ${needNames.length ? `<button class="btn-sm btn-shop shop-btn" data-shop-id="${r.id}">🛒 Add Missing</button>` : ''}
        </div>
      </div>
    </article>
  `;
}

/**
 * Render a list of recipe cards.
 * @param {Array} results - Scored recipes
 * @param {Set} favorites - Set of favorite recipe IDs
 * @param {Object} [opts] - Options passed to renderCard
 * @returns {string} HTML string
 */
export function renderCardList(results, favorites, opts = {}) {
  if (!results.length) return '';
  return results.map(r => renderCard(r, {
    ...opts,
    isFavorite: favorites.has(r.id),
  })).join('');
}
