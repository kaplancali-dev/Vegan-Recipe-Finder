/**
 * Cook action — shared handler for "I Made This" button.
 *
 * If the recipe has no prior cook entries → show star rating → log.
 * If it has a prior entry → show confirm (log again / undo) → act.
 */

import { get, set } from '../state/store.js';
import { autoSync } from '../services/sync.js';
import { showToast } from '../utils/toast.js';
import { showRating, showCookConfirm } from '../utils/rating.js';

/**
 * Handle a cook button tap for a given recipe ID.
 * Shows the appropriate dialog based on whether the recipe
 * has been cooked before, then updates cookHistory.
 *
 * @param {number} id - Recipe ID
 * @param {Object} [opts]
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
      // Remove the last entry for this recipe
      const idx = history.lastIndexOf(lastEntry);
      if (idx !== -1) {
        history.splice(idx, 1);
        set('cookHistory', history);
        autoSync();
        showToast('Last cook entry removed');
      }
      return;
    }

    if (choice === 'cancel') return;

    // choice === 'log' — fall through to rating
  }

  // First cook or "log again" — show star rating
  const rating = await showRating();
  const freshHistory = get('cookHistory');
  freshHistory.push({ id, date: new Date().toISOString(), rating });
  set('cookHistory', freshHistory);

  if (opts.removeFromMakelist) {
    const current = get('makelist');
    set('makelist', current.filter(i => i !== id));
  }

  autoSync();
  const stars = rating ? ' ' + '★'.repeat(rating) : '';
  showToast(`Saved to Cook History${stars}`);
}
