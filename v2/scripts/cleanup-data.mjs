#!/usr/bin/env node
/**
 * Data quality cleanup for recipes.json:
 *   1. Remove hard-gluten recipes from the raw catalog
 *   2. Resolve duplicate URLs (keep best-quality version)
 *   3. Strip brand names from ingredient text
 *   4. Remove empty ingredient lines
 *
 * Usage:
 *   node scripts/cleanup-data.mjs                  # dry-run, prints what would change
 *   node scripts/cleanup-data.mjs --apply          # actually writes recipes.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RECIPES_PATH = join(ROOT, 'src/data/recipes.json');

const APPLY = process.argv.includes('--apply');

const { HARD_GLUTEN_REGEX } = await import(join(ROOT, 'src/data/aliases.js'));

let recipes = JSON.parse(readFileSync(RECIPES_PATH, 'utf8'));
const startCount = recipes.length;

console.log(`Loaded ${startCount} recipes from recipes.json`);
console.log(APPLY ? 'Mode: APPLY (will write changes)' : 'Mode: DRY-RUN (use --apply to write)');
console.log('');

// ─── 1. Remove hard-gluten recipes ────────────────────────────────────────
const isGluten = r => (r.ing || []).some(ing => HARD_GLUTEN_REGEX.test(ing));
const beforeGluten = recipes.length;
const removedGluten = recipes.filter(isGluten);
recipes = recipes.filter(r => !isGluten(r));
console.log(`✗ Removed ${removedGluten.length} hard-gluten recipes`);
if (removedGluten.length) {
  for (const r of removedGluten.slice(0, 5)) {
    console.log(`    id=${r.id}  ${r.title}`);
  }
  if (removedGluten.length > 5) console.log(`    (+${removedGluten.length - 5} more)`);
}
console.log('');

// ─── 2. Resolve duplicate URLs ────────────────────────────────────────────
// For each duplicate URL group, keep the recipe with the most complete data
// (most ingredients, has nutrition, has image, lower id as tiebreaker).
const byUrl = new Map();
for (const r of recipes) {
  const k = (r.url || '').trim().toLowerCase().replace(/\/$/, '');
  if (!k) continue;
  if (!byUrl.has(k)) byUrl.set(k, []);
  byUrl.get(k).push(r);
}
function score(r) {
  const ingCount = (r.ing || []).length;
  const hasNut = r.nut && Object.values(r.nut).some(v => v) ? 1 : 0;
  const hasImg = r.img ? 1 : 0;
  return ingCount * 10 + hasNut * 5 + hasImg * 5;
}
const dropFromDupe = new Set();
let dupeGroups = 0;
for (const [url, group] of byUrl.entries()) {
  if (group.length < 2) continue;
  dupeGroups++;
  // Sort: highest score wins, lowest id breaks ties
  group.sort((a, b) => score(b) - score(a) || a.id - b.id);
  const keep = group[0];
  for (const r of group.slice(1)) {
    dropFromDupe.add(r.id);
  }
  if (dupeGroups <= 5) {
    console.log(`  Dupe URL: ${url.slice(0, 70)}`);
    console.log(`    keep id=${keep.id} (score=${score(keep)}), drop ${group.slice(1).map(r => `id=${r.id}`).join(', ')}`);
  }
}
recipes = recipes.filter(r => !dropFromDupe.has(r.id));
console.log(`✗ Removed ${dropFromDupe.size} duplicate-URL recipes (${dupeGroups} dupe groups)`);
console.log('');

// ─── 3. Strip brand names from ingredient text ────────────────────────────
const BRAND_RES = [
  // "(I use Brand X)" / "(I used Brand X)" — kill the whole parenthetical
  /\s*\(\s*i\s+use(?:d)?[^)]*\)/gi,
  // "((Brand X))" double-paren style
  /\s*\(\(\s*[^)]*?\s*\)\)/gi,
  // Specific brand names appearing as prefix or inline
  /\bbob['’‘]?s\s+red\s+mill\b\s*/gi,
  /\bking\s+arthur\b\s*/gi,
  /\bbarilla\b\s*/gi,
  /\bbanza\b\s*/gi,
  /\btrader\s+joe['’‘]?s\b\s*/gi,
  /\bcostco\b\s*/gi,
  /\bwhole\s+foods\b\s*/gi,
  /\benjoy\s+life\b\s*/gi,
];
let brandFixCount = 0;
for (const r of recipes) {
  for (let i = 0; i < (r.ing || []).length; i++) {
    const orig = r.ing[i];
    // First check if ANY brand regex actually matches — only mutate if so.
    // Reset lastIndex on each g-flagged regex before testing to avoid
    // stateful-regex bugs.
    const hasBrand = BRAND_RES.some(re => { re.lastIndex = 0; return re.test(orig); });
    if (!hasBrand) continue;
    let cleaned = orig;
    for (const re of BRAND_RES) {
      cleaned = cleaned.replace(re, ' ');
    }
    // Tidy up only what brand-removal might leave behind: extra whitespace,
    // and an orphan trailing `)` if its `(` was inside the removed brand text.
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    // Strip orphan trailing `)` only if there's no matching `(` to its left
    if (cleaned.endsWith(')') && !cleaned.includes('(')) {
      cleaned = cleaned.replace(/\s*\)\s*$/, '').trim();
    }
    if (cleaned !== orig) {
      r.ing[i] = cleaned;
      brandFixCount++;
      if (brandFixCount <= 12) {
        console.log(`  id=${r.id}: ${orig.slice(0, 80).trim()}`);
        console.log(`        → ${cleaned.slice(0, 80).trim()}`);
      }
    }
  }
}
console.log(`✗ Cleaned ${brandFixCount} ingredient strings (brand names stripped)`);
console.log('');

// ─── 4. Remove empty ingredient lines ─────────────────────────────────────
let emptyStripCount = 0;
let recipesWithEmpties = 0;
for (const r of recipes) {
  const before = (r.ing || []).length;
  // Filter ing[] but keep iclean[] in lockstep
  const newIng = [];
  const newIclean = [];
  for (let i = 0; i < (r.ing || []).length; i++) {
    if (r.ing[i] && r.ing[i].trim()) {
      newIng.push(r.ing[i]);
      if (Array.isArray(r.iclean)) newIclean.push(r.iclean[i] || []);
    }
  }
  if (newIng.length !== before) {
    recipesWithEmpties++;
    emptyStripCount += (before - newIng.length);
    r.ing = newIng;
    if (Array.isArray(r.iclean)) r.iclean = newIclean;
  }
}
console.log(`✗ Removed ${emptyStripCount} empty ingredient lines from ${recipesWithEmpties} recipes`);
console.log('');

// ─── Summary ──────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════');
console.log(` Recipes: ${startCount} → ${recipes.length} (${startCount - recipes.length} removed)`);
console.log(` Brand strings cleaned: ${brandFixCount}`);
console.log(` Empty lines stripped:  ${emptyStripCount}`);
console.log('═══════════════════════════════════════════════════════════════');

if (APPLY) {
  writeFileSync(RECIPES_PATH, JSON.stringify(recipes));
  const sizeKB = Math.round(JSON.stringify(recipes).length / 1024);
  console.log(`\n✓ Wrote ${recipes.length} recipes to recipes.json (${sizeKB} KB)`);
} else {
  console.log(`\n(dry-run) Pass --apply to actually write recipes.json`);
}
