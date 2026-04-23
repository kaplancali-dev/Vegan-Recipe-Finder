/**
 * HARVEST v2 — Main entry point.
 *
 * Boots the app: loads state, initializes sync, wires tabs,
 * renders initial UI, and registers global error handler.
 */

import './styles/theme.css';
import { loadState, get, set, subscribe } from './state/store.js';
import { sbClient, onStatusChange, onAuthChange, logError } from './services/sync.js';
import { showToast } from './utils/toast.js';
import { $, $$ } from './utils/dom.js';
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

  // Update tab buttons (visual + ARIA)
  $$('[role="tab"]').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-selected', 'false');
  });
  const activeBtn = $(`.tab-btn[data-tab="${tabKey}"]`);
  if (activeBtn) {
    activeBtn.classList.add('on');
    activeBtn.setAttribute('aria-selected', 'true');
  }

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

/* ── PWA refresh / share buttons (standalone mode only) ──────── */

const isStandalone = window.navigator.standalone === true
  || window.matchMedia('(display-mode: standalone)').matches;

if (isStandalone) {
  const pwaToolbar = document.getElementById('pwaToolbar');
  if (pwaToolbar) pwaToolbar.classList.add('pwa-visible');

  const refreshBtn = $('#refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => location.reload());
  }

  const shareBtn = $('#shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'HARVEST — Vegan Recipe Finder',
        text: 'Find vegan recipes based on what\'s in your pantry!',
        url: window.location.href,
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast('Link copied to clipboard!');
        } catch {
          showToast('Copy this URL to share: ' + window.location.href);
        }
      }
    });
  }
}

/* ── Initialize components ───────────────────────────────────── */

initRecipeDetail(recipes);
initBrowse(recipes);
initPantry(recipes);
initShopping(recipes);
initFavorites(recipes);
initReadyToCook(recipes);
initSyncPanel();

/* ── Restore last active tab ─────────────────────────────────── */

const savedTab = get('activeTab');
showTab(TAB_MAP[savedTab] ? savedTab : 'browse');

/* ── Service worker cleanup ──────────────────────────────────── */
// v1 registered a caching SW; register the kill-switch to flush stale caches,
// then unregister so future loads go straight to the network.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Once the kill-switch SW activates, unregister it
      if (reg.active) {
        reg.unregister();
      } else if (reg.installing || reg.waiting) {
        const sw = reg.installing || reg.waiting;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') reg.unregister();
        });
      }
    }).catch(() => {
      // No SW to clean up — that's fine
    });
  });
}

/* ── Expose for debugging ────────────────────────────────────── */

if (import.meta.env.DEV) {
  window.__harvest = { recipes, showTab, showToast };
}
