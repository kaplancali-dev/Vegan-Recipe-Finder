/**
 * Install prompt — teaches mobile users how to add HARVEST to their home screen.
 *
 * Why a custom UI: iOS Safari doesn't expose an install API, so we have to
 * teach the gesture (Share → Add to Home Screen). Android Chrome supports
 * the native beforeinstallprompt API which we capture and trigger on tap.
 *
 * UX rules:
 *   - Never shown if already installed (display-mode: standalone)
 *   - Never shown on desktop (different value prop, different gesture)
 *   - Onboarded users in web mode see the banner on EVERY visit until they
 *     either install or explicitly dismiss for the session. The reminder is
 *     intentional — every visit they're missing the bigger screen / faster
 *     navigation / one-tap launch benefits.
 *   - Dismissal is session-only (sessionStorage). Closing the tab and
 *     coming back later → banner returns. Refreshing the same tab → banner
 *     stays dismissed. This balances "remind users" with "don't be a pest."
 *   - On first-time onboarding completion, the FULL instructions modal
 *     fires immediately (peak teachable moment) instead of the small banner.
 */

import { get, subscribe } from '../state/store.js';

const SESSION_DISMISS_KEY = 'h_install_dismissed_session';
const VISIT_KEY = 'h_visit_count';

let _deferredPrompt = null;  // captured beforeinstallprompt event (Android)

/* ── Platform detection ───────────────────────────────────────── */

function _isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function _isAndroid() {
  return /Android/.test(navigator.userAgent);
}
function _isMobile() {
  return _isIOS() || _isAndroid();
}
/**
 * On iOS, Apple only allows SAFARI to add web apps to the home screen.
 * Chrome, Firefox, Edge, etc. on iOS use WebKit but are explicitly blocked
 * from the install API. Detecting this lets us tell those users to switch
 * to Safari first instead of confusing them with instructions that won't
 * work in their current browser.
 */
function _isNonSafariIOS() {
  if (!_isIOS()) return false;
  // CriOS = Chrome iOS, FxiOS = Firefox iOS, EdgiOS = Edge iOS,
  // OPiOS = Opera iOS, YaBrowser = Yandex, etc.
  return /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|UCBrowser|DuckDuckGo/.test(navigator.userAgent);
}
function _isStandalone() {
  // Already installed (running from home-screen icon)
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}
/**
 * True if the user already closed the install prompt during this browsing
 * session. Uses sessionStorage so the flag clears when they close the tab
 * and the banner returns on their next visit — this is the per-visit
 * reminder behavior we want.
 */
function _wasDismissedThisSession() {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1';
  } catch { return false; }
}

function _markDismissedSession() {
  try { sessionStorage.setItem(SESSION_DISMISS_KEY, '1'); } catch {}
}

function _bumpVisitCount() {
  try {
    const v = Number(localStorage.getItem(VISIT_KEY) || 0);
    localStorage.setItem(VISIT_KEY, String(v + 1));
  } catch {}
}

/* ── Capture native install event (Android) ──────────────────── */

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();  // suppress automatic mini-infobar
  _deferredPrompt = e;
});

/* ── Public API ──────────────────────────────────────────────── */

/**
 * Initialize install prompt logic. Two trigger paths:
 *
 *   1. Per-visit banner — for users who have ALREADY onboarded but are
 *      still using the web version on their phone (not installed as PWA).
 *      Banner shows on every visit; dismissal is session-only so it
 *      returns next visit. Reminds them they're missing the bigger-screen
 *      / faster-launch / one-tap benefits of the installed version.
 *
 *   2. First-onboarding instructions modal — when a brand-new user
 *      completes onboarding for the first time, show the full step-by-step
 *      install instructions immediately. This is the peak teachable
 *      moment, and it skips the banner entirely (modal does the same job
 *      with more detail at the right moment).
 */
export function initInstallPrompt() {
  _bumpVisitCount();

  if (!_isMobile()) return;        // desktop — no install prompt
  if (_isStandalone()) return;     // already installed (PWA mode)

  // Path 1: per-visit reminder banner (only for users who've already
  // onboarded — pre-onboarding users will get Path 2 modal instead).
  setTimeout(() => {
    if (!get('onboarded')) return;            // pre-onboarding — wait for Path 2
    if (_wasDismissedThisSession()) return;   // user closed it this session
    if (_isStandalone()) return;              // double-check
    _showBanner();
  }, 1500);

  // Path 2: first-onboarding instructions modal. Subscribes to the
  // 'onboarded' state — when a new user completes onboarding (transitions
  // false → true within this session), show full install instructions.
  subscribe('onboarded', (newVal) => {
    if (!newVal) return;                       // only fire on transition to true
    if (_isStandalone()) return;               // already installed
    if (_wasDismissedThisSession()) return;    // already dismissed this session
    // Brief delay so onboarding overlay finishes its dismiss animation
    // before we layer the install instructions on top.
    setTimeout(() => _showInstructions(), 600);
  });
}

/* ── Banner UI ───────────────────────────────────────────────── */

function _showBanner() {
  if (document.getElementById('installBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'installBanner';
  banner.className = 'install-banner';
  banner.innerHTML = `
    <div class="install-banner-text">
      <strong>More recipes per screen</strong>
      <span>Add HARVEST to your home screen — drops the browser bar, opens full-screen, one tap to launch.</span>
    </div>
    <button class="install-banner-cta" id="installAddBtn">Add to Home Screen</button>
    <button class="install-banner-dismiss" id="installDismissBtn" aria-label="Dismiss">×</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('installAddBtn').addEventListener('click', _onInstallTap);
  document.getElementById('installDismissBtn').addEventListener('click', _dismissBanner);
}

function _dismissBanner() {
  _markDismissedSession();
  const banner = document.getElementById('installBanner');
  if (banner) banner.remove();
}

async function _onInstallTap() {
  // Android: use the native install prompt
  if (_deferredPrompt) {
    _deferredPrompt.prompt();
    const choice = await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    if (choice.outcome === 'accepted') {
      // User installed it — banner gets removed when standalone activates
      const banner = document.getElementById('installBanner');
      if (banner) banner.remove();
    } else {
      _dismissBanner();
    }
    return;
  }
  // iOS (or Android without the event yet): show step-by-step instructions
  _showInstructions();
}

function _showInstructions() {
  if (document.getElementById('installInstructions')) return;
  const ios = _isIOS();
  const nonSafariIOS = _isNonSafariIOS();
  // Title varies by platform/browser context
  const title = nonSafariIOS
    ? '📱 Open HARVEST in Safari first'
    : ios ? '📱 Add HARVEST to your iPhone'
          : '📱 Add HARVEST to your phone';
  const overlay = document.createElement('div');
  overlay.id = 'installInstructions';
  overlay.className = 'install-instructions-overlay';
  overlay.innerHTML = `
    <div class="install-instructions-box" role="dialog" aria-labelledby="installHowTitle">
      <button class="install-instructions-close" id="installInstrClose" aria-label="Close">×</button>
      <h3 id="installHowTitle">${title}</h3>
      <p class="install-instructions-why">
        <strong>More room for recipes.</strong> No Safari address bar, no tab bar — just HARVEST,
        edge to edge. You'll see roughly a third more on every screen.
        <br><br>
        <strong>One tap to open.</strong> Lives on your home screen with the leaf icon.
        No typing the URL, no hunting through tabs.
        <br><br>
        <strong>Everything carries over.</strong> Your saved pantry, favorites, and shopping list
        stay exactly where they are.
      </p>
      <ol class="install-instructions-steps">
        ${nonSafariIOS ? `
        <li>
          <span class="install-step-num">!</span>
          <div>
            <strong>Apple only lets Safari install apps on iPhone</strong>
            <span class="install-step-hint">Chrome, Firefox, and other iPhone browsers can't add to your home screen — that's an Apple restriction, not a HARVEST limitation. Switch to Safari and you're a few taps from done.</span>
          </div>
        </li>
        <li>
          <span class="install-step-num">1</span>
          <div>
            <strong>Tap the Share icon <span class="install-step-icon">⬆️</span></strong>
            <span class="install-step-hint">In Chrome it's the box-with-an-up-arrow at the bottom of the screen.</span>
          </div>
        </li>
        <li>
          <span class="install-step-num">2</span>
          <div>
            <strong>Scroll down and tap "Open in Safari"</strong>
            <span class="install-step-hint">You may need to scroll the share menu to find it.</span>
          </div>
        </li>
        <li>
          <span class="install-step-num">3</span>
          <div>
            <strong>In Safari, tap <span class="install-step-icon">•••</span> then "Add to Home Screen"</strong>
            <span class="install-step-hint">Same address bar position. Tap "Add" — HARVEST appears with the leaf icon.</span>
          </div>
        </li>
        ` : ios ? `
        <li>
          <span class="install-step-num">1</span>
          <div>
            <strong>Tap the <span class="install-step-icon">•••</span> menu</strong>
            <span class="install-step-hint">It's on the right side of the address bar at the bottom of Safari (top-right on iPad).
              On older iPhones you may see a Share icon
              <span class="install-step-icon">⬆️</span>
              instead — tap that.</span>
          </div>
        </li>
        <li>
          <span class="install-step-num">2</span>
          <div>
            <strong>Tap "Add to Home Screen"</strong>
            <span class="install-step-hint">If you don't see it right away, scroll the menu down a bit.</span>
          </div>
        </li>
        <li>
          <span class="install-step-num">3</span>
          <div>
            <strong>Tap "Add"</strong>
            <span class="install-step-hint">HARVEST appears on your home screen with the leaf icon.</span>
          </div>
        </li>
        ` : `
        <li>
          <span class="install-step-num">1</span>
          <div>
            <strong>Tap the menu</strong>
            <span class="install-step-hint">The three dots
              <span class="install-step-icon">⋮</span>
              in the top-right of Chrome.</span>
          </div>
        </li>
        <li>
          <span class="install-step-num">2</span>
          <div>
            <strong>Tap "Install app" or "Add to Home screen"</strong>
            <span class="install-step-hint">Either option works — Chrome may show one or the other.</span>
          </div>
        </li>
        <li>
          <span class="install-step-num">3</span>
          <div>
            <strong>Tap "Install"</strong>
            <span class="install-step-hint">HARVEST appears on your home screen with the leaf icon.</span>
          </div>
        </li>
        `}
      </ol>
      <button class="install-instructions-ok" id="installInstrOk">Got it</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => {
    overlay.remove();
    _dismissBanner();
  };
  document.getElementById('installInstrClose').addEventListener('click', close);
  document.getElementById('installInstrOk').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}
