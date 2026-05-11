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
 *   - Throttled: once per 30 days max, dismiss-able
 *   - Triggered after engagement, not on first load
 *       • 2nd+ visit, OR
 *       • Onboarding completed, OR
 *       • 5+ pantry items selected
 */

import { get } from '../state/store.js';

const DISMISS_KEY = 'h_install_dismissed_at';
const VISIT_KEY = 'h_visit_count';
const COOLDOWN_DAYS = 30;

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
function _isStandalone() {
  // Already installed (running from home-screen icon)
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}
function _wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const days = (Date.now() - Number(ts)) / 86400000;
    return days < COOLDOWN_DAYS;
  } catch { return false; }
}

/* ── Engagement triggers ──────────────────────────────────────── */

function _meetsEngagementBar() {
  // 2nd+ visit
  try {
    const visits = Number(localStorage.getItem(VISIT_KEY) || 0);
    if (visits >= 2) return true;
  } catch {}
  // Onboarding completed
  if (get('onboarded')) return true;
  // 5+ pantry items
  const staples = get('staples') || [];
  const ings = get('ingredients') || [];
  if (staples.length + ings.length >= 5) return true;
  return false;
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
 * Initialize install prompt logic. Bumps visit count, then schedules a
 * banner appearance if the user is mobile + uninstalled + engaged + not
 * recently dismissed.
 */
export function initInstallPrompt() {
  _bumpVisitCount();

  if (!_isMobile()) return;        // desktop — no install prompt
  if (_isStandalone()) return;     // already installed
  if (_wasDismissedRecently()) return;

  // Wait a moment for state to settle, then check engagement
  setTimeout(() => {
    if (!_meetsEngagementBar()) return;
    _showBanner();
  }, 1500);
}

/* ── Banner UI ───────────────────────────────────────────────── */

function _showBanner() {
  if (document.getElementById('installBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'installBanner';
  banner.className = 'install-banner';
  banner.innerHTML = `
    <div class="install-banner-text">
      <strong>Make HARVEST one tap away</strong>
      <span>Add to your home screen — full screen, faster, feels like a real app.</span>
    </div>
    <button class="install-banner-cta" id="installAddBtn">Add to Home Screen</button>
    <button class="install-banner-dismiss" id="installDismissBtn" aria-label="Dismiss">×</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('installAddBtn').addEventListener('click', _onInstallTap);
  document.getElementById('installDismissBtn').addEventListener('click', _dismissBanner);
}

function _dismissBanner() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
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
  const overlay = document.createElement('div');
  overlay.id = 'installInstructions';
  overlay.className = 'install-instructions-overlay';
  overlay.innerHTML = `
    <div class="install-instructions-box" role="dialog" aria-labelledby="installHowTitle">
      <button class="install-instructions-close" id="installInstrClose" aria-label="Close">×</button>
      <h3 id="installHowTitle">${ios ? '📱 Add HARVEST to your iPhone' : '📱 Add HARVEST to your phone'}</h3>
      <p class="install-instructions-why">
        Lives on your home screen. Opens full-screen — no browser bar.
        Faster launch, feels like a real app.
        Your saved pantry, favorites, and shopping list all carry over.
      </p>
      <ol class="install-instructions-steps">
        ${ios ? `
        <li>
          <span class="install-step-num">1</span>
          <div>
            <strong>Tap the Share button</strong>
            <span class="install-step-hint">It looks like
              <span class="install-step-icon">⬆️</span>
              at the bottom of Safari (top-right on iPad).</span>
          </div>
        </li>
        <li>
          <span class="install-step-num">2</span>
          <div>
            <strong>Scroll and tap "Add to Home Screen"</strong>
            <span class="install-step-hint">You may need to scroll the share menu down a bit.</span>
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
