/**
 * Browse — the main recipe browsing tab.
 *
 * Manages the filter drawer, search input, sort controls,
 * and renders the filtered/sorted recipe card list.
 */

import { get, set, subscribe, getRef } from '../state/store.js';
import { findRecipes, sortResults, expandWithAliases } from '../services/matching.js';
import { ALLERGY_KEYWORDS } from '../data/aliases.js';
import { escHTML } from '../utils/text.js';
import { $, $$ } from '../utils/dom.js';
import { toggleFavorite } from '../actions/favorites.js';
import { renderCardList } from './RecipeCard.js';
import { openDetail } from './RecipeDetail.js';
import { addToShopList } from './Shopping.js';
import { showToast } from '../utils/toast.js';

/** How many recipes to show per page */
const PAGE_SIZE = 50;

/** @type {Array} Full recipe list */
let _recipes = [];

/** Current filter/sort state */
let _selectedCats = new Set();
let _selectedSite = '';
let _maxTime = Infinity;
let _nameSearch = '';
let _sortKey = 'match';
let _allergies = new Set();

/** Pagination: how many results currently visible */
let _visibleCount = PAGE_SIZE;

/** Cached full result set (before pagination) */
let _lastResults = [];

/** Debounce timer for search input */
let _searchTimer = null;

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
  buildAllergyChips();
  buildSiteDropdown();
  wireControls();
  renderResults();

  // Re-render when ingredients or staples change
  subscribe('ingredients', renderResults);
  subscribe('staples', renderResults);
  subscribe('favorites', renderResults);
  subscribe('allergies', (val) => {
    _allergies = new Set(val);
    syncAllergyChips();
    renderResults();
  });
}

/**
 * Fixed category list matching v1. Order and labels match the original.
 * 'Lunch|Dinner' is a combined filter — matches recipes with either tag.
 */
const V1_CATEGORIES = [
  { label: 'Breakfast',        icon: '🧇' },
  { label: 'Lunch / Dinner',   icon: '🍢', filter: 'Lunch|Dinner' },
  { label: 'Soups & Stews',    icon: '🍲' },
  { label: 'Salads',           icon: '🥗' },
  { label: 'Pasta & Noodles',  icon: '🍝' },
  { label: 'High-Protein',     icon: '🏋️' },
  { label: 'Snacks',           icon: '🥨' },
  { label: 'Desserts',         icon: '🍨' },
  { label: 'Sauces & Dips',    icon: '🫙' },
  { label: 'Game Day',         icon: '🏈' },
  { label: 'Japanese',         icon: '🍱 🇯🇵' },
  { label: 'Mexican',          icon: '🌮 🇲🇽' },
  { label: 'Chinese',          icon: '🥡 🇨🇳' },
  { label: 'Thai',             icon: '🍜 🇹🇭' },
  { label: 'Vietnamese',       icon: '🍜 🇻🇳' },
  { label: 'Indian',           icon: '🍛 🇮🇳' },
  { label: 'Korean',           icon: '🥢 🇰🇷' },
  { label: 'Italian',          icon: '🍝 🇮🇹' },
  { label: 'Mediterranean',    icon: '🫒' },
  { label: 'Middle Eastern',   icon: '🧆' },
  { label: 'Southern',         icon: '🌽' },
  { label: 'GF Bread',         icon: '🍞' },
  { label: 'One-Pot',          icon: '🥘' },
  { label: 'Instant Pot',      icon: '⚡' },
];

/** Emoji icons for allergen chips */
const ALLERGY_ICONS = {
  'coconut': '🥥', 'corn': '🌽', 'mushroom': '🍄', 'nightshade': '🌶️',
  'peanut': '🥜', 'soy': '🫘', 'tree nut': '🌰',
};

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
 * Build allergy filter chips.
 */
function buildAllergyChips() {
  const container = $('#allergyFilters');
  if (!container) return;

  const allergens = Object.keys(ALLERGY_KEYWORDS).sort();
  container.innerHTML = allergens.map(key => {
    const icon = ALLERGY_ICONS[key] || '';
    return `<button class="filter-chip${_allergies.has(key) ? ' on' : ''}" data-allergy="${escHTML(key)}">${icon ? icon + ' ' : ''}${escHTML(key)}</button>`;
  }).join('');

  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const key = chip.dataset.allergy;
    if (_allergies.has(key)) {
      _allergies.delete(key);
      chip.classList.remove('on');
    } else {
      _allergies.add(key);
      chip.classList.add('on');
    }
    set('allergies', [..._allergies]);
    renderResults();
  });
}

/**
 * Keep allergy chip UI in sync with state.
 */
function syncAllergyChips() {
  const container = $('#allergyFilters');
  if (!container) return;
  container.querySelectorAll('.filter-chip').forEach(chip => {
    const key = chip.dataset.allergy;
    chip.classList.toggle('on', _allergies.has(key));
  });
}

/**
 * Build the site/source dropdown from unique recipe sources.
 */
function buildSiteDropdown() {
  const select = $('#siteFilter');
  if (!select) return;

  const sites = new Set();
  _recipes.forEach(r => { if (r.site) sites.add(r.site); });

  const sorted = [...sites].sort();
  sorted.forEach(site => {
    const opt = document.createElement('option');
    opt.value = site;
    opt.textContent = site;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    _selectedSite = select.value;
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
      filterBtn.textContent = drawer.hidden ? 'Categories' : 'Close';
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
  const sortBtns = document.querySelectorAll('.sort-btn');
  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sortBtns.forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      _sortKey = btn.dataset.sort;
      renderResults();
    });
  });
}

/**
 * Run the matching engine and render results.
 * Resets pagination when filters/ingredients change.
 */
function renderResults() {
  _visibleCount = PAGE_SIZE; // Reset pagination on any filter change
  _runRender();
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
    selectedCats: _selectedCats.size ? [..._selectedCats] : undefined,
    selectedSite: _selectedSite || undefined,
    maxTime: _maxTime === Infinity ? undefined : _maxTime,
    nameSearch: _nameSearch || undefined,
    allergies: _allergies.size ? _allergies : undefined,
  });

  // Apply sort (sortResults returns a new array)
  if (_sortKey !== 'match') {
    results = sortResults(results, _sortKey);
  }

  _lastResults = results;

  // Render count
  const meta = $('#resultsMeta');
  if (meta) {
    meta.textContent = `${results.length} recipe${results.length !== 1 ? 's' : ''}`;
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

  list.innerHTML = renderCardList(visible, favs) +
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
    if (e.target.closest('[data-external]')) return;

    // Favorite button
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.favId);
      toggleFavorite(id);
      return;
    }

    // Make This button — add missing ingredients to shopping list
    const makeBtn = e.target.closest('.make-btn');
    if (makeBtn) {
      e.stopPropagation();
      const id = Number(makeBtn.dataset.makeId);
      const recipe = visible.find(r => r.id === id);
      if (recipe && recipe.needNames && recipe.needNames.length) {
        addToShopList(recipe.needNames);
        makeBtn.textContent = '✓ Added to Shop!';
        makeBtn.disabled = true;
      } else {
        showToast('You have everything — ready to cook!');
      }
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

  _allergies.forEach(a => {
    tags.push(`<span class="active-filter-tag" data-clear-allergy="${escHTML(a)}">No ${escHTML(a)} ×</span>`);
  });

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
    } else if (tag.dataset.clearAllergy) {
      _allergies.delete(tag.dataset.clearAllergy);
      set('allergies', [..._allergies]);
      syncAllergyChips();
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
