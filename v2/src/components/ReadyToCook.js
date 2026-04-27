/**
 * ReadyToCook — shows recipes the user can make right now.
 *
 * Filters to recipes missing 1 or fewer ingredients (matching v1 behavior),
 * sorted by match percentage descending. Includes search bar and category filters.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes } from '../services/matching.js';
import { $ } from '../utils/dom.js';
import { toggleFavorite } from '../actions/favorites.js';
import { V1_CATEGORIES } from '../data/categories.js';
import { handleShareClick } from '../actions/share.js';
import { renderCardList } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';
import { showToast } from '../utils/toast.js';
import { handleCook } from '../actions/cook.js';
import { stem, escHTML } from '../utils/text.js';
import { buildAllergenFilterChips } from './AllergenChips.js';

/** @type {Array} Full recipe list */
let _recipes = [];

/** Maximum number of missing ingredients to show in Ready to Make */
const MAX_MISSING = 1;

/** Search query for Ready tab */
let _readySearch = '';

/** Category filters for Ready tab */
let _readyCats = new Set();

/** Max cook time for Ready tab */
let _readyMaxTime = Infinity;

/** Debounce timer */
let _searchTimer = null;

/** Pending render frame ID */
let _pendingRender = 0;

/* V1_CATEGORIES imported from ../data/categories.js */

/**
 * Initialize the Ready to Cook tab.
 * @param {Array} recipes
 */
export function initReadyToCook(recipes) {
  _recipes = recipes;

  wireReadySearch();
  wireReadyFilters();
  buildReadyCategoryChips();
  buildAllergenFilterChips('#readyAllergenChips', scheduleReadyRender);
  renderReadyList();

  subscribe('ingredients', scheduleReadyRender);
  subscribe('staples', scheduleReadyRender);
  subscribe('favorites', scheduleReadyRender);
  subscribe('makelist', scheduleReadyRender);
  subscribe('allergies', () => {
    buildAllergenFilterChips('#readyAllergenChips', scheduleReadyRender);
    scheduleReadyRender();
  });
  subscribe('cookHistory', scheduleReadyRender);
}

/**
 * Wire up the search input for the Ready tab.
 */
function wireReadySearch() {
  const input = $('#readySearch');
  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      _readySearch = input.value.trim();
      scheduleReadyRender();
    }, 250);
  });
}

/**
 * Wire up filter toggle, time slider for Ready tab.
 */
function wireReadyFilters() {
  // Filter toggle
  const filterBtn = $('#readyFilterToggle');
  const drawer = $('#readyFilterDrawer');
  if (filterBtn && drawer) {
    filterBtn.addEventListener('click', () => {
      drawer.hidden = !drawer.hidden;
      filterBtn.textContent = drawer.hidden ? 'Filters' : 'Close';
    });
  }

  // Time slider
  const slider = $('#readyTimeSlider');
  const label = $('#readyTimeLabel');
  if (slider && label) {
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      _readyMaxTime = val >= 120 ? Infinity : val;
      label.textContent = val >= 120 ? 'Any' : `${val} min`;
    });
    slider.addEventListener('change', scheduleReadyRender);
  }
}

/**
 * Build category filter chips for Ready tab.
 */
function buildReadyCategoryChips() {
  const container = $('#readyCatFilters');
  if (!container) return;

  container.innerHTML = V1_CATEGORIES.map(({ label, icon, filter }) => {
    const catKey = filter || label;
    return `<button class="filter-chip" data-cat="${escHTML(catKey)}">${icon} ${escHTML(label)}</button>`;
  }).join('');

  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const cat = chip.dataset.cat;
    if (_readyCats.has(cat)) {
      _readyCats.delete(cat);
      chip.classList.remove('on');
    } else {
      _readyCats.add(cat);
      chip.classList.add('on');
    }
    scheduleReadyRender();
  });
}

/**
 * Render active filter tags for Ready tab.
 */
function renderReadyActiveFilters() {
  const container = $('#readyActiveFilters');
  if (!container) return;

  const tags = [];

  if (_readySearch) {
    tags.push(`<span class="active-filter-tag" data-clear="search">"${escHTML(_readySearch)}" ×</span>`);
  }

  _readyCats.forEach(cat => {
    tags.push(`<span class="active-filter-tag" data-clear-cat="${escHTML(cat)}">${escHTML(cat)} ×</span>`);
  });

  if (_readyMaxTime !== Infinity) {
    tags.push(`<span class="active-filter-tag" data-clear="time">≤${_readyMaxTime}min ×</span>`);
  }

  container.innerHTML = tags.join('');

  container.onclick = (e) => {
    const tag = e.target.closest('.active-filter-tag');
    if (!tag) return;

    if (tag.dataset.clear === 'search') {
      _readySearch = '';
      const input = $('#readySearch');
      if (input) input.value = '';
    } else if (tag.dataset.clear === 'time') {
      _readyMaxTime = Infinity;
      const slider = $('#readyTimeSlider');
      const label = $('#readyTimeLabel');
      if (slider) slider.value = 120;
      if (label) label.textContent = 'Any';
    } else if (tag.dataset.clearCat) {
      _readyCats.delete(tag.dataset.clearCat);
      const chip = document.querySelector(`#readyCatFilters .filter-chip[data-cat="${tag.dataset.clearCat}"]`);
      if (chip) chip.classList.remove('on');
    }

    scheduleReadyRender();
  };
}

/**
 * Schedule a deferred render (yields to browser for INP).
 */
function scheduleReadyRender() {
  cancelAnimationFrame(_pendingRender);
  _pendingRender = requestAnimationFrame(() => {
    renderReadyList();
  });
}

/**
 * Render the ready-to-cook recipe list.
 */
function renderReadyList() {
  const container = $('#canMakeList');
  const emptyEl = $('#canMakeEmpty');
  const badge = $('#readyCount');
  if (!container) return;

  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const favs = new Set(getRef('favorites'));
  const allergies = getRef('allergies');

  // Only run if user has some ingredients
  if (!ings.length && !staples.length) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    if (badge) badge.textContent = '';
    return;
  }

  const allResults = findRecipes({
    recipes: _recipes,
    ingredients: ings,
    staples,
    selectedCats: _readyCats.size ? [..._readyCats] : undefined,
    maxTime: _readyMaxTime === Infinity ? undefined : _readyMaxTime,
    allergies: allergies.length ? new Set(allergies) : undefined,
  });

  // Filter to recipes missing 1 or fewer ingredients (matches v1 behavior)
  let ready = allResults.filter(r => (r.needNames?.length ?? 0) <= MAX_MISSING);

  // Apply search filter if present
  if (_readySearch) {
    const q = _readySearch.toLowerCase();
    ready = ready.filter(r => {
      const t = r.title.toLowerCase();
      const ingStr = (r.ing || []).join(' ').toLowerCase();

      // Full-phrase match first
      if (t.includes(q) || ingStr.includes(q)) return true;

      // Word-boundary fallback — "ice" matches "ice" but not "rice"
      const words = q.split(/\s+/);
      return words.every(w => {
        const s = stem(w);
        const re = new RegExp(`(^|[\\s,\\-\\(])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s,\\-\\)])`);
        const reStem = w !== s ? new RegExp(`(^|[\\s,\\-\\(])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s,\\-\\)])`) : null;
        return re.test(t) || re.test(ingStr) || (reStem && (reStem.test(t) || reStem.test(ingStr)));
      });
    });
  }

  // Render active filter tags
  renderReadyActiveFilters();

  if (badge) {
    badge.textContent = ready.length > 0 ? String(ready.length) : '';
  }

  if (!ready.length) {
    container.innerHTML = '';
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.innerHTML = (_readySearch || _readyCats.size || _readyMaxTime !== Infinity)
        ? '<p>No matching recipes found. Try adjusting your filters.</p>'
        : ings.length || staples.length
          ? '<p>No recipes with 1 or fewer missing ingredients yet. Add more to your pantry!</p>'
          : '<p>Add ingredients to your pantry to see what you can make!</p>';
    }
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  const makeIds = getRef('makelist');
  const cookHistory = getRef('cookHistory');
  container.innerHTML = renderCardList(ready, favs, { makelist: makeIds, cookHistory, userIngs: [...ings, ...staples] });

  // Event delegation
  container.onclick = (e) => {
    // External links
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
        showToast('Removed from Shopping List');
      } else {
        current.push(id);
        set('makelist', current);
        showToast('Added to Shopping List 🛒');
      }
      autoSync();
      return;
    }

    // Cook button — log "I Made This" (with undo if already cooked)
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
