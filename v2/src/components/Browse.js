/**
 * Browse — the main recipe browsing tab.
 *
 * Manages the filter drawer, search input, sort controls,
 * and renders the filtered/sorted recipe card list.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { findRecipes, sortResults } from '../services/matching.js';
import { escHTML } from '../utils/text.js';
import { $, $$ } from '../utils/dom.js';
import { V1_CATEGORIES } from '../data/categories.js';
import { toggleFavorite } from '../actions/favorites.js';
import { handleShareClick } from '../actions/share.js';
import { renderCardList } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';
import { showToast } from '../utils/toast.js';
import { handleCook } from '../actions/cook.js';
import { buildAllergenFilterChips } from './AllergenChips.js';

/** How many recipes to show per page */
const PAGE_SIZE = 50;

/** @type {Array} Full recipe list */
let _recipes = [];

/** Current filter/sort state */
let _selectedCats = new Set();
let _maxTime = Infinity;
let _nameSearch = '';
let _allergies = new Set();
let _sortKey = 'match';

/** Pagination: how many results currently visible */
let _visibleCount = PAGE_SIZE;

/** Cached full result set (before pagination) */
let _lastResults = [];

/** Debounce timer for search input */
let _searchTimer = null;

/** Pending render frame ID (for cancelling stale renders) */
let _pendingRender = 0;

/**
 * Initialize the Browse tab.
 * @param {Array} recipes
 */
export function initBrowse(recipes) {
  _recipes = recipes;

  // Load user allergies from state
  const savedAllergies = get('allergies');
  if (Array.isArray(savedAllergies)) {
    _allergies = new Set(savedAllergies);
  }

  buildCategoryChips();
  buildAllergenFilterChips('#browseAllergenChips', renderResults);
  wireControls();
  renderResults();

  // Re-render when ingredients or staples change
  subscribe('ingredients', renderResults);
  subscribe('staples', renderResults);
  subscribe('favorites', renderResults);
  subscribe('makelist', renderResults);
  subscribe('cookHistory', renderResults);
  subscribe('allergies', (val) => {
    _allergies = new Set(val);
    buildAllergenFilterChips('#browseAllergenChips', renderResults);
    renderResults();
  });
}

/* V1_CATEGORIES imported from ../data/categories.js */

/**
 * Build category filter chips from the fixed v1 category list.
 */
function buildCategoryChips() {
  const container = $('#catFilters');
  if (!container) return;

  container.innerHTML = V1_CATEGORIES.map(({ label, icon, filter }) => {
    const catKey = filter || label;
    return `<button class="filter-chip" data-cat="${escHTML(catKey)}">${icon} ${escHTML(label)}</button>`;
  }).join('');

  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const cat = chip.dataset.cat;
    if (_selectedCats.has(cat)) {
      _selectedCats.delete(cat);
      chip.classList.remove('on');
    } else {
      _selectedCats.add(cat);
      chip.classList.add('on');
    }
    renderResults();
  });
}

/**
 * Wire up search input, filter toggle, time slider, and sort buttons.
 */
function wireControls() {
  // Name search (debounced)
  const searchInput = $('#nameSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(() => {
        _nameSearch = searchInput.value.trim();
        renderResults();
      }, 250);
    });
  }

  // Filter toggle
  const filterBtn = $('#filterToggle');
  const drawer = $('#filterDrawer');
  if (filterBtn && drawer) {
    filterBtn.addEventListener('click', () => {
      drawer.hidden = !drawer.hidden;
      filterBtn.textContent = drawer.hidden ? 'Filters' : 'Close';
    });
  }

  // Time slider
  const slider = $('#timeSlider');
  const label = $('#timeLabel');
  if (slider && label) {
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value, 10);
      _maxTime = val >= 120 ? Infinity : val;
      label.textContent = val >= 120 ? 'Any' : `${val} min`;
    });
    slider.addEventListener('change', renderResults);
  }

  // Sort buttons
  const sortBar = $('#sortBar');
  if (sortBar) {
    sortBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.sort-btn');
      if (!btn) return;
      _sortKey = btn.dataset.sort;
      sortBar.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('on', b === btn));
      renderResults();
    });
  }
}

/**
 * Run the matching engine and render results.
 * Resets pagination when filters/ingredients change.
 * Yields to the browser first so the interaction paints immediately (INP).
 */
function renderResults() {
  _visibleCount = PAGE_SIZE; // Reset pagination on any filter change

  // Cancel any pending render so we don't do stale work
  cancelAnimationFrame(_pendingRender);

  // Yield to browser: let the click/tap paint, then do the heavy work
  _pendingRender = requestAnimationFrame(() => {
    _runRender();
  });
}

/**
 * Internal render that respects current _visibleCount.
 */
function _runRender() {
  const ings = getRef('ingredients');
  const staples = getRef('staples');
  const favs = new Set(getRef('favorites'));

  let results = findRecipes({
    recipes: _recipes,
    ingredients: ings,
    staples,
    selectedCats: _selectedCats.size ? [..._selectedCats] : [],
    maxTime: _maxTime === Infinity ? undefined : _maxTime,
    nameSearch: _nameSearch || '',
    allergies: _allergies.size ? _allergies : new Set(),
  });

  // Apply sort
  if (_sortKey !== 'match') {
    results = sortResults(results, _sortKey);
  }

  _lastResults = results;

  // Render count
  const meta = $('#resultsMeta');
  if (meta) {
    meta.innerHTML = `<strong>${results.length}</strong> <span class="count-label">recipe${results.length !== 1 ? 's' : ''}</span>`;
  }

  // Render active filter tags
  renderActiveFilters();

  // Render cards (paginated)
  const list = $('#recipeList');
  if (!list) return;

  if (!results.length) {
    list.innerHTML = '<div class="empty-state"><p>No recipes match your filters. Try adjusting your criteria.</p></div>';
    return;
  }

  const visible = results.slice(0, _visibleCount);
  const hasMore = results.length > _visibleCount;

  const makeIds = getRef('makelist');
  const cookHistory = getRef('cookHistory');
  list.innerHTML = renderCardList(visible, favs, { makelist: makeIds, cookHistory, userIngs: [...ings, ...staples] }) +
    (hasMore ? `<button class="btn btn-outline load-more-btn" id="loadMoreBtn">Show more (${results.length - _visibleCount} remaining)</button>` : '');

  // Event delegation for card clicks, buttons, and load more
  list.onclick = (e) => {
    // Load more button
    if (e.target.id === 'loadMoreBtn') {
      _visibleCount += PAGE_SIZE;
      _runRender();
      return;
    }

    // External links (View Instructions) — let them open normally
    if (e.target.closest('[data-recipe-url]')) return;

    // Share button
    if (handleShareClick(e)) return;

    // Favorite button
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
        showToast('Removed from My Queue');
      } else {
        current.push(id);
        set('makelist', current);
        showToast('Added to My Queue 📌');
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

    // Card click → open detail
    const card = e.target.closest('.r-card');
    if (card) {
      const id = Number(card.dataset.recipeId);
      openDetail(id);
    }
  };
}

/**
 * Render small tags showing active filters.
 */
function renderActiveFilters() {
  const container = $('#activeFilters');
  if (!container) return;

  const tags = [];

  if (_nameSearch) {
    tags.push(`<span class="active-filter-tag" data-clear="search">"${escHTML(_nameSearch)}" ×</span>`);
  }

  _selectedCats.forEach(cat => {
    tags.push(`<span class="active-filter-tag" data-clear-cat="${escHTML(cat)}">${escHTML(cat)} ×</span>`);
  });

  if (_maxTime !== Infinity) {
    tags.push(`<span class="active-filter-tag" data-clear="time">≤${_maxTime}min ×</span>`);
  }

  container.innerHTML = tags.join('');

  // Click to remove
  container.onclick = (e) => {
    const tag = e.target.closest('.active-filter-tag');
    if (!tag) return;

    if (tag.dataset.clear === 'search') {
      _nameSearch = '';
      const input = $('#nameSearch');
      if (input) input.value = '';
    } else if (tag.dataset.clear === 'time') {
      _maxTime = Infinity;
      const slider = $('#timeSlider');
      const label = $('#timeLabel');
      if (slider) slider.value = 120;
      if (label) label.textContent = 'Any';
    } else if (tag.dataset.clearCat) {
      _selectedCats.delete(tag.dataset.clearCat);
      const chip = document.querySelector(`.filter-chip[data-cat="${tag.dataset.clearCat}"]`);
      if (chip) chip.classList.remove('on');
    }

    renderResults();
  };
}

/**
 * Force a re-render (called externally when pantry changes).
 */
export function refreshBrowse() {
  renderResults();
}
