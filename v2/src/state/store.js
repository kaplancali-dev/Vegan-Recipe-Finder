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
  collections:  'vrf_collections',
  makelist:     'vrf_makelist',
  shopChecked:  'vrf_shop_checked',
  activeTab:    'vrf_active_tab',
  onboarded:    'vrf_onboarded',
  toured:       'vrf_toured',
  cookHistory:  'vrf_cook_history',
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
  collections:  {},
  makelist:     [],
  shopChecked:  [],
  activeTab:    'browse',
  onboarded:    false,
  toured:       false,
  cookHistory:  [],
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
  state.collections  = lsGet(STORAGE_KEYS.collections, {});
  state.makelist     = lsGet(STORAGE_KEYS.makelist, []);
  state.shopChecked  = lsGet(STORAGE_KEYS.shopChecked, []);
  state.cookHistory  = lsGet(STORAGE_KEYS.cookHistory, []);
  state.activeTab    = localStorage.getItem(STORAGE_KEYS.activeTab) || 'browse';
  state.onboarded    = lsGet(STORAGE_KEYS.onboarded, false) || localStorage.getItem('vrf_onboarded') === '1';
  state.toured       = lsGet(STORAGE_KEYS.toured, false);
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
    vrf_allergies:   state.allergies,
    vrf_collections: state.collections,
    vrf_makelist:    state.makelist,
  };
}

/**
 * Validate that a value matches the expected type for a state key.
 * Returns the value if valid, or the fallback if not.
 * @param {string} key - State key name
 * @param {*} value - Value to validate
 * @returns {*} Validated value or safe fallback
 */
function validateValue(key, value) {
  switch (key) {
    case 'favorites':
    case 'ingredients':
    case 'staples':
    case 'shopList':
    case 'allergies':
    case 'mealPlan':
    case 'makelist':
    case 'cookHistory':
      return Array.isArray(value) ? value : undefined;
    case 'instructions':
    case 'collections':
      return (value !== null && typeof value === 'object' && !Array.isArray(value)) ? value : undefined;
    default:
      return value;
  }
}

/**
 * Apply a full data object from cloud sync, updating state + localStorage.
 * Validates each field before applying to prevent malformed data from corrupting state.
 * @param {Object} data
 */
export function applyAllData(data) {
  if (data.vrf_favs      !== undefined) { const v = validateValue('favorites', data.vrf_favs);      if (v !== undefined) set('favorites', v); }
  if (data.vrf_instr     !== undefined) { const v = validateValue('instructions', data.vrf_instr);  if (v !== undefined) set('instructions', v); }
  if (data.vrf_staples   !== undefined) { const v = validateValue('staples', data.vrf_staples);     if (v !== undefined) set('staples', v); }
  if (data.vrf_shop      !== undefined) { const v = validateValue('shopList', data.vrf_shop);       if (v !== undefined) set('shopList', v); }
  if (data.vrf_ings      !== undefined) { const v = validateValue('ingredients', data.vrf_ings);    if (v !== undefined) set('ingredients', v); }
  if (data.vrf_meal      !== undefined) { const v = validateValue('mealPlan', data.vrf_meal);       if (v !== undefined) set('mealPlan', v); }
  if (data.vrf_allergies    !== undefined) { const v = validateValue('allergies', data.vrf_allergies);       if (v !== undefined) set('allergies', v); }
  if (data.vrf_collections !== undefined) { const v = validateValue('collections', data.vrf_collections); if (v !== undefined) set('collections', v); }
  if (data.vrf_makelist    !== undefined) { const v = validateValue('makelist', data.vrf_makelist);       if (v !== undefined) set('makelist', v); }
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
  state.shopChecked  = [];
  state.activeTab    = 'search';
  state.onboarded    = false;
  listeners.clear();
}

// Export STORAGE_KEYS for testing
export { STORAGE_KEYS };
