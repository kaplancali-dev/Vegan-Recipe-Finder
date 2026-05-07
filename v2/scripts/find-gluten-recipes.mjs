#!/usr/bin/env node
/**
 * Find recipes containing un-substitutable gluten ingredients.
 * Reports each recipe with the matching ingredient string for review.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const recipes = JSON.parse(readFileSync(join(ROOT, 'src/data/recipes.json'), 'utf8'));

// Hard-gluten ingredients — no viable GF version exists, OR the substitute
// is so different (different grain entirely) that the dish becomes a different
// recipe. These tag a recipe as un-GF-able.
// Hard-gluten ingredients with NO viable GF substitute. Spelt-flour and similar
// bakery-flour uses are EXCLUDED because 1:1 GF flour blends work; only the
// structural grain uses (spelt berries, etc.) are filtered.
const HARD_GLUTEN = [
  // Whole wheat berries / grains
  'farro', 'pearled farro',
  'bulgur', 'bulgur wheat', 'cracked wheat',
  'barley', 'pearl barley', 'pearled barley',
  'wheat berries', 'wheat berry',
  'freekeh', 'kamut', 'einkorn',
  // Couscous family — semolina based, no GF couscous mainstream
  'couscous', 'whole wheat couscous', 'pearl couscous', 'israeli couscous', 'moroccan couscous',
  // Pure-wheat protein
  'seitan', 'vital wheat gluten', 'wheat gluten',
  // Semolina/durum — pasta dough, gnocchi base
  'semolina', 'durum wheat', 'durum flour',
  // Spelt only when used as a grain ("spelt berries", "spelt grain"). Bare
  // "spelt" matched via lookahead-guarded regex below to skip "spelt flour".
  'spelt berries', 'spelt grain',
  // Rye — flour, bread, and berries all distinctive enough that GF swaps
  // change the recipe identity
  'rye flour', 'rye bread', 'rye berries', 'rye',
  // Alcohol with gluten — shaoxing, beer, lager, ale, stout, pilsner, ipa, malt
  'shaoxing wine', 'shaoxing rice wine', 'chinese cooking wine',
  'beer', 'lager', 'stout', 'pilsner',
  'malt extract', 'malt syrup', 'malted barley',
];

// Special-case patterns needing negative lookahead to avoid false matches
// (e.g. "spelt flour" is fine; "ale" should not match "ginger ale" — soda).
const SPECIAL_PATTERNS = [
  // Bare "spelt" used as a grain (rare — usually it's "spelt flour")
  String.raw`\bspelt\b(?!\s+flour)`,
  // "ale" but not "ginger ale" (soda, no gluten). Use lookbehind.
  String.raw`(?<!ginger\s)\bale\b`,
  // "ipa" beer
  String.raw`\bipa\b`,
  // bare "malt" (not malt vinegar — GF in practice)
  String.raw`\bmalt\b(?!\s+vinegar)`,
];

// Build word-boundary regex per term
const ESC = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const REGEXES = [
  ...HARD_GLUTEN.map(t => ({ term: t, re: new RegExp(`\\b${ESC(t)}\\b`, 'i') })),
  ...SPECIAL_PATTERNS.map(p => ({ term: p, re: new RegExp(p, 'i') })),
];

const flagged = [];
for (const r of recipes) {
  const ings = (r.ing || []).map(s => s.toLowerCase());
  const hits = new Set();
  for (const ing of ings) {
    for (const { term, re } of REGEXES) {
      if (re.test(ing)) hits.add(term);
    }
  }
  if (hits.size) {
    flagged.push({ id: r.id, title: r.title, hits: [...hits] });
  }
}

console.log(`Total recipes scanned: ${recipes.length}`);
console.log(`Flagged (contain hard-gluten ingredient): ${flagged.length}`);
console.log('');
// Group by primary trigger
const byTrigger = new Map();
for (const f of flagged) {
  for (const t of f.hits) {
    if (!byTrigger.has(t)) byTrigger.set(t, 0);
    byTrigger.set(t, byTrigger.get(t) + 1);
  }
}
console.log('Hits by trigger ingredient:');
for (const [t, c] of [...byTrigger.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(c).padStart(4)}  ${t}`);
}
console.log('');
console.log('First 30 flagged recipes:');
for (const f of flagged.slice(0, 30)) {
  console.log(`  id=${f.id}  [${f.hits.join(', ')}]  ${f.title}`);
}
