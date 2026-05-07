#!/usr/bin/env node
/**
 * Recipe database health check.
 *
 * Scans recipes.json for data quality issues and produces a triage report.
 * Run periodically (or in CI) to catch regressions in scraped data.
 *
 * Usage:
 *   node scripts/health-check.mjs           # full report to stdout
 *   node scripts/health-check.mjs --fail-on-warning  # exit non-zero if any warnings
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const recipes = JSON.parse(readFileSync(join(ROOT, 'src/data/recipes.json'), 'utf8'));

const argv = Object.fromEntries(process.argv.slice(2).map(a => [a.replace(/^--/, ''), true]));
const FAIL_ON_WARN = !!argv['fail-on-warning'];

const issues = {
  missingTitle: [],
  missingUrl: [],
  missingNutrition: [],
  noIngredients: [],
  emptyIngredients: [],     // recipe has empty/whitespace-only entries
  missingIclean: [],        // recipe lacks the canonical iclean field
  icleanMisaligned: [],     // iclean.length !== ing.length
  glutenLeak: [],           // hard-gluten ingredient present despite filter
  brandLeak: [],            // recognizable brand names in ingredients (Bob's Red Mill, etc.)
  duplicateTitles: new Map(),
  duplicateUrls: new Map(),
  abnormallyShort: [],      // <2 ingredients
  abnormallyLong: [],       // >40 ingredients (likely scraping bug)
  noImage: [],
  noNutritionValues: [],    // nut object exists but all zero
  unreasonableCalories: [], // > 2500 cal/serving
};

const HARD_GLUTEN_RE = /\b(?:farro|pearled\s+farro|bulgur|barley|wheat\s+berr(?:y|ies)|freekeh|kamut|einkorn|couscous|seitan|vital\s+wheat\s+gluten|wheat\s+gluten|semolina|durum|spelt\s+berries|rye\s+(?:flour|bread|berries)|shaoxing|chinese\s+cooking\s+wine|stout|pilsner|malt\s+(?:extract|syrup)|malted\s+barley)\b/i;
const SPELT_RE = /\bspelt\b(?!\s+flour)/i;
const ALE_RE = /(?<!ginger\s)\bale\b/i;
const BEER_RE = /\b(?:beer|lager)\b/i;

const BRAND_NAMES = [
  /\bbob['']s\s+red\s+mill\b/i,
  /\bking\s+arthur\b/i,
  /\bbarilla\b/i,
  /\bbanza\b/i,
  /\btrader\s+joe['']?s\b/i,
  /\bcostco\b/i,
  /\bwhole\s+foods\b/i,
];

for (const r of recipes) {
  if (!r.title || !r.title.trim()) issues.missingTitle.push(r.id);
  if (!r.url) issues.missingUrl.push(r.id);
  if (!r.nut) issues.missingNutrition.push(r.id);
  if (r.nut && Object.values(r.nut).every(v => !v)) {
    issues.noNutritionValues.push(r.id);
  }
  if (r.nut && r.nut.cal > 2500) {
    issues.unreasonableCalories.push({ id: r.id, cal: r.nut.cal, title: r.title });
  }
  if (!r.img) issues.noImage.push(r.id);

  const ings = r.ing || [];
  if (ings.length === 0) issues.noIngredients.push(r.id);
  if (ings.length < 2) issues.abnormallyShort.push({ id: r.id, count: ings.length, title: r.title });
  if (ings.length > 40) issues.abnormallyLong.push({ id: r.id, count: ings.length, title: r.title });

  let emptyCount = 0;
  let glutenCount = 0;
  let brandCount = 0;
  for (const ing of ings) {
    if (!ing || !ing.trim()) emptyCount++;
    if (HARD_GLUTEN_RE.test(ing) || SPELT_RE.test(ing) || ALE_RE.test(ing) || BEER_RE.test(ing)) {
      glutenCount++;
    }
    for (const brand of BRAND_NAMES) {
      if (brand.test(ing)) { brandCount++; break; }
    }
  }
  if (emptyCount > 0) issues.emptyIngredients.push({ id: r.id, count: emptyCount });
  if (glutenCount > 0) issues.glutenLeak.push({ id: r.id, count: glutenCount, title: r.title });
  if (brandCount > 0) issues.brandLeak.push({ id: r.id, count: brandCount, title: r.title });

  if (!r.iclean) {
    issues.missingIclean.push(r.id);
  } else if (r.iclean.length !== ings.length) {
    issues.icleanMisaligned.push({ id: r.id, ing: ings.length, iclean: r.iclean.length });
  }

  if (r.title) {
    const k = r.title.trim().toLowerCase();
    if (!issues.duplicateTitles.has(k)) issues.duplicateTitles.set(k, []);
    issues.duplicateTitles.get(k).push(r.id);
  }
  if (r.url) {
    const k = r.url.trim().toLowerCase().replace(/\/$/, '');
    if (!issues.duplicateUrls.has(k)) issues.duplicateUrls.set(k, []);
    issues.duplicateUrls.get(k).push(r.id);
  }
}

const dupeTitles = [...issues.duplicateTitles.entries()].filter(([, ids]) => ids.length > 1);
const dupeUrls = [...issues.duplicateUrls.entries()].filter(([, ids]) => ids.length > 1);

// ─── Print report ─────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════════');
console.log(' HARVEST DATABASE HEALTH CHECK');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Total recipes scanned: ${recipes.length}`);
console.log('');

const W = (label, list, opt = {}) => {
  const count = Array.isArray(list) ? list.length : list;
  if (!count) {
    console.log(`✓ ${label.padEnd(45)} 0`);
    return false;
  }
  const tag = opt.severe ? '✗' : '⚠';
  console.log(`${tag} ${label.padEnd(45)} ${count}`);
  if (opt.show) {
    const sample = Array.isArray(list) ? list.slice(0, opt.show) : [];
    for (const item of sample) {
      if (typeof item === 'object') {
        console.log(`    id=${item.id}  ${JSON.stringify(item).slice(0, 100)}`);
      } else {
        console.log(`    id=${item}`);
      }
    }
    if (Array.isArray(list) && list.length > opt.show) {
      console.log(`    (+${list.length - opt.show} more)`);
    }
  }
  return true;
};

let warnings = 0;
let errors = 0;

console.log(' Critical (block release if non-zero)');
console.log(' ──────────────────────────────────');
if (W('Recipes missing title', issues.missingTitle, { severe: true, show: 5 })) errors++;
if (W('Recipes with zero ingredients', issues.noIngredients, { severe: true, show: 5 })) errors++;
if (W('Gluten-leak (hard-gluten in catalog)', issues.glutenLeak, { severe: true, show: 5 })) errors++;
if (W('iclean misaligned with ing[]', issues.icleanMisaligned, { severe: true, show: 5 })) errors++;
console.log('');

console.log(' Warnings (review and fix when possible)');
console.log(' ──────────────────────────────────');
if (W('Duplicate titles', dupeTitles, { show: 5 })) warnings++;
if (W('Duplicate URLs', dupeUrls, { show: 5 })) warnings++;
if (W('Recipes missing iclean field', issues.missingIclean, { show: 3 })) warnings++;
if (W('Recipes with empty ingredient lines', issues.emptyIngredients, { show: 3 })) warnings++;
if (W('Brand name in ingredient text', issues.brandLeak, { show: 3 })) warnings++;
if (W('Recipes with <2 ingredients', issues.abnormallyShort, { show: 3 })) warnings++;
if (W('Recipes with >40 ingredients', issues.abnormallyLong, { show: 3 })) warnings++;
if (W('Recipes missing URL', issues.missingUrl, { show: 3 })) warnings++;
if (W('Recipes missing nutrition object', issues.missingNutrition, { show: 3 })) warnings++;
if (W('Recipes with all-zero nutrition values', issues.noNutritionValues, { show: 3 })) warnings++;
if (W('Recipes with >2500 calories/serving', issues.unreasonableCalories, { show: 5 })) warnings++;
if (W('Recipes missing image', issues.noImage, { show: 3 })) warnings++;
console.log('');

console.log('═══════════════════════════════════════════════════════════════');
console.log(` Summary: ${errors} critical, ${warnings} warnings`);
console.log('═══════════════════════════════════════════════════════════════');

if (errors > 0 || (FAIL_ON_WARN && warnings > 0)) process.exit(1);
