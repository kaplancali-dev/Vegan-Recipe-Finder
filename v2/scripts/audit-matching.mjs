#!/usr/bin/env node
/**
 * Recipe matching audit.
 *
 * Loads the FULL pantry (every staple in Onboarding) and runs the matcher
 * against every recipe, then outputs:
 *   1. Headline metrics (% recipes 100%, ≥80%, missing-25%, etc.)
 *   2. The top failure patterns: which RAW ingredient strings are most
 *      commonly responsible for "missing" status.
 *   3. Per-recipe triage: recipes by % matched, with the specific ingredient
 *      strings that failed.
 *
 * Run from v2/ root:  node scripts/audit-matching.mjs
 *
 * Optional args:
 *   --limit=N        Only process first N recipes (for quick iteration)
 *   --threshold=N    Only show recipes below N% match (default 100)
 *   --top=N          Top N failure patterns to print (default 50)
 *   --recipe=ID      Drill into a single recipe by id, show ingredient-level trace
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Import the actual production matcher + alias data
const { findRecipes, expandWithAliases } = await import(join(ROOT, 'src/services/matching.js'));
const { norm } = await import(join(ROOT, 'src/utils/text.js'));

// Recipes
const recipes = JSON.parse(readFileSync(join(ROOT, 'src/data/recipes.json'), 'utf8'));

// Build the FULL pantry by importing Onboarding's STAPLE_SECTIONS.
// Onboarding.js is a UI module so it imports DOM-using modules. We need to
// extract STAPLE_SECTIONS without executing those imports. Easiest path:
// regex-extract the literal then `eval` the array literal in a sandboxed context.
const onboardSrc = readFileSync(join(ROOT, 'src/components/Onboarding.js'), 'utf8');
const sectMatch = onboardSrc.match(/const STAPLE_SECTIONS = (\[[\s\S]*?\n\];)/);
if (!sectMatch) {
  console.error('Could not locate STAPLE_SECTIONS literal in Onboarding.js');
  process.exit(1);
}
// eslint-disable-next-line no-eval
const STAPLE_SECTIONS = eval(sectMatch[1].slice(0, -1)); // strip trailing semicolon

const allStapleNames = STAPLE_SECTIONS.flatMap(s =>
  s.items.map(i => (typeof i === 'string' ? i : i.name))
);

// CLI flags
const argv = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const LIMIT = argv.limit ? Number(argv.limit) : 0;
const THRESHOLD = argv.threshold ? Number(argv.threshold) : 100;
const TOP = argv.top ? Number(argv.top) : 50;
const RECIPE_ID = argv.recipe ? String(argv.recipe) : null;

const pool = LIMIT ? recipes.slice(0, LIMIT) : recipes;

// Run the production matcher with FULL pantry as staples, no "today" ingredients.
const t0 = Date.now();
const results = findRecipes({
  recipes: pool,
  ingredients: [],
  staples: allStapleNames,
});
const elapsed = Date.now() - t0;

// ─── Metrics ──────────────────────────────────────────────────────────────
const total = results.length;
const at100 = results.filter(r => r.pct >= 100).length;
const at80 = results.filter(r => r.pct >= 80).length;
const at50 = results.filter(r => r.pct >= 50).length;

const missingByCount = new Map(); // need.length → count
for (const r of results) {
  const k = r.need.length;
  missingByCount.set(k, (missingByCount.get(k) || 0) + 1);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log(' HARVEST RECIPE MATCHING AUDIT');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Pantry: ${allStapleNames.length} unique staple items selected`);
console.log(`Recipes scored: ${total} in ${elapsed}ms`);
console.log('');
console.log(' Match distribution');
console.log(' ──────────────────');
console.log(`   100% match (can make NOW):      ${at100} (${(at100/total*100).toFixed(1)}%)`);
console.log(`   ≥80% match:                     ${at80} (${(at80/total*100).toFixed(1)}%)`);
console.log(`   ≥50% match:                     ${at50} (${(at50/total*100).toFixed(1)}%)`);
console.log(`   <100% match (missing anything): ${total - at100} (${((total-at100)/total*100).toFixed(1)}%)`);
console.log('');
console.log(' Distribution of missing-ingredient counts (recipes still <100%)');
const sortedMissing = [...missingByCount.entries()].filter(([k]) => k > 0).sort((a, b) => a[0] - b[0]);
for (const [k, cnt] of sortedMissing.slice(0, 12)) {
  console.log(`   missing ${String(k).padStart(2)} ing: ${String(cnt).padStart(5)} recipes`);
}

// ─── Single-recipe drill-down ─────────────────────────────────────────────
if (RECIPE_ID) {
  const r = results.find(x => String(x.id) === RECIPE_ID);
  if (!r) {
    console.log(`\nRecipe ${RECIPE_ID} not found.`);
    process.exit(0);
  }
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(` Recipe drill-down: ${RECIPE_ID} — ${r.title}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Match: ${r.pct}%   Have: ${r.have.length}   Need: ${r.need.length}`);
  console.log('\nMISSING ingredient strings (raw):');
  for (const n of r.needNames) console.log(`   ✗ ${n.trim()}`);
  console.log('\nMATCHED ingredient strings (raw):');
  for (const h of r.haveNames) console.log(`   ✓ ${h.trim()}`);
  process.exit(0);
}

// ─── Failure pattern analysis ─────────────────────────────────────────────
// Bucket every needed-ingredient by its NORMALIZED form so we can see which
// patterns are responsible for the most misses across recipes.
const failPatterns = new Map(); // normedFailingIng → { count, examples: Set, recipeIds: Set }

for (const r of results) {
  if (r.pct >= 100) continue;
  for (let i = 0; i < r.need.length; i++) {
    const normed = r.need[i];
    const raw = r.needNames[i];
    if (!failPatterns.has(normed)) {
      failPatterns.set(normed, { count: 0, examples: new Set(), recipeIds: new Set() });
    }
    const e = failPatterns.get(normed);
    e.count++;
    if (e.examples.size < 3) e.examples.add(raw.trim());
    if (e.recipeIds.size < 5) e.recipeIds.add(r.id);
  }
}

const sortedPatterns = [...failPatterns.entries()].sort((a, b) => b[1].count - a[1].count);

console.log('\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log(` TOP ${TOP} FAILURE PATTERNS (normalized ingredient → recipe count)`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('count  normalized                          example raw string');
console.log('─────  ──────────────────────────────────  ──────────────────────────────────');
for (const [normed, info] of sortedPatterns.slice(0, TOP)) {
  const ex = [...info.examples][0] || '';
  console.log(
    `${String(info.count).padStart(5)}  ${normed.padEnd(34).slice(0, 34)}  ${ex.slice(0, 60)}`
  );
}

// ─── Below-threshold recipe list (top 50 worst, plus a few mid-tier samples)
const belowThreshold = results.filter(r => r.pct < THRESHOLD).sort((a, b) => a.pct - b.pct);
console.log('\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log(` 30 WORST-MATCH RECIPES (below ${THRESHOLD}%, lowest first)`);
console.log('═══════════════════════════════════════════════════════════════');
for (const r of belowThreshold.slice(0, 30)) {
  console.log(`  ${String(r.pct).padStart(3)}%  id=${r.id}  ${r.title}`);
  for (const n of r.needNames.slice(0, 6)) console.log(`         ✗ ${n.trim()}`);
  if (r.needNames.length > 6) console.log(`         (+${r.needNames.length - 6} more)`);
}

// ─── Persist full failing-recipe list to disk for follow-up analysis ──────
const outPath = join(ROOT, '..', 'audit-output.json');
const outRows = belowThreshold.map(r => ({
  id: r.id,
  title: r.title,
  pct: r.pct,
  haveCount: r.have.length,
  needCount: r.need.length,
  needNames: r.needNames,
  haveNames: r.haveNames,
}));
writeFileSync(outPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  pantrySize: allStapleNames.length,
  total,
  at100,
  at80,
  failPatterns: sortedPatterns.slice(0, 200).map(([k, v]) => ({
    normalized: k,
    count: v.count,
    examples: [...v.examples],
    sampleRecipeIds: [...v.recipeIds],
  })),
  recipes: outRows,
}, null, 2));
console.log(`\nFull triage written to: ${outPath}`);
