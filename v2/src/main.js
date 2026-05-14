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
import { initInstallPrompt } from './components/InstallPrompt.js';
import { submitFeedback } from './services/feedback.js';
import { openRecipeLink } from './utils/safe-link.js';

/* ── Lazy-load recipes (non-blocking — lets the shell paint first) ── */
const IMG_BASE = 'https://zhncgdbhgkeiybdbzsql.supabase.co/storage/v1/object/public/recipe-images/';
const recipesReady = import('./data/recipes.json').then(m => {
  const recipes = m.default;
  // Expand compact image URLs (~ prefix → full Supabase URL)
  for (const r of recipes) {
    if (r.img && r.img[0] === '~') r.img = IMG_BASE + r.img.slice(1);
  }
  return recipes;
});

/* ── Global error boundary ──────────────────────────────────── */
// Catches uncaught JS errors anywhere in the app — instead of letting a
// component die silently, show a friendly toast and log to console for
// diagnosis. Throttled so a runaway error loop doesn't spam toasts.
let _lastErrorAt = 0;
function _reportRuntimeError(label, err) {
  console.error('[HARVEST runtime error]', label, err);
  const now = Date.now();
  if (now - _lastErrorAt < 5000) return; // throttle: max 1 toast per 5s
  _lastErrorAt = now;
  try {
    showToast('Something hiccupped — try refreshing if it sticks.');
  } catch {}
}
window.addEventListener('error', (e) => {
  // Resource (image/script) load errors handled separately — skip here
  if (e.target && e.target !== window && e.target.tagName) return;
  _reportRuntimeError('error', e.error || e.message);
});

// Image fallback — when a recipe image 404s or fails to load, swap to a
// neutral placeholder so the page doesn't show the broken-image icon.
// Uses capture phase because img error events don't bubble.
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!img || img.tagName !== 'IMG' || img.dataset.fallback === '1') return;
  img.dataset.fallback = '1';
  // Hide the broken image
  img.style.visibility = 'hidden';
  // Insert a sibling placeholder with the recipe title (from alt attr)
  const placeholder = document.createElement('div');
  placeholder.className = 'img-fallback';
  placeholder.textContent = img.alt || '';
  // If the placeholder would be inside an existing <a> wrapper, place it after
  // the image so it inherits the image's slot in the layout.
  if (img.parentNode) img.parentNode.insertBefore(placeholder, img.nextSibling);
}, true);
window.addEventListener('unhandledrejection', (e) => {
  _reportRuntimeError('unhandledrejection', e.reason);
});

/* ── Service worker registration + upgrade prompt ──────────────── */
// Registers /sw.js for image caching, and listens for new SW versions
// installing in the background. When a new version is ready, we show a
// non-intrusive banner ("New version available · Reload") so users on
// open tabs aren't stuck on stale code after a deploy.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Detect when a new SW is installed and waiting to activate
      const onUpdateFound = () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            _showUpgradePrompt(registration);
          }
        });
      };
      registration.addEventListener('updatefound', onUpdateFound);
      // If a SW was already waiting when the page loaded, prompt now
      if (registration.waiting && navigator.serviceWorker.controller) {
        _showUpgradePrompt(registration);
      }
    }).catch((err) => {
      // Registration failure isn't fatal — app still works without caching
      console.warn('[HARVEST] Service worker registration failed:', err);
    });

    // When the new SW takes control, reload to load fresh code
    let _reloadOnControllerChange = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (_reloadOnControllerChange) {
        window.location.reload();
      }
    });

    function _showUpgradePrompt(registration) {
      // Inline banner at the top of the page — minimally invasive
      let banner = document.getElementById('swUpdateBanner');
      if (banner) return; // already shown
      banner = document.createElement('div');
      banner.id = 'swUpdateBanner';
      banner.className = 'sw-update-banner';
      banner.innerHTML = `
        <span>A fresh version of HARVEST is ready.</span>
        <button class="sw-update-btn">Reload</button>
        <button class="sw-update-dismiss" aria-label="Dismiss">×</button>
      `;
      document.body.appendChild(banner);
      banner.querySelector('.sw-update-btn').addEventListener('click', () => {
        _reloadOnControllerChange = true;
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      });
      banner.querySelector('.sw-update-dismiss').addEventListener('click', () => {
        banner.remove();
      });
    }
  });
}

/* ── Boot sequence ───────────────────────────────────────────── */

/* Swap search placeholders on small screens */
if (window.innerWidth < 520) {
  $$('[data-ph-short]').forEach(el => {
    el.placeholder = el.dataset.phShort;
  });
}

loadState();

/* ── Landing page (new visitors only) ───────────────────────── */

const landingEl = $('#landingPage');
const hasSeenLanding = localStorage.getItem('harvest_seen_landing');

const _showLanding = landingEl && !hasSeenLanding && !window.location.search.includes('r=') && !window.location.hash.includes('r=');

if (_showLanding) {
  landingEl.hidden = false;
  $('#app').hidden = true;

  // Hide landing + reveal app. Called when inline onboarding completes,
  // or as a safety net if onboarding can't mount inline.
  function dismissLanding() {
    localStorage.setItem('harvest_seen_landing', '1');
    landingEl.hidden = true;
    $('#app').hidden = false;
  }

  // Mount onboarding inline below the landing hero so the CTA can
  // smooth-scroll into setup on the same page (no modal jump).
  const slot = $('#landingOnboardingSlot');
  initOnboarding({
    inline: true,
    mountInto: slot,
    onDismiss: dismissLanding,
  });

  // If onboarding short-circuited (returning user with state but missing
  // landing flag), the slot will be empty — in that case the CTA should
  // just dismiss the landing rather than scroll to nothing.
  const _hasInlineOnboarding = slot && slot.children.length > 0;

  // Wire up landing actions
  landingEl.addEventListener('click', (e) => {
    const action = e.target.closest('[data-landing-action]');
    if (!action) return;
    if (action.dataset.landingAction === 'enter') {
      if (_hasInlineOnboarding) {
        // Hide the hero copy + CTA and reveal the picker. The HARVEST.
        // nav logo stays as a brand anchor. This guarantees only one CTA
        // exists in the document at a time — no scrolling back to find
        // SHOW ME again next to the picker's Next button.
        landingEl.classList.add('landing--hero-dismissed');
        slot.classList.add('revealed');
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      } else {
        dismissLanding();
      }
    }
  });
}

/* ── Tab system ──────────────────────────────────────────────── */

const TAB_MAP = {
  pantry:    'tab-pantry',
  browse:    'tab-browse',
  canmake:   'tab-canmake',
  wantmake:  'tab-wantmake',
  madeit:    'tab-madeit',
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


/* ── Initialize shell components (no recipes needed) ─────────── */

initSyncPanel();
initInstallPrompt();  // mobile users see the home-screen install banner

// Only run onboarding immediately if landing page is NOT showing.
// If landing is showing, onboarding is triggered after landing is dismissed.
if (!_showLanding) {
  initOnboarding();
}

/* ── Initialize recipe-dependent components (after async load) ── */

recipesReady.then(async (recipes) => {
  const [
    { initRecipeDetail, openDetail },
    { initBrowse },
    { initROTD },
    { initPantry },
    { initShopping },
    { initFavorites },
    { initWantToMake },
    { initReadyToCook },
    { initMadeIt },
  ] = await Promise.all([
    import('./components/RecipeDetail.js'),
    import('./components/Browse.js'),
    import('./components/RecipeOfTheDay.js'),
    import('./components/Pantry.js'),
    import('./components/Shopping.js'),
    import('./components/Favorites.js'),
    import('./components/WantToMake.js'),
    import('./components/ReadyToCook.js'),
    import('./components/MadeIt.js'),
  ]);

  initRecipeDetail(recipes);
  initBrowse(recipes);
  initROTD(recipes);
  initPantry(recipes);
  initShopping(recipes);
  initFavorites(recipes);
  initWantToMake(recipes);
  initReadyToCook(recipes);
  initMadeIt(recipes);

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
          sendBtn.disabled = false;
          showToast('Sent — we read every one 💚');
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

  // Cloud Sync deep-link — switch to Pantry tab, scroll to sync panel,
  // and focus the email input. Exposed globally so other entry points
  // (e.g. the onboarding "Already used HARVEST?" hint) can reuse it
  // without re-importing main.js.
  function openCloudSync() {
    closeMenu();
    showTab('pantry');
    // Wait a frame for the tab swap to apply, then scroll + focus.
    // 80ms is enough for layout to settle on mid-range phones while
    // still feeling instant.
    setTimeout(() => {
      const syncPanel = $('#syncPanel');
      if (syncPanel) syncPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Focus the email field if we're in signed-out state.
      // SyncPanel re-renders dynamically, so query after the scroll kicks off.
      const emailInput = $('#otpEmail');
      if (emailInput) {
        // Slight extra delay so the smooth scroll doesn't fight with
        // iOS auto-scroll on focus (which would yank the page).
        setTimeout(() => emailInput.focus({ preventScroll: true }), 280);
      }
    }, 80);
  }
  window.__openCloudSync = openCloudSync;

  const menuSyncBtn = $('#menuCloudSync');
  if (menuSyncBtn) {
    menuSyncBtn.addEventListener('click', openCloudSync);
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

