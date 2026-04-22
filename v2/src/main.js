/**
 * HARVEST v2 — Main entry point.
 *
 * Boots the app: loads state, initializes sync, wires tabs,
 * renders initial UI, and registers global error handler.
 */

import './styles/theme.css';
import { loadState, get, set, subscribe } from './state/store.js';
import { sbClient, onStatusChange, onAuthChange, logError } from './services/sync.js';
import { escHTML } from './utils/text.js';
import { showToast } from './utils/toast.js';
import recipes from './data/recipes.json';
import { initBrowse } from './components/Browse.js';
import { initPantry } from './components/Pantry.js';
import { initRecipeDetail } from './components/RecipeDetail.js';
import { initShopping } from './components/Shopping.js';
import { initFavorites } from './components/Favorites.js';
import { initReadyToCook } from './components/ReadyToCook.js';
import { initSyncPanel } from './components/SyncPanel.js';

/* ── Boot sequence ───────────────────────────────────────────── */

loadState();

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ── Tab system ──────────────────────────────────────────────── */

const TAB_MAP = {
  pantry:    'tab-pantry',
  browse:    'tab-browse',
  canmake:   'tab-canmake',
  favorites: 'tab-favorites',
  shopping:  'tab-shopping',
};

/**
 * Switch to a tab by key.
 * @param {string} tabKey - One of: pantry, browse, canmake, favorites, shopping
 */
export function showTab(tabKey) {
  if (!TAB_MAP[tabKey]) return;

  // Hide all panels
  $$('.tab-panel').forEach(p => p.hidden = true);

  // Show target panel
  const panel = $(`#${TAB_MAP[tabKey]}`);
  if (panel) panel.hidden = false;

  // Update tab buttons
  $$('.tab-btn').forEach(b => b.classList.remove('on'));
  const activeBtn = $(`.tab-btn[data-tab="${tabKey}"]`);
  if (activeBtn) activeBtn.classList.add('on');

  // Persist active tab
  set('activeTab', tabKey);
}

// Tab button click handlers
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    if (tab) showTab(tab);
  });
});

// Re-export showToast for external use
export { showToast };

/* ── Cloud sync status ───────────────────────────────────────── */

onStatusChange((status) => {
  const el = $('#syncStatus');
  if (el) el.textContent = status;
});

onAuthChange((user) => {
  const el = $('#syncBtn');
  if (el) el.title = user ? `Synced as ${user.email}` : 'Cloud sync — not signed in';
});

// Initialize Supabase client (registers auth listener)
sbClient();

/* ── Global error handler ────────────────────────────────────── */

window.addEventListener('error', (e) => {
  logError({
    message: e.message,
    lineno: e.lineno,
    colno: e.colno,
    stack: e.error?.stack || '',
  });
});

window.addEventListener('unhandledrejection', (e) => {
  logError({
    message: String(e.reason),
    lineno: 0,
    colno: 0,
    stack: e.reason?.stack || '',
  });
});

/* ── Initialize components ───────────────────────────────────── */

initRecipeDetail(recipes);
initBrowse(recipes);
initPantry(recipes);
initShopping();
initFavorites(recipes);
initReadyToCook(recipes);
initSyncPanel();

/* ── Restore last active tab ─────────────────────────────────── */

const savedTab = get('activeTab');
showTab(TAB_MAP[savedTab] ? savedTab : 'browse');

/* ── Expose for debugging ────────────────────────────────────── */

if (import.meta.env.DEV) {
  window.__harvest = { recipes, showTab, showToast };
}
