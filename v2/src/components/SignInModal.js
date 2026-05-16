/**
 * SignInModal — Restore-your-pantry flow for returning users.
 *
 * Standalone modal launched from the landing page ("Already used HARVEST?")
 * for visitors who lost their local state (new browser, new laptop, cleared
 * Safari cache, etc.). Walks them through email → 6-digit code → cloudPull,
 * then reloads the page so they boot directly into their restored data.
 *
 * Not used for the in-app Cloud Sync panel — that lives in SyncPanel.js
 * inside the Pantry tab and shares the same underlying OTP service.
 */

import { sendOtp, verifyOtp, cloudPull } from '../services/sync.js';

const OTP_COOLDOWN_MS = 30_000;

let _modalEl = null;
let _lastOtpSend = 0;

/* ── DOM creation ───────────────────────────────────────────── */

function _createModal() {
  const m = document.createElement('div');
  m.id = 'signInModal';
  m.className = 'sin-modal';
  m.hidden = true;
  m.setAttribute('role', 'dialog');
  m.setAttribute('aria-modal', 'true');
  m.setAttribute('aria-labelledby', 'sinTitle');
  m.innerHTML = `
    <div class="sin-modal__backdrop" data-sin-close></div>
    <div class="sin-modal__panel">
      <button class="sin-modal__close" data-sin-close aria-label="Close">×</button>

      <!-- Step 1: Email -->
      <div class="sin-step" data-sin-step="1">
        <h2 id="sinTitle" class="sin-modal__title">Welcome back.</h2>
        <p class="sin-modal__sub">Enter the email you used before. We'll send a 6-digit code to verify it's you.</p>
        <p class="sin-modal__reassure"><strong>No password to remember. No account to create.</strong></p>
        <input
          class="sin-modal__input" id="sinEmail" type="email"
          placeholder="your@email.com"
          autocomplete="email" inputmode="email" spellcheck="false">
        <div class="sin-modal__error" id="sinEmailError" hidden></div>
        <button class="sin-modal__btn" id="sinSendBtn" type="button">Send code</button>
        <p class="sin-modal__newhere">
          New here? Just tap <strong>SHOW ME WHAT'S POSSIBLE</strong> instead.
        </p>
      </div>

      <!-- Step 2: Code -->
      <div class="sin-step" data-sin-step="2" hidden>
        <h2 class="sin-modal__title">Check your email.</h2>
        <p class="sin-modal__sub">
          We sent a 6-digit code to <strong id="sinEmailEcho">your email</strong>. Drop it in below.
        </p>
        <input
          class="sin-modal__input sin-modal__input--code" id="sinCode" type="text"
          placeholder="6-digit code" maxlength="8"
          inputmode="numeric" autocomplete="one-time-code">
        <div class="sin-modal__error" id="sinCodeError" hidden></div>
        <button class="sin-modal__btn" id="sinVerifyBtn" type="button">Verify</button>
        <button class="sin-modal__back" data-sin-back type="button">← Wrong email? Go back</button>
      </div>

      <!-- Step 3: Restoring -->
      <div class="sin-step" data-sin-step="3" hidden>
        <h2 class="sin-modal__title">Restoring your pantry…</h2>
        <p class="sin-modal__sub">One sec — pulling your saved data.</p>
        <div class="sin-modal__spinner" aria-hidden="true"></div>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  _wire(m);
  return m;
}

/* ── Step transitions ───────────────────────────────────────── */

function _showStep(n) {
  if (!_modalEl) return;
  _modalEl.querySelectorAll('[data-sin-step]').forEach(el => {
    el.hidden = Number(el.dataset.sinStep) !== n;
  });
  // Focus the relevant input on each step
  setTimeout(() => {
    if (n === 1) _modalEl.querySelector('#sinEmail')?.focus();
    if (n === 2) _modalEl.querySelector('#sinCode')?.focus();
  }, 50);
}

function _close() {
  if (_modalEl) _modalEl.hidden = true;
  document.body.style.overflow = '';
}

function _showError(elId, message) {
  if (!_modalEl) return;
  const el = _modalEl.querySelector('#' + elId);
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function _clearError(elId) {
  if (!_modalEl) return;
  const el = _modalEl.querySelector('#' + elId);
  if (el) el.hidden = true;
}

/* ── Wiring ─────────────────────────────────────────────────── */

function _wire(m) {
  // Close handlers (X, backdrop, Escape)
  m.addEventListener('click', (e) => {
    if (e.target.closest('[data-sin-close]')) _close();
    if (e.target.closest('[data-sin-back]')) _showStep(1);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _modalEl && !_modalEl.hidden) _close();
  });

  const emailInput = m.querySelector('#sinEmail');
  const sendBtn = m.querySelector('#sinSendBtn');
  const codeInput = m.querySelector('#sinCode');
  const verifyBtn = m.querySelector('#sinVerifyBtn');

  /* Step 1: send code */
  sendBtn.addEventListener('click', async () => {
    _clearError('sinEmailError');
    const email = emailInput.value.trim();
    if (!email || !email.includes('@') || email.length < 5) {
      _showError('sinEmailError', "That doesn't look like an email — try again.");
      return;
    }

    // 30s cooldown to avoid spamming Supabase
    const now = Date.now();
    if (now - _lastOtpSend < OTP_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_COOLDOWN_MS - (now - _lastOtpSend)) / 1000);
      _showError('sinEmailError', `Easy — wait ${wait}s before trying again.`);
      return;
    }

    sendBtn.disabled = true;
    const originalText = sendBtn.textContent;
    sendBtn.textContent = 'Sending…';

    const { error } = await sendOtp(email);
    sendBtn.disabled = false;
    sendBtn.textContent = originalText;

    if (error) {
      _showError('sinEmailError', "Couldn't send code — " + (error.message || 'try again later'));
      return;
    }

    _lastOtpSend = Date.now();
    // Show email on Step 2 so they can verify they typed it right
    const echo = m.querySelector('#sinEmailEcho');
    if (echo) echo.textContent = email;
    codeInput.dataset.email = email;
    _showStep(2);
  });
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });
  emailInput.addEventListener('input', () => _clearError('sinEmailError'));

  /* Step 2: verify code */
  verifyBtn.addEventListener('click', async () => {
    _clearError('sinCodeError');
    const code = codeInput.value.trim();
    const email = codeInput.dataset.email || '';

    if (!code || code.length < 6) {
      _showError('sinCodeError', 'Pop in the 6-digit code from your email.');
      return;
    }

    verifyBtn.disabled = true;
    const originalText = verifyBtn.textContent;
    verifyBtn.textContent = 'Verifying…';

    const { error } = await verifyOtp(email, code);
    if (error) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = originalText;
      _showError('sinCodeError', "That code didn't work — " + (error.message || 'try again'));
      return;
    }

    // Verified. Auth listener in sync.js will also call cloudPull —
    // that's fine, the in-progress guard prevents duplicate work.
    _showStep(3);
    try {
      // Tiny pause so the auth state listener can register the user
      // before our explicit pull (avoids a race where _sbUser is null)
      await new Promise(r => setTimeout(r, 250));
      await cloudPull();
    } catch (err) {
      console.warn('[SignInModal] cloudPull failed:', err);
      // Even if pull errors out, reload — Supabase persists the session
      // and the next boot will retry.
    }
    // Reload so the app re-boots with the restored state.
    // Landing page is gated on `harvest_seen_landing`, but pulled data
    // includes the staples which already short-circuit onboarding,
    // and we explicitly set the flag so landing also doesn't reappear.
    try { localStorage.setItem('harvest_seen_landing', '1'); } catch {}
    window.location.reload();
  });
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyBtn.click();
  });
  codeInput.addEventListener('input', () => _clearError('sinCodeError'));
}

/* ── Public API ─────────────────────────────────────────────── */

/**
 * Open the sign-in modal. Lazily creates the DOM on first open.
 */
export function showSignInModal() {
  if (!_modalEl) _modalEl = _createModal();
  _modalEl.hidden = false;
  _showStep(1);
}
