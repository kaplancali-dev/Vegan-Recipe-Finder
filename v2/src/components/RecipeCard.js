/**
 * RecipeCard — renders a single recipe card in a list.
 *
 * Pure function: takes a scored recipe result and returns an HTML string.
 * The parent component handles click events via event delegation.
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
 * Return a CSS class for the bar fill tier.
 * @param {number} pct
 * @returns {string}
 */
function barTier(pct) {
  if (pct >= 60) return '';
  if (pct >= 30) return 'mid';
  return 'low';
}

/**
 * Render a recipe card as an HTML string.
 *
 * @param {Object} result - Scored recipe from findRecipes().
 *   Extends the base recipe with: pct, have, haveNames, missing, missingNames
 * @param {Object} [opts] - Rendering options
 * @param {boolean} [opts.showMatch=true] - Show match percentage pill
 * @param {boolean} [opts.isFavorite=false] - Show filled heart
 * @returns {string} HTML string
 */
export function renderCard(result, opts = {}) {
  const { showMatch = true, isFavorite = false } = opts;
  const r = result;

  const tier = matchTier(r.pct);
  const favIcon = isFavorite ? '❤️' : '🤍';

  const matchPill = showMatch && r.pct !== undefined
    ? `<span class="match-pill ${tier}">${colorDigits(r.pct)}%</span>`
    : '';

  const timeStr = r.time ? `⏱ ${r.time} min` : '';
  const servStr = r.servings ? `🍽 ${r.servings} serv` : '';

  const imgHtml = r.img
    ? `<img class="r-card-img" loading="lazy" decoding="async" src="${escHTML(r.img)}" alt="${escHTML(r.title)}">`
    : '';

  return `
    <article class="r-card${r.img ? ' has-img' : ''}" data-recipe-id="${r.id}">
      ${imgHtml}
      <div class="r-card-body">
        <div class="r-card-top">
          <div>
            <div class="r-title">${escHTML(r.title)}</div>
            <div class="r-site">${escHTML(r.site || '')}</div>
          </div>
          <div class="r-actions">
            ${matchPill}
            <button class="icon-btn fav-btn" data-fav-id="${r.id}" aria-label="Toggle favorite" title="Toggle favorite">${favIcon}</button>
          </div>
        </div>
        <div class="r-meta">
          ${timeStr ? `<span>${timeStr}</span>` : ''}
          ${servStr ? `<span>${servStr}</span>` : ''}
          <span>${r.have ?? 0}/${r.ing?.length ?? 0} ingredients</span>
        </div>
        ${showMatch ? `<div class="bar-bg"><div class="bar-fill ${barTier(r.pct)}" style="width:${r.pct ?? 0}%"></div></div>` : ''}
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
