/**
 * Recipe of the Day — deterministic daily spotlight.
 *
 * Uses the current date as a seed to pick one recipe per day.
 * Custom horizontal card layout: image left, info right.
 * Only picks high-protein savory recipes with colorful ingredients.
 */

import { get, set, getRef, subscribe } from '../state/store.js';
import { findRecipes } from '../services/matching.js';
import { escHTML, decodeHTML, stripMeasure } from '../utils/text.js';
import { gfSwap, sugarSwap } from './RecipeCard.js';
import { findSubstitute } from '../utils/substitutions.js';
import { getIngredientBenefits } from '../data/ingredient-benefits.js';
import { openDetail } from './RecipeDetail.js';
import { toggleFavorite } from '../actions/favorites.js';
import { handleShareClick } from '../actions/share.js';
import { handleCook } from '../actions/cook.js';
import { showToast } from '../utils/toast.js';
import { autoSync } from '../services/sync.js';
import { $ } from '../utils/dom.js';

/**
 * Simple hash from a date string → stable integer.
 */
function hashDate(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Categories considered desserts — skip for ROTD */
const DESSERT_CATS = new Set([
  'Dessert', 'Baking', 'Snack', 'Breakfast', 'Smoothie',
]);

/** Preferred creator sites — these tend to have professional photos */
const PREFERRED_SITES = new Set([
  'Lazy Cat Kitchen',
  'Rainbow Plant Life',
  'Pick Up Limes',
  'Vegan Richa',
  'Minimalist Baker',
  'Loving It Vegan',
]);

/**
 * Pick today's recipe. Deterministic: same date → same recipe.
 * Filters: has image, ≥20g protein, not a dessert, ≥10 ingredients.
 * Prefers recipes from popular creators with great photos.
 */
function pickROTD(recipes) {
  const base = recipes.filter(r =>
    r.img &&
    r.nut && r.nut.pro >= 20 &&
    r.ing && r.ing.length >= 10 && r.ing.length <= 15 &&
    r.time && r.time <= 90 &&
    !r.cats?.some(c => DESSERT_CATS.has(c))
  );
  if (!base.length) return null;

  // Prefer recipes from top creators; fall back to full pool if needed
  const preferred = base.filter(r => r.site && PREFERRED_SITES.has(r.site));
  const candidates = preferred.length >= 30 ? preferred : base;

  const today = new Date();
  const dateStr = `harvest-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const idx = hashDate(dateStr) % candidates.length;
  return candidates[idx];
}

let _rotdRecipe = null;
let _recipes = [];

export function initROTD(recipes) {
  _recipes = recipes;
  _rotdRecipe = pickROTD(recipes);
  if (!_rotdRecipe) return;

  renderROTD();

  subscribe('ingredients', renderROTD);
  subscribe('staples', renderROTD);
  subscribe('favorites', renderROTD);
  subscribe('makelist', renderROTD);
  subscribe('cookHistory', renderROTD);
}

function renderROTD() {
  const container = $('#rotdSpotlight');
  if (!container || !_rotdRecipe) return;

  const r = _rotdRecipe;
  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const favs = new Set(getRef('favorites'));
  const makeIds = getRef('makelist');
  const cookHistory = getRef('cookHistory') || [];

  // Score against pantry
  const results = findRecipes({
    recipes: [r],
    ingredients: ings,
    staples,
    selectedCats: [],
    allergies: new Set(),
  });
  const scored = results[0] || { ...r, pct: 0, haveNames: [], needNames: r.ing || [] };

  const isFav = favs.has(r.id);
  const isQueued = makeIds.includes(r.id);
  const cooked = cookHistory.filter(h => h.id === r.id);
  const lastCook = cooked.length ? cooked[cooked.length - 1] : null;

  const nut = r.nut || {};
  const matchInfo = (ings.length > 0 || staples.length > 0) ? `<span class="rotd-match">${scored.pct}% match</span>` : '';

  // Compact ingredient summary with all swap hints (GF, sugar, general subs)
  const haveNames = scored.haveNames || [];
  const needNames = scored.needNames || [];
  const allUserIngs = [...ings, ...staples];

  function ingWithSwap(name, isNeed) {
    const display = escHTML(stripMeasure(decodeHTML(name)));
    const gf = gfSwap(name);
    const sf = sugarSwap(name);
    let hints = '';
    if (gf) hints += ` <em class="rotd-hint-gf">(GF: ${escHTML(gf)})</em>`;
    if (sf) hints += ` <em class="rotd-hint-sf">(${display} swap: ${escHTML(sf)} to significantly reduce calories/carbs)</em>`;
    // General substitution hint for missing ingredients
    if (isNeed && allUserIngs.length) {
      const sub = findSubstitute(name, allUserIngs);
      if (sub) hints += ` <em class="rotd-hint-sub">(💡 try ${escHTML(sub)})</em>`;
    }
    if (hints) return `<span class="${gf ? 'rotd-ing-gf' : sf ? 'rotd-ing-sf' : ''}">${display}${hints}</span>`;
    return display;
  }

  const haveStr = haveNames.length
    ? `<span class="rotd-have"><strong>You have:</strong> ${haveNames.map(n => ingWithSwap(n, false)).join(', ')}</span>`
    : '';
  const needStr = needNames.length
    ? `<span class="rotd-need"><strong>You need:</strong> ${needNames.map(n => ingWithSwap(n, true)).join(', ')}</span>`
    : '';

  // Category tags
  const cats = r.cats || [];
  const catChips = cats.map(c => `<span class="rotd-cat">${escHTML(c)}</span>`).join('');

  // Collect unique health benefits from all ingredients
  const allIngs = [...(r.ing || [])];
  const benefitSet = new Set();
  const benefitItems = [];
  for (const ing of allIngs) {
    const info = getIngredientBenefits(ing);
    if (info && info.benefits) {
      for (const b of info.benefits) {
        if (!benefitSet.has(b)) {
          benefitSet.add(b);
          benefitItems.push(b);
        }
      }
    }
  }
  const benefitsHtml = benefitItems.length
    ? benefitItems.slice(0, 5).map(b => `<span class="rotd-benefit">✦ ${escHTML(b)}</span>`).join('')
    : '';

  let cookLabel = '☐ I Made This';
  if (lastCook) {
    const d = new Date(typeof lastCook === 'string' ? lastCook : lastCook.date)
      .toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    const stars = (typeof lastCook === 'object' && lastCook.rating) ? ' ' + '★'.repeat(lastCook.rating) : '';
    cookLabel = `✅ Made ${d}${stars}`;
  }

  container.innerHTML = `
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${r.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${escHTML(r.img)}" alt="${escHTML(r.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-top">
          <div class="rotd-title">${escHTML(r.title)}</div>
          ${matchInfo}
        </div>
        <div class="rotd-site">${escHTML(r.site || '')} · ${r.time ? `${r.time} min` : ''} · ${r.servings ? `${r.servings} servings` : ''} · ${r.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${nut.cal ?? '—'} <span>cal</span></div>
          <div>${nut.pro ?? '—'}g <span>protein</span></div>
          <div>${nut.carb ?? '—'}g <span>carbs</span></div>
          <div>${nut.fat ?? '—'}g <span>fat</span></div>
          <div>${nut.fib ?? '—'}g <span>fiber</span></div>
        </div>
        ${haveStr || needStr ? `<div class="rotd-ings">${haveStr}${haveStr && needStr ? '<br>' : ''}${needStr}</div>` : ''}
        ${catChips ? `<div class="rotd-cats">${catChips}</div>` : ''}
        ${benefitsHtml ? `<div class="rotd-benefits"><div class="rotd-benefits-label">🌿 Health Benefits</div>${benefitsHtml}</div>` : ''}
        <div class="rotd-actions">
          ${r.url ? `<a href="#" class="btn-sm btn-link" data-recipe-url="${escHTML(r.url)}" data-recipe-title="${escHTML(r.title)}" data-recipe-site="${escHTML(r.site || '')}">📖 View Instructions</a>` : ''}
          <button class="btn-sm btn-shop make-btn${isQueued ? ' on' : ''}" data-make-id="${r.id}">${isQueued ? '✓ My Queue' : '📌 My Queue'}</button>
          <button class="btn-sm btn-fav fav-btn${isFav ? ' on' : ''}" data-fav-id="${r.id}">${isFav ? '❤️ Favorited' : '🤍 Favorite'}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${r.id}">${cookLabel}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${r.id}" data-share-title="${escHTML(r.title)}" data-share-url="${escHTML(r.url || '')}">📤 Share</button>
        </div>
      </div>
    </div>
  `;
  container.hidden = false;

  // Event delegation
  container.onclick = (e) => {
    if (e.target.closest('[data-recipe-url]')) return;
    if (handleShareClick(e)) return;

    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) { e.stopPropagation(); toggleFavorite(Number(favBtn.dataset.favId)); return; }

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
    if (cookBtn) { e.stopPropagation(); handleCook(Number(cookBtn.dataset.cookId), { title: cookBtn.dataset.cookTitle }); return; }

    if (e.target.closest('.rotd-actions')) return;
    const card = e.target.closest('.rotd-card');
    if (card) openDetail(Number(card.dataset.recipeId));
  };
}
