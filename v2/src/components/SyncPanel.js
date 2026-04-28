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
  if (!panel || !content) return;

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
  } else {
    renderSignedOut(content);
  }
}

/**
 * Render signed-out state: OTP login form.
 */
function renderSignedOut(container) {
  container.innerHTML = `
    <p style="font-size:0.85rem;color:var(--ink-soft);margin-bottom:6px">
      <strong>Why sync?</strong> Your pantry, favorites, meal plans, and cook history are saved on this device only. Sign in to back them up and access them on any device.
    </p>
    <p style="font-size:0.8rem;color:var(--muted);margin-bottom:12px">
      No password needed — we'll email you a one-time code.
    </p>
    <div id="otpStep1" class="sync-form">
      <div class="input-row">
        <input id="otpEmail" type="email" class="text-input" placeholder="your@email.com" autocomplete="email">
        <button id="otpSendBtn" class="btn btn-primary btn-sm">Send Code</button>
      </div>
    </div>
    <div id="otpStep2" class="sync-form" hidden>
      <p style="font-size:0.82rem;color:var(--muted);margin-bottom:8px">Check your email for a verification code.</p>
      <div class="input-row">
        <input id="otpCode" type="text" class="text-input" placeholder="Enter code" maxlength="8" inputmode="numeric" autocomplete="one-time-code">
        <button id="otpVerifyBtn" class="btn btn-primary btn-sm">Verify</button>
      </div>
    </div>
  `;

  wireOtpFlow(container);
}

/**
 * Render signed-in state: user info, push/pull, sign out.
 */
function renderSignedIn(container, user) {
  container.innerHTML = `
    <div class="sync-user" style="margin-bottom:10px">
      Signed in as <strong>${escHTML(user.email || 'unknown')}</strong>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <button id="syncPushBtn" class="btn btn-primary btn-sm">⬆ Push to Cloud</button>
      <button id="syncPullBtn" class="btn btn-outline btn-sm">⬇ Pull from Cloud</button>
      <button id="syncSignOutBtn" class="btn btn-danger btn-sm">Sign Out</button>
    </div>
    <div style="font-size:0.78rem;color:var(--muted);line-height:1.4">
      <p style="margin:0 0 4px"><strong>Push</strong> — saves this device's data to the cloud. Use after making changes you want to keep.</p>
      <p style="margin:0 0 4px"><strong>Pull</strong> — loads your cloud data onto this device. Use when switching to a new phone or browser.</p>
      <p style="margin:0;font-style:italic">Tip: Push from the device you use most, then Pull on your other devices.</p>
    </div>
  `;

  // Push
  const pushBtn = container.querySelector('#syncPushBtn');
  if (pushBtn) {
    pushBtn.addEventListener('click', async () => {
      pushBtn.disabled = true;
      pushBtn.textContent = 'Pushing…';
      try {
        await cloudPush();
        showToast('Pushed to cloud');
      } catch (err) {
        showToast('Push failed — check your connection');
        console.error('[sync] push error:', err);
      } finally {
        pushBtn.textContent = '⬆ Push to Cloud';
        pushBtn.disabled = false;
      }
    });
  }

  // Pull
  const pullBtn = container.querySelector('#syncPullBtn');
  if (pullBtn) {
    pullBtn.addEventListener('click', async () => {
      pullBtn.disabled = true;
      pullBtn.textContent = 'Pulling…';
      try {
        await cloudPull();
        showToast('Pulled from cloud');
      } catch (err) {
        showToast('Pull failed — check your connection');
        console.error('[sync] pull error:', err);
      } finally {
        pullBtn.textContent = '⬇ Pull from Cloud';
        pullBtn.disabled = false;
      }
    });
  }

  // Sign out
  const signOutBtn = container.querySelector('#syncSignOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        await signOut();
        showToast('Signed out');
      } catch (err) {
        showToast('Sign out failed');
        console.error('[sync] sign out error:', err);
      }
    });
  }

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
        showToast('Please enter the verification code');
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

