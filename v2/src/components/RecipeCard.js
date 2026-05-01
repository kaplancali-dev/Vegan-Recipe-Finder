/**
 * RecipeCard — renders a single recipe card in a list.
 *
 * Matches v1 layout: vertical card with hero image on top,
 * title/meta, progress bar, nutrition row, ingredient chips,
 * and action buttons. Parent handles click events via delegation.
 */

import { escHTML, decodeHTML, norm, stripMeasure } from '../utils/text.js';

import { findSubstitute } from '../utils/substitutions.js';
import { GF_SWAPS, SUGAR_SWAPS } from '../data/aliases.js';

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

/* ── Pre-normalized GF swap lookup ─────────────────────────── */

const _gfLookup = new Map();
for (const [key, val] of Object.entries(GF_SWAPS)) {
  _gfLookup.set(norm(key), val);
}

/** Ingredients that are already gluten-free — never show a GF swap */
const _gfSafe = new Set([
  'almond flour', 'oat flour', 'rice flour', 'coconut flour',
  'chickpea flour', 'buckwheat flour', 'cassava flour', 'tapioca flour',
  'brown rice flour', 'gluten-free flour', 'gf flour',
  'cornstarch', 'arrowroot powder', 'arrowroot starch', 'potato starch',
  'tapioca starch', 'corn tortilla', 'rice noodles', 'rice paper',
  'rice paper wrappers', 'tamari', 'coconut aminos',
  'gf breadcrumbs', 'gf panko', 'gf pasta', 'gf bread', 'gluten-free bread',
  'gf naan', 'gf pita', 'gf buns', 'gf tortillas', 'corn tortillas',
  'miso', 'white miso', 'red miso', 'yellow miso', 'light miso', 'miso paste',
].map(norm));

/**
 * Find a GF swap for an ingredient name, if one exists.
 * Skips ingredients that are already gluten-free.
 * @param {string} name - Ingredient name (raw)
 * @returns {string|null}
 */
export function gfSwap(name) {
  const n = norm(name);
  // Skip already-GF ingredients
  if (_gfSafe.has(n)) return null;
  for (const safe of _gfSafe) {
    if (n.includes(safe)) return null;
  }
  // Exact match
  const exact = _gfLookup.get(n);
  if (exact) return exact;
  // Substring match — check if any GF keyword appears in the ingredient name
  // Prefer longest match to get most specific swap (e.g. "penne pasta" over "pasta")
  let bestMatch = null;
  let bestLen = 0;
  for (const [key, val] of _gfLookup) {
    if (n.includes(key) && key.length > 3 && key.length > bestLen) {
      bestMatch = val;
      bestLen = key.length;
    }
  }
  return bestMatch;
}

/* ── Pre-normalized sugar swap lookup ──────────────────────── */

const _sugarLookup = new Map();
for (const [key, val] of Object.entries(SUGAR_SWAPS)) {
  _sugarLookup.set(norm(key), val);
}

/**
 * Find a sugar-free swap for an ingredient name, if one exists.
 * Checks exact match first, then checks if any sugar keyword
 * appears in the ingredient name (handles "¼ cup turbinado sugar").
 * @param {string} name - Ingredient name (raw)
 * @returns {string|null}
 */
/** Natural sweeteners that should never get a sugar swap hint */
const _sugarSafe = new Set(['maple syrup', 'maple', 'date syrup', 'molasses', 'coconut nectar'].map(norm));

export function sugarSwap(name) {
  const n = norm(name);
  // Skip natural sweeteners we want to keep as-is
  if (_sugarSafe.has(n)) return null;
  for (const safe of _sugarSafe) { if (n.includes(safe)) return null; }
  // Exact match
  const exact = _sugarLookup.get(n);
  if (exact) return exact;
  // Substring match — check if any sugar keyword is in the ingredient
  for (const [key, val] of _sugarLookup) {
    if (n.includes(key) && key.length > 3) return val;
  }
  return null;
}

/**
 * Render a single ingredient chip.
 * Perishable "have" ingredients get a distinct visual style.
 * Non-GF ingredients show an inline swap hint.
 * @param {string} name
 * @param {string} cls - 'c-have' or 'c-need'
 */
function ingChip(name, cls) {
  const display = stripMeasure(decodeHTML(name));
  const gf = gfSwap(name);
  const sf = sugarSwap(name);
  const gfTag = gf ? `<span class="gf-swap">GF: ${escHTML(gf)}</span>` : '';
  const sfTag = sf ? `<span class="sf-swap">${escHTML(display)} swap: ${escHTML(sf)} to significantly reduce calories/carbs</span>` : '';

  const extraCls = gf ? ' c-gluten' : sf ? ' c-sugar' : '';
  return `<span class="${cls}${extraCls}">${escHTML(display)}${gfTag}${sfTag}</span>`;
}

/**
 * Render a recipe card as an HTML string.
 *
 * @param {Object} result - Scored recipe from findRecipes().
 * @param {Object} [opts]
 * @param {boolean} [opts.showMatch=true]
 * @param {boolean} [opts.isFavorite=false]
 * @param {Array} [opts.cookedDates] - Dates this recipe was cooked
 * @param {string[]} [opts.userIngs] - All user ingredients for substitution hints
 * @returns {string} HTML string
 */
export function renderCard(result, opts = {}) {
  const { showMatch = true, isFavorite = false, isOnMakeList = false, cookedDates = [], userIngs = [], hasNotes = false } = opts;
  const r = result;

  const tier = matchTier(r.pct);
  const heroClass = r.img ? ' has-hero' : '';
  const hero = r.img
    ? `<div class="hero-wrap"><img loading="lazy" decoding="async" src="${escHTML(r.img)}" alt="${escHTML(r.title)}"></div>`
    : '';

  const matchPill = showMatch && r.pct !== undefined
    ? `<span class="match-pill ${tier}">${r.pct}%</span>`
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

  // Category tags
  const cats = r.cats || [];
  const catChips = cats.length
    ? `<div class="card-cats">${cats.map(c => `<span class="card-cat">${escHTML(c)}</span>`).join('')}</div>`
    : '';

  // Ingredient chips (have / need)
  const haveNames = r.haveNames || [];
  const needNames = r.needNames || [];
  const haveChips = haveNames.length
    ? `<div class="chip-label-sm">You have</div><div class="chips">${haveNames.map(n => ingChip(n, 'c-have')).join('')}</div>`
    : '';
  const needChips = needNames.length
    ? `<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${needNames.map(n => ingChip(n, 'c-need')).join('')}</div>`
    : '';

  // Substitution hint: only when exactly 1 missing ingredient
  const subHint = needNames.length === 1 && userIngs.length
    ? findSubstitute(needNames[0], userIngs)
    : null;
  const subHtml = subHint
    ? `<div class="sub-hint">💡 Try ${escHTML(subHint)} instead of ${escHTML(needNames[0])}</div>`
    : '';

  // Action buttons — compact inline (matches ROTD style)
  const favLabel = isFavorite ? '❤️ Fav' : '🤍 Fav';
  const makeLabel = isOnMakeList ? '✓ Queue' : '📌 Queue';

  // Cook button label — show date and star rating if available
  const lastEntry = cookedDates.length ? cookedDates[cookedDates.length - 1] : null;
  let cookLabel;
  if (lastEntry) {
    const dateStr = new Date(typeof lastEntry === 'string' ? lastEntry : lastEntry.date)
      .toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    const rating = typeof lastEntry === 'object' ? lastEntry.rating : 0;
    const stars = rating ? ' ' + '★'.repeat(rating) : '';
    cookLabel = `✅ Made ${dateStr}${stars}`;
  } else {
    cookLabel = '☐ Made It';
  }

  return `
    <article class="r-card ${tier}${heroClass}" data-recipe-id="${r.id}">
      ${hero}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${escHTML(r.title)}${hasNotes ? ' <span class="notes-badge" title="You have notes on this recipe">📝</span>' : ''}</div>
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
        ${catChips}
        ${haveChips}
        ${needChips}
        ${subHtml}
        <div class="r-actions">
          ${r.url ? `<a href="#" class="btn-sm btn-link" data-recipe-url="${escHTML(r.url)}" data-recipe-title="${escHTML(r.title)}" data-recipe-site="${escHTML(r.site || '')}">📖 Instructions</a>` : ''}
          <button class="btn-sm btn-shop make-btn${isOnMakeList ? ' on' : ''}" data-make-id="${r.id}">${makeLabel}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${r.id}" data-cook-title="${escHTML(r.title)}">${cookLabel}</button>
          <button class="btn-sm btn-fav fav-btn${isFavorite ? ' on' : ''}" data-fav-id="${r.id}" aria-label="Toggle favorite">${favLabel}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${r.id}" data-share-title="${escHTML(r.title)}" data-share-url="${escHTML(r.url || '')}">📤 Share</button>
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
  const makeSet = opts.makelist ? new Set(opts.makelist) : new Set();
  const cookHistory = opts.cookHistory || [];
  const notes = opts.notes || {};
  return results.map(r => {
    const cookedDates = cookHistory
      .filter(h => h.id === r.id);
    return renderCard(r, {
      ...opts,
      isFavorite: favorites.has(r.id),
      isOnMakeList: makeSet.has(r.id),
      cookedDates,
      hasNotes: !!notes[r.id],
    });
  }).join('');
}
