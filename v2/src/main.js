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
import { submitFeedback } from './services/feedback.js';

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


/* ── Initialize components ───────────────────────────────────── */

initRecipeDetail(recipes);
initBrowse(recipes);
initPantry(recipes);
initShopping(recipes);
initFavorites(recipes);
initReadyToCook(recipes);
initSyncPanel();

/* ── Feedback form ──────────────────────────────────────────── */

{
  const formEl = $('#feedbackForm');
  if (formEl) {
    let feedbackType = 'suggestion';

    // Type selector buttons
    formEl.addEventListener('click', (e) => {
      const typeBtn = e.target.closest('.feedback-type-btn');
      if (typeBtn) {
        formEl.querySelectorAll('.feedback-type-btn').forEach(b => b.classList.remove('on'));
        typeBtn.classList.add('on');
        feedbackType = typeBtn.dataset.type;
      }
    });

    // Send button
    const sendBtn = $('#feedbackSendBtn');
    const msgEl = $('#feedbackMsg');
    const statusEl = $('#feedbackStatus');

    if (sendBtn && msgEl) {
      sendBtn.addEventListener('click', async () => {
        const message = msgEl.value.trim();
        if (!message) {
          statusEl.textContent = 'Please type a message first.';
          return;
        }

        sendBtn.disabled = true;
        statusEl.textContent = 'Sending…';

        const result = await submitFeedback({ type: feedbackType, message });

        if (result.ok) {
          statusEl.textContent = '';
          msgEl.value = '';
          showToast('Thanks for your feedback! 💚');
        } else {
          statusEl.textContent = 'Could not send — try again later.';
          sendBtn.disabled = false;
        }
      });
    }
  }
}

/* ── Dark mode toggle ───────────────────────────────────────── */

{
  const DARK_KEY = 'vrf_darkmode';

  function applyTheme(dark) {
    if (dark) {
      document.documentElement.dataset.theme = 'dark';
    } else {
      delete document.documentElement.dataset.theme;
    }
    const btn = $('#darkModeToggle');
    if (btn) btn.textContent = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  // On load: check localStorage, fall back to prefers-color-scheme
  const stored = localStorage.getItem(DARK_KEY);
  let isDark;
  if (stored !== null) {
    isDark = stored === '1';
  } else {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyTheme(isDark);

  const toggleBtn = $('#darkModeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isDark = !isDark;
      localStorage.setItem(DARK_KEY, isDark ? '1' : '0');
      applyTheme(isDark);
    });
  }
}

/* ── PWA toolbar (share + refresh) ──────────────────────────── */

{
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  const toolbar = $('#pwaToolbar');
  if (toolbar && isPWA && isIOS) {
    toolbar.hidden = false;

    const shareBtn = $('#pwaShare');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'HARVEST — Eat More Plants!',
            url: window.location.href,
          }).catch(() => {});
        }
      });
    }

    const refreshBtn = $('#pwaRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }
}

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
