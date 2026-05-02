/**
 * PantryScan — Photo-to-pantry ingredient scanner.
 *
 * Uses the HARVEST Pantry Scan Cloudflare Worker (Claude Haiku vision)
 * to identify groceries from a photo and add them to My Ingredients.
 *
 * Flow: tap 📷 → pick/take photo → send to worker → show confirmation
 * chips → user toggles items → tap "Add to Pantry" → done.
 */

import { get, set } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { escHTML, norm } from '../utils/text.js';
import { showToast } from '../utils/toast.js';

const SCAN_URL = 'https://harvest-pantry-scan.kaplancali.workers.dev';

/* ── State ──────────────────────────────────────────────────── */

let _overlay = null;
let _identified = [];    // raw strings from API
let _selected = new Set(); // items user has toggled on

/* ── Public API ─────────────────────────────────────────────── */

/**
 * Wire the scan button. Call once from initPantry().
 */
export function wirePantryScan() {
  const btn = document.getElementById('scanBtn');
  if (!btn) return;
  btn.addEventListener('click', () => _openFilePicker());
}

/* ── File picker ────────────────────────────────────────────── */

function _openFilePicker() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment'; // prefer rear camera on mobile
  input.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) _processFile(file);
  });
  input.click();
}

/* ── Process the image ──────────────────────────────────────── */

async function _processFile(file) {
  // Show scanning overlay immediately
  _showOverlay('scanning');

  try {
    // Convert to base64
    const base64 = await _fileToBase64(file);
    const mediaType = file.type || 'image/jpeg';

    // Call the worker
    const resp = await fetch(SCAN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        mediaType,
        slotLabel: 'groceries',
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        _showOverlay('error', err.message || 'Weekly scan limit reached — resets Sunday!');
      } else {
        _showOverlay('error', err.error || 'Scan failed — try again');
      }
      return;
    }

    const data = await resp.json();
    _identified = (data.ingredients || []).map(s => s.trim()).filter(Boolean);

    if (!_identified.length) {
      _showOverlay('error', "Couldn't spot any ingredients — try a clearer photo with good lighting.");
      return;
    }

    // Pre-select all, then show confirmation
    _selected = new Set(_identified);
    _showOverlay('confirm');

  } catch (err) {
    console.error('[scan] error:', err);
    _showOverlay('error', 'Something went wrong — check your connection and try again.');
  }
}

/* ── Overlay UI ─────────────────────────────────────────────── */

function _showOverlay(mode, message) {
  _dismissOverlay();

  _overlay = document.createElement('div');
  _overlay.className = 'scan-overlay';

  if (mode === 'scanning') {
    _overlay.innerHTML = `
      <div class="scan-modal">
        <div class="scan-spinner"></div>
        <p class="scan-status">Scanning your groceries...</p>
        <p class="scan-sub">This takes a few seconds</p>
      </div>
    `;
  } else if (mode === 'error') {
    _overlay.innerHTML = `
      <div class="scan-modal">
        <p class="scan-status">${escHTML(message)}</p>
        <div class="scan-actions">
          <button class="btn btn-outline" data-scan-retry>Try Another Photo</button>
          <button class="btn btn-outline" data-scan-close>Close</button>
        </div>
      </div>
    `;
  } else if (mode === 'confirm') {
    const chipsHTML = _identified.map(item => {
      const checked = _selected.has(item);
      return `<button class="scan-chip${checked ? ' on' : ''}" data-scan-item="${escHTML(item)}">
        ${checked ? '✓' : '+'} ${escHTML(item)}
      </button>`;
    }).join('');

    _overlay.innerHTML = `
      <div class="scan-modal scan-confirm">
        <h3 class="scan-title">We spotted ${_identified.length} ingredient${_identified.length !== 1 ? 's' : ''}</h3>
        <p class="scan-sub">Tap to toggle — uncheck anything that's wrong.</p>
        <div class="scan-chips">${chipsHTML}</div>
        <div class="scan-actions">
          <button class="btn btn-primary" data-scan-add>Add ${_selected.size} to Pantry</button>
          <button class="btn btn-outline" data-scan-retry>Scan Another</button>
          <button class="btn btn-outline" data-scan-close>Cancel</button>
        </div>
      </div>
    `;
  }

  document.body.appendChild(_overlay);

  // Fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => _overlay.classList.add('show'));
  });

  // Event delegation
  _overlay.addEventListener('click', (e) => {
    // Toggle chip
    const chip = e.target.closest('[data-scan-item]');
    if (chip) {
      const item = chip.dataset.scanItem;
      if (_selected.has(item)) {
        _selected.delete(item);
        chip.classList.remove('on');
        chip.textContent = `+ ${item}`;
      } else {
        _selected.add(item);
        chip.classList.add('on');
        chip.textContent = `✓ ${item}`;
      }
      // Update add button count
      const addBtn = _overlay.querySelector('[data-scan-add]');
      if (addBtn) addBtn.textContent = `Add ${_selected.size} to Pantry`;
      return;
    }

    // Add to pantry
    if (e.target.closest('[data-scan-add]')) {
      _addToPantry();
      return;
    }

    // Retry
    if (e.target.closest('[data-scan-retry]')) {
      _dismissOverlay();
      _openFilePicker();
      return;
    }

    // Close
    if (e.target.closest('[data-scan-close]')) {
      _dismissOverlay();
      return;
    }

    // Click on backdrop (not modal) = close
    if (!e.target.closest('.scan-modal')) {
      _dismissOverlay();
    }
  });
}

function _dismissOverlay() {
  if (_overlay) {
    _overlay.remove();
    _overlay = null;
  }
}

/* ── Add confirmed items to pantry ──────────────────────────── */

function _addToPantry() {
  if (!_selected.size) {
    showToast('Nothing selected — tap items to check them');
    return;
  }

  const current = get('ingredients');
  const inactive = get('inactiveIngs');
  const allNormed = new Set([...current.map(norm), ...inactive.map(norm)]);
  let added = 0;

  _selected.forEach(item => {
    const n = norm(item);
    if (n && !allNormed.has(n)) {
      current.push(item);
      allNormed.add(n);
      added++;
    } else if (n && inactive.map(norm).includes(n)) {
      // Re-activate
      const idx = inactive.findIndex(s => norm(s) === n);
      if (idx !== -1) {
        inactive.splice(idx, 1);
        set('inactiveIngs', inactive);
        if (!current.map(norm).includes(n)) {
          current.push(item);
          added++;
        }
      }
    }
  });

  if (added) {
    set('ingredients', current);
    autoSync();
    showToast(`${added} ingredient${added !== 1 ? 's' : ''} scanned in — nice haul`);

    if (!get('onboarded')) {
      set('onboarded', true);
    }
  } else {
    showToast('All of those are already in your pantry');
  }

  _dismissOverlay();
}

/* ── Helpers ────────────────────────────────────────────────── */

function _fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip data URL prefix to get raw base64
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
