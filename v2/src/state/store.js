/**
 * Centralized state management for HARVEST.
 *
 * Replaces the global mutable variables from v1 with a clean store
 * that persists to localStorage and notifies subscribers on change.
 *
 * All state keys use the same `vrf_` prefix as v1 for backward compatibility.
 */

const STORAGE_KEYS = {
  ingredients:  'vrf_ings',
  staples:      'vrf_staples',
  favorites:    'vrf_favs',
  mealPlan:     'vrf_meal',
  shopList:     'vrf_shop',
  instructions: 'vrf_instr',
  allergies:    'vrf_allergies',
  activeTab:    'vrf_active_tab',
  onboarded:    'vrf_onboarded',
};

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/**
 * Internal state object. Never mutate directly — use get/set.
 */
const state = {
  ingredients:  [],
  staples:      [],
  favorites:    [],
  mealPlan:     [],
  shopList:     [],
  instructions: {},
  allergies:    [],
  activeTab:    'search',
  onboarded:    false,
};

/**
 * Safely read from localStorage with a fallback.
 * @param {string} key
 * @param {*} fallback - Returned if key is missing or parse fails
 * @returns {*}
 */
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely write to localStorage. Shows a console warning on quota exceeded.
 * @param {string} key
 * @param {*} value
 * @returns {boolean} true if write succeeded
 */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('localStorage write failed:', key, e.message);
    return false;
  }
}

/**
 * Load all state from localStorage. Called once at startup.
 */
export function loadState() {
  state.ingredients  = lsGet(STORAGE_KEYS.ingredients, []);
  state.staples      = lsGet(STORAGE_KEYS.staples, []);
  state.favorites    = lsGet(STORAGE_KEYS.favorites, []);
  state.mealPlan     = lsGet(STORAGE_KEYS.mealPlan, []);
  state.shopList     = lsGet(STORAGE_KEYS.shopList, []);
  state.instructions = lsGet(STORAGE_KEYS.instructions, {});
  state.allergies    = lsGet(STORAGE_KEYS.allergies, []);
  state.activeTab    = lsGet(STORAGE_KEYS.activeTab, 'search') || 'search';
  state.onboarded    = lsGet(STORAGE_KEYS.onboarded, false) || localStorage.getItem('vrf_onboarded') === '1';
}

/**
 * Get the current value of a state key.
 * Returns a shallow copy of arrays/objects to prevent external mutation.
 * @param {string} key
 * @returns {*}
 */
export function get(key) {
  const val = state[key];
  if (val === undefined) throw new Error(`Unknown state key: ${key}`);
  if (Array.isArray(val)) return [...val];
  if (val !== null && typeof val === 'object') return { ...val };
  return val;
}

/**
 * Get a direct reference to state (for performance-critical read paths).
 * DO NOT mutate the returned value.
 * @param {string} key
 * @returns {*}
 */
export function getRef(key) {
  if (state[key] === undefined) throw new Error(`Unknown state key: ${key}`);
  return state[key];
}

/**
 * Set a state key, persist to localStorage, and notify listeners.
 * @param {string} key
 * @param {*} value
 */
export function set(key, value) {
  if (state[key] === undefined) throw new Error(`Unknown state key: ${key}`);
  state[key] = value;

  // Persist
  const storageKey = STORAGE_KEYS[key];
  if (storageKey) {
    if (key === 'onboarded') {
      // Special case: stored as '1'/'0' string for backward compat
      try { localStorage.setItem('vrf_onboarded', value ? '1' : '0'); } catch {}
    } else if (key === 'activeTab') {
      try { localStorage.setItem(storageKey, value); } catch {}
    } else {
      lsSet(storageKey, value);
    }
  }

  // Notify subscribers
  const fns = listeners.get(key);
  if (fns) fns.forEach(fn => fn(value));
}

/**
 * Subscribe to changes on a state key.
 * @param {string} key
 * @param {Function} fn - Called with new value on change
 * @returns {Function} Unsubscribe function
 */
export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => listeners.get(key).delete(fn);
}

/**
 * Gather all syncable data into one object (for Supabase cloud sync).
 * @returns {Object}
 */
export function gatherAllData() {
  return {
    vrf_favs:      state.favorites,
    vrf_instr:     state.instructions,
    vrf_staples:   state.staples,
    vrf_shop:      state.shopList,
    vrf_ings:      state.ingredients,
    vrf_meal:      state.mealPlan,
    vrf_allergies: state.allergies,
  };
}

/**
 * Apply a full data object from cloud sync, updating state + localStorage.
 * @param {Object} data
 */
export function applyAllData(data) {
  if (data.vrf_favs      !== undefined) set('favorites',    data.vrf_favs);
  if (data.vrf_instr     !== undefined) set('instructions', data.vrf_instr);
  if (data.vrf_staples   !== undefined) set('staples',      data.vrf_staples);
  if (data.vrf_shop      !== undefined) set('shopList',     data.vrf_shop);
  if (data.vrf_ings      !== undefined) set('ingredients',  data.vrf_ings);
  if (data.vrf_meal      !== undefined) set('mealPlan',     data.vrf_meal);
  if (data.vrf_allergies !== undefined) set('allergies',    data.vrf_allergies);
}

/**
 * Reset all state to defaults. Useful for testing.
 */
export function resetState() {
  state.ingredients  = [];
  state.staples      = [];
  state.favorites    = [];
  state.mealPlan     = [];
  state.shopList     = [];
  state.instructions = {};
  state.allergies    = [];
  state.activeTab    = 'search';
  state.onboarded    = false;
  listeners.clear();
}

// Export STORAGE_KEYS for testing
export { STORAGE_KEYS };
