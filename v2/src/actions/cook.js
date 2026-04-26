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
  const stars = rating ? ' ' + '★'.repeat(rating) : '';
  showToast(`Saved to Cook History${stars}`);
}
