/**
 * Cook action — shared handler for "I Made This" button.
 *
 * If the recipe has no prior cook entries → show star rating → "would make again?" → log.
 * If it has a prior entry → show confirm (log again / undo) → act.
 */

import { get, set } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { showToast } from '../utils/toast.js';
import { showRating, showCookConfirm } from '../utils/rating.js';
import { shareRecipe } from './share.js';

/**
 * Handle a cook button tap for a given recipe ID.
 * Shows the appropriate dialog based on whether the recipe
 * has been cooked before, then updates cookHistory.
 *
 * @param {number} id - Recipe ID
 * @param {Object} [opts]
 * @param {string} [opts.title] - Recipe title (for share prompt)
 * @param {boolean} [opts.removeFromMakelist=false] - Also remove from makelist (Shopping tab)
 */
export async function handleCook(id, opts = {}) {
  const history = get('cookHistory');
  const lastEntry = history.filter(h => h.id === id).pop();

  if (lastEntry) {
    // Already cooked — offer undo or log again
    const dateStr = new Date(lastEntry.date)
      .toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    const choice = await showCookConfirm(dateStr);

    if (choice === 'undo') {
      // Remove ALL entries for this recipe
      set('cookHistory', history.filter(h => h.id !== id));
      autoSync();
      showToast('Cook history cleared for this recipe');
      return;
    }

    if (choice === 'cancel') return;

    // choice === 'log' — fall through to rating
  }

  // First cook or "log again" — show star rating
  const rating = await showRating();
  let freshHistory = get('cookHistory');
  // Cap history at 500 entries to prevent localStorage bloat
  if (freshHistory.length >= 500) {
    freshHistory = freshHistory.slice(-499);
  }
  set('cookHistory', [...freshHistory, { id, date: new Date().toISOString(), rating }]);

  if (opts.removeFromMakelist) {
    const current = get('makelist');
    set('makelist', current.filter(i => i !== id));
  }

  autoSync();

  // Brief pause then ask "Would you make this again?"
  await new Promise(r => setTimeout(r, 400));
  const again = await _showWouldMakeAgain();
  if (again !== null) {
    const fresh = get('cookHistory');
    // Find the entry we just added (last one for this recipe) and clone before mutating
    for (let i = fresh.length - 1; i >= 0; i--) {
      if (fresh[i].id === id) {
        fresh[i] = { ...fresh[i], wouldMakeAgain: again };
        break;
      }
    }
    set('cookHistory', fresh);
    autoSync();
  }

  // Show share toast with 5-second auto-dismiss
  _showShareToast(id, opts.title);
}

/* ── Share toast after cook ─────────────────────────────────── */

function _showShareToast(id, title) {
  const el = document.createElement('div');
  el.className = 'cook-share-toast';
  el.innerHTML = `
    <span class="cook-share-text">Added to your cooking journal</span>
    <button class="cook-share-btn">Share with a friend</button>
  `;

  el.querySelector('.cook-share-btn').addEventListener('click', () => {
    shareRecipe(title || '', '', id);
    el.remove();
  });

  document.body.appendChild(el);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (el.parentNode) {
      el.classList.add('cook-share-toast-out');
      setTimeout(() => el.remove(), 300);
    }
  }, 5000);
}

/* ── "Would you make this again?" modal ──────────────────────── */

function _showWouldMakeAgain() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:320px;text-align:center;padding:24px">
        <p style="font-size:1rem;font-weight:600;margin-bottom:16px">Would you make this again?</p>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-green" data-again="yes" style="min-width:80px">👍 Yes</button>
          <button class="btn btn-outline" data-again="no" style="min-width:80px">👎 No</button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-again]');
      if (btn) {
        overlay.remove();
        resolve(btn.dataset.again === 'yes');
        return;
      }
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    });

    document.body.appendChild(overlay);
  });
}
