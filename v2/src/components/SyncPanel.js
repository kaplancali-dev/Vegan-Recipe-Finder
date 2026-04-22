/**
 * SyncPanel — Cloud Sync UI in the Pantry tab.
 *
 * Handles OTP login flow, signed-in state display,
 * manual push/pull, sync code import/export, and sign out.
 */

import {
  getUser,
  sendOtp,
  verifyOtp,
  signOut,
  cloudPush,
  cloudPull,
  onAuthChange,
  onStatusChange,
  generateSyncCode,
  importSyncCode,
} from '../services/sync.js';
import { escHTML } from '../utils/text.js';
import { showToast } from '../utils/toast.js';
import { $ } from '../utils/dom.js';

/** OTP rate-limit: minimum 30s between sends */
let _lastOtpSend = 0;
const OTP_COOLDOWN_MS = 30_000;

/**
 * Initialize the sync panel UI.
 */
export function initSyncPanel() {
  const panel = $('#syncPanel');
  const content = $('#syncContent');
  const syncBtn = $('#syncBtn');
  if (!panel || !content) return;

  // Show panel when cloud button clicked
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
    });
  }

  // Render based on auth state
  renderSyncUI();

  // Re-render when auth changes
  onAuthChange(() => renderSyncUI());
}

/**
 * Render the sync panel based on current auth state.
 */
function renderSyncUI() {
  const content = $('#syncContent');
  const panel = $('#syncPanel');
  if (!content) return;

  const user = getUser();

  if (user) {
    renderSignedIn(content, user);
    if (panel) panel.hidden = false;
  } else {
    renderSignedOut(content);
  }
}

/**
 * Render signed-out state: OTP login form.
 */
function renderSignedOut(container) {
  container.innerHTML = `
    <p style="font-size:0.85rem;color:var(--ink-soft);margin-bottom:12px">
      Sign in to sync your pantry, favorites, and recipes across devices.
    </p>
    <div id="otpStep1" class="sync-form">
      <div class="input-row">
        <input id="otpEmail" type="email" class="text-input" placeholder="your@email.com" autocomplete="email">
        <button id="otpSendBtn" class="btn btn-primary btn-sm">Send Code</button>
      </div>
    </div>
    <div id="otpStep2" class="sync-form" hidden>
      <p style="font-size:0.82rem;color:var(--muted);margin-bottom:8px">Check your email for a 6-digit code.</p>
      <div class="input-row">
        <input id="otpCode" type="text" class="text-input" placeholder="123456" maxlength="6" inputmode="numeric" autocomplete="one-time-code">
        <button id="otpVerifyBtn" class="btn btn-primary btn-sm">Verify</button>
      </div>
    </div>
    <hr style="border:none;border-top:1px solid var(--border);margin:14px 0">
    <details style="font-size:0.82rem;color:var(--ink-soft)">
      <summary style="cursor:pointer;font-weight:600">Or use a Sync Code</summary>
      <div style="margin-top:8px">
        <div class="input-row">
          <input id="importCodeInput" type="text" class="text-input" placeholder="Paste sync code…">
          <button id="importCodeBtn" class="btn btn-outline btn-sm">Import</button>
        </div>
        <button id="exportCodeBtn" class="btn btn-outline btn-sm mt-8">Export My Data as Code</button>
      </div>
    </details>
  `;

  wireOtpFlow(container);
  wireSyncCodes(container);
}

/**
 * Render signed-in state: user info, push/pull, sign out.
 */
function renderSignedIn(container, user) {
  container.innerHTML = `
    <div class="sync-user" style="margin-bottom:10px">
      Signed in as <strong>${escHTML(user.email || 'unknown')}</strong>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button id="syncPushBtn" class="btn btn-primary btn-sm">⬆ Push to Cloud</button>
      <button id="syncPullBtn" class="btn btn-outline btn-sm">⬇ Pull from Cloud</button>
      <button id="syncSignOutBtn" class="btn btn-danger btn-sm">Sign Out</button>
    </div>
    <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
    <details style="font-size:0.82rem;color:var(--ink-soft)">
      <summary style="cursor:pointer;font-weight:600">Sync Code (offline transfer)</summary>
      <div style="margin-top:8px">
        <div class="input-row">
          <input id="importCodeInput" type="text" class="text-input" placeholder="Paste sync code…">
          <button id="importCodeBtn" class="btn btn-outline btn-sm">Import</button>
        </div>
        <button id="exportCodeBtn" class="btn btn-outline btn-sm mt-8">Export My Data as Code</button>
      </div>
    </details>
  `;

  // Push
  const pushBtn = container.querySelector('#syncPushBtn');
  if (pushBtn) {
    pushBtn.addEventListener('click', async () => {
      pushBtn.disabled = true;
      pushBtn.textContent = 'Pushing…';
      await cloudPush();
      pushBtn.textContent = '⬆ Push to Cloud';
      pushBtn.disabled = false;
      showToast('Pushed to cloud');
    });
  }

  // Pull
  const pullBtn = container.querySelector('#syncPullBtn');
  if (pullBtn) {
    pullBtn.addEventListener('click', async () => {
      pullBtn.disabled = true;
      pullBtn.textContent = 'Pulling…';
      await cloudPull();
      pullBtn.textContent = '⬇ Pull from Cloud';
      pullBtn.disabled = false;
      showToast('Pulled from cloud');
    });
  }

  // Sign out
  const signOutBtn = container.querySelector('#syncSignOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      await signOut();
      showToast('Signed out');
    });
  }

  wireSyncCodes(container);
}

/**
 * Wire up the OTP email → code verification flow.
 */
function wireOtpFlow(container) {
  const emailInput = container.querySelector('#otpEmail');
  const sendBtn = container.querySelector('#otpSendBtn');
  const step1 = container.querySelector('#otpStep1');
  const step2 = container.querySelector('#otpStep2');
  const codeInput = container.querySelector('#otpCode');
  const verifyBtn = container.querySelector('#otpVerifyBtn');

  if (sendBtn && emailInput) {
    sendBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        showToast('Please enter a valid email');
        return;
      }

      // Rate limit: 30s cooldown
      const now = Date.now();
      if (now - _lastOtpSend < OTP_COOLDOWN_MS) {
        const wait = Math.ceil((OTP_COOLDOWN_MS - (now - _lastOtpSend)) / 1000);
        showToast(`Please wait ${wait}s before requesting another code`);
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';
      _lastOtpSend = Date.now();

      const { error } = await sendOtp(email);
      if (error) {
        showToast('Failed to send code: ' + error.message);
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Code';
        return;
      }

      showToast('Code sent! Check your email');
      if (step1) step1.hidden = true;
      if (step2) step2.hidden = false;

      // Store email for verify step
      if (codeInput) codeInput.dataset.email = email;
    });

    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendBtn.click();
    });
  }

  if (verifyBtn && codeInput) {
    verifyBtn.addEventListener('click', async () => {
      const code = codeInput.value.trim();
      const email = codeInput.dataset.email || emailInput?.value?.trim();
      if (!code || code.length < 6) {
        showToast('Please enter the 6-digit code');
        return;
      }

      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verifying…';

      const { error } = await verifyOtp(email, code);
      if (error) {
        showToast('Verification failed: ' + error.message);
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify';
        return;
      }

      showToast('Signed in successfully!');
      // Auth state change will trigger re-render via onAuthChange
    });

    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyBtn.click();
    });
  }
}

/**
 * Wire sync code import/export buttons.
 */
function wireSyncCodes(container) {
  const importBtn = container.querySelector('#importCodeBtn');
  const importInput = container.querySelector('#importCodeInput');
  const exportBtn = container.querySelector('#exportCodeBtn');

  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => {
      const code = importInput.value.trim();
      if (!code) {
        showToast('Please paste a sync code');
        return;
      }
      const success = importSyncCode(code);
      if (success) {
        showToast('Data imported successfully!');
        importInput.value = '';
      } else {
        showToast('Invalid sync code');
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const code = generateSyncCode();

      // Show in the sync code modal if available
      const modal = document.getElementById('syncCodeModal');
      const body = document.getElementById('syncCodeBody');
      if (modal && body) {
        body.innerHTML = `
          <p style="font-size:0.82rem;color:var(--ink-soft);margin-bottom:10px">
            Copy this code and paste it on another device to transfer your data.
          </p>
          <textarea id="syncCodeText" class="text-input" rows="4" style="width:100%;font-family:monospace;font-size:0.75rem" readonly>${escHTML(code)}</textarea>
          <button id="syncCodeCopyBtn" class="btn btn-primary btn-sm mt-8">Copy to Clipboard</button>
        `;
        // Wire events without inline handlers
        const textarea = body.querySelector('#syncCodeText');
        const copyBtn = body.querySelector('#syncCodeCopyBtn');
        if (textarea) textarea.addEventListener('click', () => textarea.select());
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(textarea.value).then(() => {
              copyBtn.textContent = 'Copied!';
            });
          });
        }
        // Wire close button
        const closeBtn = document.getElementById('syncCodeClose');
        if (closeBtn) closeBtn.addEventListener('click', () => { modal.hidden = true; });
        modal.hidden = false;
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(code).then(() => {
          showToast('Sync code copied to clipboard!');
        }).catch(() => {
          showToast('Could not copy — check console');
          console.log('Sync code:', code);
        });
      }
    });
  }
}
