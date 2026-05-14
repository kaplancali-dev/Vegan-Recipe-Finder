/**
 * InstallCardDesktop — Contextual install card on recipe detail pages.
 *
 * Shown only on desktop, only at the bottom of an open recipe detail.
 * Surfaces a QR pointing to myharvestvegan.com so a laptop visitor can
 * scan it with their phone (or iPad) and continue there. Mobile users
 * never see this — they get the existing in-page "Add to Home Screen"
 * toast that fires from InstallPrompt.js.
 *
 * Anti-nag rules:
 *   - Hidden if running as an installed PWA (already on a phone)
 *   - Hidden on mobile viewports (no point pitching mobile install while on mobile)
 *   - Dismissal is remembered for 14 days
 *   - After 2 total dismissals, never reappears
 */

const STORAGE_KEY_DISMISSED_AT = 'harvest_desktop_install_dismissed_at';
const STORAGE_KEY_DISMISS_COUNT = 'harvest_desktop_install_dismiss_count';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MAX_DISMISSALS = 2;

/* Pre-rendered QR code for https://myharvestvegan.com.
 * Version-5 QR, error correction H (so it scans through the logo
 * overlay we may add later). Generated once, inlined here so we don't
 * ship an extra HTTP request. Uses currentColor so brand green
 * (--green-deep) flows down from the CSS without a hard-coded fill. */
const QR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37 37" shape-rendering="crispEdges" aria-label="Scan to install HARVEST"><rect width="37" height="37" fill="#ffffff"/><g fill="currentColor"><rect x="2" y="2" width="7" height="1"/><rect x="13" y="2" width="4" height="1"/><rect x="19" y="2" width="1" height="1"/><rect x="21" y="2" width="1" height="1"/><rect x="23" y="2" width="2" height="1"/><rect x="26" y="2" width="1" height="1"/><rect x="28" y="2" width="7" height="1"/><rect x="2" y="3" width="1" height="1"/><rect x="8" y="3" width="1" height="1"/><rect x="14" y="3" width="1" height="1"/><rect x="16" y="3" width="1" height="1"/><rect x="18" y="3" width="3" height="1"/><rect x="22" y="3" width="1" height="1"/><rect x="24" y="3" width="1" height="1"/><rect x="26" y="3" width="1" height="1"/><rect x="28" y="3" width="1" height="1"/><rect x="34" y="3" width="1" height="1"/><rect x="2" y="4" width="1" height="1"/><rect x="4" y="4" width="3" height="1"/><rect x="8" y="4" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="12" y="4" width="7" height="1"/><rect x="20" y="4" width="4" height="1"/><rect x="25" y="4" width="2" height="1"/><rect x="28" y="4" width="1" height="1"/><rect x="30" y="4" width="3" height="1"/><rect x="34" y="4" width="1" height="1"/><rect x="2" y="5" width="1" height="1"/><rect x="4" y="5" width="3" height="1"/><rect x="8" y="5" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="16" y="5" width="1" height="1"/><rect x="18" y="5" width="2" height="1"/><rect x="23" y="5" width="1" height="1"/><rect x="25" y="5" width="1" height="1"/><rect x="28" y="5" width="1" height="1"/><rect x="30" y="5" width="3" height="1"/><rect x="34" y="5" width="1" height="1"/><rect x="2" y="6" width="1" height="1"/><rect x="4" y="6" width="3" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="11" y="6" width="4" height="1"/><rect x="16" y="6" width="1" height="1"/><rect x="18" y="6" width="2" height="1"/><rect x="22" y="6" width="5" height="1"/><rect x="28" y="6" width="1" height="1"/><rect x="30" y="6" width="3" height="1"/><rect x="34" y="6" width="1" height="1"/><rect x="2" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="14" y="7" width="1" height="1"/><rect x="16" y="7" width="3" height="1"/><rect x="23" y="7" width="3" height="1"/><rect x="28" y="7" width="1" height="1"/><rect x="34" y="7" width="1" height="1"/><rect x="2" y="8" width="7" height="1"/><rect x="10" y="8" width="1" height="1"/><rect x="12" y="8" width="1" height="1"/><rect x="14" y="8" width="1" height="1"/><rect x="16" y="8" width="1" height="1"/><rect x="18" y="8" width="1" height="1"/><rect x="20" y="8" width="1" height="1"/><rect x="22" y="8" width="1" height="1"/><rect x="24" y="8" width="1" height="1"/><rect x="26" y="8" width="1" height="1"/><rect x="28" y="8" width="7" height="1"/><rect x="11" y="9" width="2" height="1"/><rect x="15" y="9" width="1" height="1"/><rect x="17" y="9" width="4" height="1"/><rect x="24" y="9" width="1" height="1"/><rect x="26" y="9" width="1" height="1"/><rect x="5" y="10" width="2" height="1"/><rect x="8" y="10" width="2" height="1"/><rect x="11" y="10" width="1" height="1"/><rect x="13" y="10" width="1" height="1"/><rect x="15" y="10" width="5" height="1"/><rect x="21" y="10" width="1" height="1"/><rect x="26" y="10" width="1" height="1"/><rect x="31" y="10" width="2" height="1"/><rect x="2" y="11" width="1" height="1"/><rect x="6" y="11" width="2" height="1"/><rect x="10" y="11" width="1" height="1"/><rect x="13" y="11" width="1" height="1"/><rect x="15" y="11" width="1" height="1"/><rect x="18" y="11" width="4" height="1"/><rect x="23" y="11" width="3" height="1"/><rect x="27" y="11" width="1" height="1"/><rect x="29" y="11" width="5" height="1"/><rect x="4" y="12" width="2" height="1"/><rect x="8" y="12" width="2" height="1"/><rect x="11" y="12" width="1" height="1"/><rect x="14" y="12" width="2" height="1"/><rect x="18" y="12" width="1" height="1"/><rect x="22" y="12" width="1" height="1"/><rect x="24" y="12" width="3" height="1"/><rect x="28" y="12" width="2" height="1"/><rect x="31" y="12" width="1" height="1"/><rect x="33" y="12" width="2" height="1"/><rect x="3" y="13" width="1" height="1"/><rect x="6" y="13" width="2" height="1"/><rect x="9" y="13" width="1" height="1"/><rect x="11" y="13" width="4" height="1"/><rect x="18" y="13" width="1" height="1"/><rect x="20" y="13" width="5" height="1"/><rect x="27" y="13" width="1" height="1"/><rect x="29" y="13" width="2" height="1"/><rect x="32" y="13" width="2" height="1"/><rect x="3" y="14" width="6" height="1"/><rect x="13" y="14" width="2" height="1"/><rect x="16" y="14" width="1" height="1"/><rect x="21" y="14" width="1" height="1"/><rect x="23" y="14" width="1" height="1"/><rect x="26" y="14" width="1" height="1"/><rect x="28" y="14" width="4" height="1"/><rect x="2" y="15" width="1" height="1"/><rect x="5" y="15" width="1" height="1"/><rect x="9" y="15" width="1" height="1"/><rect x="12" y="15" width="1" height="1"/><rect x="15" y="15" width="1" height="1"/><rect x="17" y="15" width="3" height="1"/><rect x="22" y="15" width="2" height="1"/><rect x="25" y="15" width="1" height="1"/><rect x="29" y="15" width="3" height="1"/><rect x="33" y="15" width="1" height="1"/><rect x="3" y="16" width="1" height="1"/><rect x="6" y="16" width="1" height="1"/><rect x="8" y="16" width="1" height="1"/><rect x="10" y="16" width="3" height="1"/><rect x="14" y="16" width="1" height="1"/><rect x="16" y="16" width="2" height="1"/><rect x="26" y="16" width="2" height="1"/><rect x="29" y="16" width="1" height="1"/><rect x="3" y="17" width="1" height="1"/><rect x="5" y="17" width="2" height="1"/><rect x="9" y="17" width="1" height="1"/><rect x="14" y="17" width="2" height="1"/><rect x="20" y="17" width="1" height="1"/><rect x="22" y="17" width="1" height="1"/><rect x="25" y="17" width="1" height="1"/><rect x="27" y="17" width="3" height="1"/><rect x="31" y="17" width="1" height="1"/><rect x="3" y="18" width="3" height="1"/><rect x="8" y="18" width="1" height="1"/><rect x="11" y="18" width="1" height="1"/><rect x="14" y="18" width="2" height="1"/><rect x="18" y="18" width="1" height="1"/><rect x="20" y="18" width="1" height="1"/><rect x="22" y="18" width="1" height="1"/><rect x="25" y="18" width="1" height="1"/><rect x="27" y="18" width="6" height="1"/><rect x="5" y="19" width="2" height="1"/><rect x="9" y="19" width="1" height="1"/><rect x="13" y="19" width="3" height="1"/><rect x="17" y="19" width="1" height="1"/><rect x="19" y="19" width="1" height="1"/><rect x="21" y="19" width="2" height="1"/><rect x="24" y="19" width="1" height="1"/><rect x="26" y="19" width="1" height="1"/><rect x="28" y="19" width="4" height="1"/><rect x="2" y="20" width="1" height="1"/><rect x="4" y="20" width="9" height="1"/><rect x="15" y="20" width="1" height="1"/><rect x="18" y="20" width="1" height="1"/><rect x="20" y="20" width="1" height="1"/><rect x="22" y="20" width="1" height="1"/><rect x="24" y="20" width="2" height="1"/><rect x="27" y="20" width="2" height="1"/><rect x="31" y="20" width="4" height="1"/><rect x="4" y="21" width="1" height="1"/><rect x="7" y="21" width="1" height="1"/><rect x="9" y="21" width="1" height="1"/><rect x="11" y="21" width="2" height="1"/><rect x="14" y="21" width="3" height="1"/><rect x="18" y="21" width="1" height="1"/><rect x="20" y="21" width="2" height="1"/><rect x="24" y="21" width="3" height="1"/><rect x="28" y="21" width="2" height="1"/><rect x="31" y="21" width="2" height="1"/><rect x="34" y="21" width="1" height="1"/><rect x="2" y="22" width="1" height="1"/><rect x="4" y="22" width="2" height="1"/><rect x="8" y="22" width="1" height="1"/><rect x="13" y="22" width="2" height="1"/><rect x="18" y="22" width="1" height="1"/><rect x="21" y="22" width="1" height="1"/><rect x="26" y="22" width="2" height="1"/><rect x="29" y="22" width="1" height="1"/><rect x="31" y="22" width="1" height="1"/><rect x="34" y="22" width="1" height="1"/><rect x="2" y="23" width="1" height="1"/><rect x="6" y="23" width="1" height="1"/><rect x="9" y="23" width="1" height="1"/><rect x="11" y="23" width="1" height="1"/><rect x="13" y="23" width="2" height="1"/><rect x="16" y="23" width="4" height="1"/><rect x="21" y="23" width="3" height="1"/><rect x="27" y="23" width="4" height="1"/><rect x="33" y="23" width="1" height="1"/><rect x="2" y="24" width="1" height="1"/><rect x="5" y="24" width="5" height="1"/><rect x="11" y="24" width="2" height="1"/><rect x="19" y="24" width="1" height="1"/><rect x="21" y="24" width="1" height="1"/><rect x="24" y="24" width="1" height="1"/><rect x="26" y="24" width="1" height="1"/><rect x="28" y="24" width="2" height="1"/><rect x="32" y="24" width="3" height="1"/><rect x="2" y="25" width="1" height="1"/><rect x="7" y="25" width="1" height="1"/><rect x="9" y="25" width="1" height="1"/><rect x="11" y="25" width="1" height="1"/><rect x="13" y="25" width="2" height="1"/><rect x="16" y="25" width="4" height="1"/><rect x="21" y="25" width="1" height="1"/><rect x="32" y="25" width="1" height="1"/><rect x="2" y="26" width="3" height="1"/><rect x="8" y="26" width="2" height="1"/><rect x="13" y="26" width="1" height="1"/><rect x="15" y="26" width="1" height="1"/><rect x="18" y="26" width="4" height="1"/><rect x="26" y="26" width="6" height="1"/><rect x="34" y="26" width="1" height="1"/><rect x="10" y="27" width="1" height="1"/><rect x="12" y="27" width="3" height="1"/><rect x="16" y="27" width="1" height="1"/><rect x="18" y="27" width="2" height="1"/><rect x="21" y="27" width="1" height="1"/><rect x="26" y="27" width="1" height="1"/><rect x="30" y="27" width="4" height="1"/><rect x="2" y="28" width="7" height="1"/><rect x="10" y="28" width="1" height="1"/><rect x="17" y="28" width="1" height="1"/><rect x="20" y="28" width="2" height="1"/><rect x="23" y="28" width="4" height="1"/><rect x="28" y="28" width="1" height="1"/><rect x="30" y="28" width="3" height="1"/><rect x="2" y="29" width="1" height="1"/><rect x="8" y="29" width="1" height="1"/><rect x="11" y="29" width="1" height="1"/><rect x="13" y="29" width="3" height="1"/><rect x="19" y="29" width="1" height="1"/><rect x="22" y="29" width="1" height="1"/><rect x="26" y="29" width="1" height="1"/><rect x="30" y="29" width="4" height="1"/><rect x="2" y="30" width="1" height="1"/><rect x="4" y="30" width="3" height="1"/><rect x="8" y="30" width="1" height="1"/><rect x="10" y="30" width="2" height="1"/><rect x="13" y="30" width="3" height="1"/><rect x="17" y="30" width="3" height="1"/><rect x="23" y="30" width="1" height="1"/><rect x="25" y="30" width="7" height="1"/><rect x="33" y="30" width="1" height="1"/><rect x="2" y="31" width="1" height="1"/><rect x="4" y="31" width="3" height="1"/><rect x="8" y="31" width="1" height="1"/><rect x="10" y="31" width="1" height="1"/><rect x="12" y="31" width="1" height="1"/><rect x="16" y="31" width="1" height="1"/><rect x="22" y="31" width="2" height="1"/><rect x="25" y="31" width="1" height="1"/><rect x="27" y="31" width="1" height="1"/><rect x="29" y="31" width="1" height="1"/><rect x="31" y="31" width="3" height="1"/><rect x="2" y="32" width="1" height="1"/><rect x="4" y="32" width="3" height="1"/><rect x="8" y="32" width="1" height="1"/><rect x="12" y="32" width="2" height="1"/><rect x="15" y="32" width="8" height="1"/><rect x="30" y="32" width="1" height="1"/><rect x="32" y="32" width="3" height="1"/><rect x="2" y="33" width="1" height="1"/><rect x="8" y="33" width="1" height="1"/><rect x="12" y="33" width="3" height="1"/><rect x="17" y="33" width="3" height="1"/><rect x="22" y="33" width="2" height="1"/><rect x="25" y="33" width="1" height="1"/><rect x="27" y="33" width="2" height="1"/><rect x="32" y="33" width="3" height="1"/><rect x="2" y="34" width="7" height="1"/><rect x="11" y="34" width="1" height="1"/><rect x="13" y="34" width="2" height="1"/><rect x="18" y="34" width="1" height="1"/><rect x="21" y="34" width="1" height="1"/><rect x="23" y="34" width="1" height="1"/><rect x="25" y="34" width="4" height="1"/><rect x="30" y="34" width="3" height="1"/></g></svg>`;

/**
 * Decide whether the install card should render right now.
 * Returns true only on desktop browsers that aren't already installed.
 */
function _shouldShow() {
  // Skip if running as installed PWA — they're already where we want them
  const isStandalone =
    window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (isStandalone) return false;

  // Skip on mobile / narrow viewports — they get the in-app install toast
  // instead. 768px is the common tablet-portrait breakpoint; below that
  // a QR-to-self pitch is silly. iPad in landscape (>=1024) still gets it,
  // which is what we want — they can scan from their phone if they prefer.
  const isMobile =
    window.innerWidth < 768 ||
    /iPhone|Android.*Mobile/i.test(window.navigator.userAgent);
  if (isMobile) return false;

  // Honor permanent dismissal
  const count = Number(localStorage.getItem(STORAGE_KEY_DISMISS_COUNT) || 0);
  if (count >= MAX_DISMISSALS) return false;

  // Honor 14-day cooldown
  const dismissedAt = Number(localStorage.getItem(STORAGE_KEY_DISMISSED_AT) || 0);
  if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return false;

  return true;
}

/**
 * Record a dismissal — bumps the count and sets the cooldown timestamp.
 */
function _recordDismissal() {
  const count = Number(localStorage.getItem(STORAGE_KEY_DISMISS_COUNT) || 0);
  localStorage.setItem(STORAGE_KEY_DISMISS_COUNT, String(count + 1));
  localStorage.setItem(STORAGE_KEY_DISMISSED_AT, String(Date.now()));
}

/**
 * Open the expanded modal with bigger QR and step-by-step instructions.
 * Lazy-built; one instance reused across opens.
 */
let _modalEl = null;
function _openModal() {
  if (!_modalEl) {
    _modalEl = document.createElement('div');
    _modalEl.className = 'hv-install-modal';
    _modalEl.setAttribute('role', 'dialog');
    _modalEl.setAttribute('aria-modal', 'true');
    _modalEl.setAttribute('aria-labelledby', 'hvInstallModalTitle');
    _modalEl.innerHTML = `
      <div class="hv-install-modal__backdrop" data-hv-modal-close></div>
      <div class="hv-install-modal__panel">
        <button class="hv-install-modal__close" data-hv-modal-close aria-label="Close">×</button>
        <div class="hv-home-tile hv-install-modal__tile" aria-hidden="true">
          <img class="hv-app-icon" src="/icon-192.png" alt="">
          <span class="hv-home-tile__label">HARVEST</span>
        </div>
        <div class="hv-install-modal__qr">${QR_SVG}</div>
        <div id="hvInstallModalTitle" class="hv-install-modal__title">
          Don't just cook from your laptop.<br>
          <strong>Get HARVEST on your phone, iPad →</strong>
        </div>
        <ol class="hv-install-modal__steps">
          <li>Open your phone or iPad camera.</li>
          <li>Point it at the code above.</li>
          <li>Tap the link that appears, then <em>Add to Home Screen</em>.</li>
        </ol>
      </div>
    `;
    document.body.appendChild(_modalEl);

    // Close handlers (backdrop, X, Escape)
    _modalEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-hv-modal-close]')) _closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _modalEl && !_modalEl.hidden) _closeModal();
    });
  }
  _modalEl.hidden = false;
  // Trap scroll while modal is up
  document.body.style.overflow = 'hidden';
}

function _closeModal() {
  if (_modalEl) _modalEl.hidden = true;
  document.body.style.overflow = '';
}

/**
 * Append the install card to the bottom of a container (recipe detail body).
 * Safe to call on every recipe open — exits early if conditions aren't met.
 *
 * @param {HTMLElement} container - The element to append the card into.
 */
export function mountInstallCardDesktop(container) {
  if (!container || !_shouldShow()) return;

  const card = document.createElement('div');
  card.className = 'hv-install-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', 'Get HARVEST on your phone or iPad');
  card.innerHTML = `
    <div class="hv-install-card__qr">${QR_SVG}</div>
    <img class="hv-app-icon hv-install-card__icon" src="/icon-192.png" alt="HARVEST app icon">
    <div class="hv-install-card__copy">
      <div class="hv-install-card__line">
        Don't just cook from your laptop.
        <strong>Get HARVEST on your phone, iPad →</strong>
      </div>
      <div class="hv-install-card__hint">Point your phone camera at the code — it takes 5 seconds.</div>
    </div>
    <button class="hv-install-card__close" data-hv-card-dismiss aria-label="Dismiss for 14 days">×</button>
  `;
  container.appendChild(card);

  // Card click → open modal (unless they clicked the × specifically)
  card.addEventListener('click', (e) => {
    if (e.target.closest('[data-hv-card-dismiss]')) {
      _recordDismissal();
      card.remove();
      return;
    }
    _openModal();
  });

  // Keyboard support — Enter or Space on the card opens the modal
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      _openModal();
    }
  });
}
