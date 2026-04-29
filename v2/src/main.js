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
import { initSyncPanel } from './components/SyncPanel.js';
import { initOnboarding } from './components/Onboarding.js';
import { submitFeedback } from './services/feedback.js';
import { openRecipeLink } from './utils/safe-link.js';

/* ── Lazy-load recipes (non-blocking — lets the shell paint first) ── */
const recipesReady = import('./data/recipes.json').then(m => m.default);

/* ── Boot sequence ───────────────────────────────────────────── */

/* Swap search placeholders on small screens */
if (window.innerWidth < 520) {
  $$('[data-ph-short]').forEach(el => {
    el.placeholder = el.dataset.phShort;
  });
}

loadState();

/* ── Tab system ──────────────────────────────────────────────── */

const TAB_MAP = {
  pantry:    'tab-pantry',
  browse:    'tab-browse',
  canmake:   'tab-canmake',
  favorites: 'tab-favorites',
  wantmake:  'tab-wantmake',
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


/* ── Initialize shell components (no recipes needed) ─────────── */

initSyncPanel();
initOnboarding();

/* ── Initialize recipe-dependent components (after async load) ── */

recipesReady.then(async (recipes) => {
  const { initRecipeDetail, openDetail } = await import('./components/RecipeDetail.js');
  const { initBrowse } = await import('./components/Browse.js');
  const { initPantry } = await import('./components/Pantry.js');
  const { initShopping } = await import('./components/Shopping.js');
  const { initFavorites } = await import('./components/Favorites.js');
  const { initWantToMake } = await import('./components/WantToMake.js');
  const { initReadyToCook } = await import('./components/ReadyToCook.js');
  const { initROTD } = await import('./components/RecipeOfTheDay.js');

  initRecipeDetail(recipes);
  initBrowse(recipes);
  initROTD(recipes);
  initPantry(recipes);
  initShopping(recipes);
  initFavorites(recipes);
  initWantToMake(recipes);
  initReadyToCook(recipes);

  /* ── Deep-link: open shared recipe from #r=ID or ?r=ID ────── */
  const hashMatch = window.location.hash.match(/^#r=(\d+)/);
  const queryId = new URLSearchParams(window.location.search).get('r');
  const deepLinkId = hashMatch ? hashMatch[1] : queryId;
  if (deepLinkId) {
    const rid = Number(deepLinkId);
    if (recipes.find(r => r.id === rid)) {
      setTimeout(() => openDetail(rid), 300);
    }
    window.history.replaceState({}, '', window.location.pathname);
  }

  /* ── Expose for debugging ────────────────────────────────────── */
  if (import.meta.env.DEV) {
    window.__harvest = { recipes, showTab, showToast };
  }
});


/* ── Safe recipe link handler ────────────────────────────────── */
// Intercept all [data-recipe-url] clicks globally.
// Opens the original URL and shows a "Page not found? Search instead" toast.
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-recipe-url]');
  if (!link) return;
  e.preventDefault();
  e.stopPropagation();
  openRecipeLink(
    link.dataset.recipeUrl,
    link.dataset.recipeTitle || '',
    link.dataset.recipeSite || ''
  );
});


/* ── Responsive search placeholders ────────────────────────── */

function updateSearchPlaceholders() {
  $$('[data-ph-short]').forEach(el => {
    el.placeholder = window.innerWidth <= 600
      ? el.dataset.phShort
      : el.getAttribute('data-ph-full') || el.placeholder;
  });
}

// Store the full placeholder on first run
$$('[data-ph-short]').forEach(el => {
  el.setAttribute('data-ph-full', el.placeholder);
});
updateSearchPlaceholders();
window.addEventListener('resize', updateSearchPlaceholders);

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

const DARK_KEY = 'vrf_darkmode';
let isDark;

function applyTheme(dark) {
  if (dark) {
    document.documentElement.dataset.theme = 'dark';
  } else {
    delete document.documentElement.dataset.theme;
  }
  // Update all dark mode buttons/icons
  const menuBtn = $('#menuDarkToggle');
  if (menuBtn) menuBtn.textContent = dark ? '☀️ Light Mode' : '🌙 Night Mode';
  const pwaBtn = $('#pwaDarkToggle');
  if (pwaBtn) pwaBtn.classList.toggle('dark-active', dark);
  // Swap moon/sun icon in PWA toolbar
  const pwaIcon = $('#pwaDarkIcon');
  if (pwaIcon) {
    pwaIcon.innerHTML = dark
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
}

function toggleDarkMode() {
  isDark = !isDark;
  localStorage.setItem(DARK_KEY, isDark ? '1' : '0');
  applyTheme(isDark);
}

{
  const stored = localStorage.getItem(DARK_KEY);
  if (stored !== null) {
    isDark = stored === '1';
  } else {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyTheme(isDark);

  // Menu panel dark mode toggle
  const menuDarkBtn = $('#menuDarkToggle');
  if (menuDarkBtn) menuDarkBtn.addEventListener('click', toggleDarkMode);
}

/* ── Menu panel ─────────────────────────────────────────────── */

{
  const overlay = $('#menuOverlay');
  const menuNav = overlay?.querySelector('.menu-nav');
  const menuContent = $('#menuContent');
  const menuBackBtn = $('#menuBackBtn');
  const closeBtn = $('#menuCloseBtn');

  function openMenu() {
    if (!overlay) return;
    overlay.hidden = false;
    // Reset to nav view
    if (menuNav) menuNav.hidden = false;
    if (menuContent) menuContent.hidden = true;
    overlay.querySelectorAll('.menu-section').forEach(s => s.hidden = true);
  }

  function closeMenu() {
    if (overlay) overlay.hidden = true;
  }

  function showSection(id) {
    if (menuNav) menuNav.hidden = true;
    if (menuContent) menuContent.hidden = false;
    overlay.querySelectorAll('.menu-section').forEach(s => s.hidden = true);
    const section = $(`#menu${id.charAt(0).toUpperCase() + id.slice(1)}`);
    if (section) section.hidden = false;
  }

  if (overlay) {
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeMenu();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  if (menuBackBtn) {
    menuBackBtn.addEventListener('click', () => {
      if (menuNav) menuNav.hidden = false;
      if (menuContent) menuContent.hidden = true;
    });
  }

  // Menu item clicks
  if (menuNav) {
    menuNav.addEventListener('click', (e) => {
      const item = e.target.closest('[data-menu]');
      if (item) showSection(item.dataset.menu);
    });
  }

  // Cloud Sync menu item — switch to Pantry tab and scroll to sync panel
  const menuSyncBtn = $('#menuCloudSync');
  if (menuSyncBtn) {
    menuSyncBtn.addEventListener('click', () => {
      closeMenu();
      showTab('pantry');
      const syncPanel = $('#syncPanel');
      if (syncPanel) syncPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Header hamburger menu button (desktop)
  const headerMenuBtn = $('#headerMenuBtn');
  if (headerMenuBtn) headerMenuBtn.addEventListener('click', openMenu);

  // Expose openMenu for PWA toolbar
  window.__openMenu = openMenu;
}

/* ── PWA toolbar (share, refresh, menu, night mode) ──────────── */

{
  const toolbar = $('#pwaToolbar');
  // Show on iOS/iPadOS homescreen PWA (standalone mode)
  if (toolbar && window.navigator.standalone === true) {
    toolbar.hidden = false;

    const shareBtn = $('#pwaShare');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'HARVEST™ — See What Your Kitchen Already Knows',
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

    const menuBtn = $('#pwaMenu');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        if (window.__openMenu) window.__openMenu();
      });
    }

    const darkBtn = $('#pwaDarkToggle');
    if (darkBtn) darkBtn.addEventListener('click', toggleDarkMode);
  }
}

/* ── Restore last active tab ─────────────────────────────────── */

const savedTab = get('activeTab');
showTab(TAB_MAP[savedTab] ? savedTab : 'browse');

/* ── Service worker cleanup is handled by /sw-cleanup.js ─────── */

