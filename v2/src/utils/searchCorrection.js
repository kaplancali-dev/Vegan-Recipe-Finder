/**
 * Search query typo correction.
 *
 * Two layers:
 *   1. TYPO_CORRECTIONS dictionary — instant, precise, hand-curated.
 *   2. Levenshtein fuzzy fallback — corrects typos we didn't anticipate
 *      by comparing each word against a vocabulary built from the catalog.
 *
 * Returns { corrected, original, changed } — the corrected query, the
 * original query, and whether anything was changed.
 */

import { TYPO_CORRECTIONS } from '../data/typo-corrections.js';

/**
 * Compute Levenshtein edit distance between two short strings.
 * O(m*n) — fine for word-length comparisons (≤20 chars).
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,        // insert
        prev[j] + 1,            // delete
        prev[j - 1] + cost      // substitute
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Distance threshold scaled to word length:
 *   ≤4 chars  → 1 (one typo allowed)
 *   5-7       → 1
 *   ≥8        → 2
 * Avoids matching "rice" → "nice" etc.
 */
function maxDistance(wordLen) {
  if (wordLen <= 4) return 1;
  if (wordLen <= 7) return 1;
  return 2;
}

/**
 * Build a vocabulary of words appearing across recipe titles + ingredients.
 * Cached after first build.
 */
let _vocab = null;
function buildVocab(recipes) {
  if (_vocab) return _vocab;
  const set = new Set();
  for (const r of recipes) {
    if (r.title) {
      for (const w of r.title.toLowerCase().split(/[^a-zA-Z]+/)) {
        if (w.length >= 4) set.add(w);
      }
    }
    if (r.iclean) {
      for (const arr of r.iclean) {
        for (const c of arr || []) {
          for (const w of c.split(/\s+/)) {
            if (w.length >= 4) set.add(w);
          }
        }
      }
    }
  }
  _vocab = [...set];
  return _vocab;
}

/**
 * Find the closest matching vocabulary word for a misspelled query word.
 * Returns the corrected word or null if nothing within threshold.
 */
function fuzzyCorrectWord(word, vocab) {
  const lower = word.toLowerCase();
  // Skip very short words and pure-numeric tokens
  if (lower.length < 4 || /^\d+$/.test(lower)) return null;
  // Exact vocab match — already correct
  if (vocab.includes(lower)) return null;
  const max = maxDistance(lower.length);
  let best = null;
  let bestDist = max + 1;
  for (const v of vocab) {
    // Quick length-based prune
    if (Math.abs(v.length - lower.length) > max) continue;
    const d = levenshtein(lower, v);
    if (d <= max && d < bestDist) {
      best = v;
      bestDist = d;
      if (d === 0) break; // perfect match
    }
  }
  return best;
}

/**
 * Correct a search query.
 *
 * @param {string} query - Raw user input
 * @param {Object[]} [recipes] - Recipe catalog (for fuzzy fallback)
 * @returns {{ corrected: string, original: string, changed: boolean }}
 */
export function correctSearchQuery(query, recipes = []) {
  const original = (query || '').trim();
  if (!original) return { corrected: '', original: '', changed: false };

  const words = original.split(/\s+/);
  let changed = false;
  const corrected = words.map(w => {
    const lower = w.toLowerCase();
    // Layer 1: dictionary lookup
    if (TYPO_CORRECTIONS[lower]) {
      changed = true;
      return TYPO_CORRECTIONS[lower];
    }
    return w;
  });

  // Layer 2: only run Levenshtein if dictionary didn't already correct
  // (and only if we have a recipe catalog to compare against)
  if (!changed && recipes.length) {
    const vocab = buildVocab(recipes);
    const fuzzed = corrected.map(w => {
      const fix = fuzzyCorrectWord(w, vocab);
      if (fix && fix !== w.toLowerCase()) {
        changed = true;
        return fix;
      }
      return w;
    });
    return { corrected: fuzzed.join(' '), original, changed };
  }

  return { corrected: corrected.join(' '), original, changed };
}
