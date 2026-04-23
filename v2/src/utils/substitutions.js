/**
 * Substitution hints — find possible ingredient substitutions.
 */

import { INGREDIENT_SUBS } from '../data/aliases.js';
import { norm } from './text.js';

/**
 * Given a missing ingredient and the user's available ingredients,
 * find a possible substitution.
 * @param {string} missing - The missing ingredient name
 * @param {string[]} userIngs - User's available ingredients (normalized)
 * @returns {string|null} The substitute ingredient name, or null
 */
export function findSubstitute(missing, userIngs) {
  const normMissing = norm(missing);
  // Check if any of the user's ingredients can substitute for the missing one
  for (const userIng of userIngs) {
    const normUser = norm(userIng);
    const subs = INGREDIENT_SUBS[normUser];
    if (subs && subs.some(s => norm(s) === normMissing)) {
      return userIng;
    }
  }
  // Also check reverse: if the missing ingredient's subs include something user has
  const missingSubs = INGREDIENT_SUBS[normMissing];
  if (missingSubs) {
    for (const sub of missingSubs) {
      if (userIngs.some(u => norm(u) === norm(sub))) {
        return sub;
      }
    }
  }
  return null;
}
