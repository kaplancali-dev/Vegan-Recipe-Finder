#!/usr/bin/env node
/**
 * Verify the allergen-aware substitution logic.
 *
 * Test scenario: a tree-nut-allergic user with a typical informed pantry
 * (oat milk, tahini, sunflower butter, etc.) — the kind of user who keeps
 * non-nut substitutes specifically BECAUSE they can't use the nut versions.
 *
 * Compare:
 *   1. Recipes available WITHOUT the smart-swap fix (blanket exclusion)
 *   2. Recipes available WITH the fix (allowed when substitute exists)
 *
 * The delta is the set of recipes that were unfairly excluded before.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const { findRecipes, recipeHasAllergen } = await import(join(ROOT, 'src/services/matching.js'));
const recipes = JSON.parse(readFileSync(join(ROOT, 'src/data/recipes.json'), 'utf8'));

// A nut-allergic user with an informed substitute pantry.
const nutAllergicUser = {
  staples: [
    'oat milk','rice milk','soy milk','hemp milk',  // plant milks (no nuts)
    'tahini','sunflower butter','sunflower seed butter','pumpkin seed butter',  // seed butters
    'olive oil','sesame oil','avocado oil',
    'chickpeas','black beans','lentils','tofu','tempeh',
    'rice','quinoa','oats','potatoes','sweet potatoes',
    'garlic','onion','tomatoes','spinach','kale','bell peppers',
    'lemon','lime','salt','pepper','cumin','paprika','garlic powder','onion powder',
    'maple syrup','soy sauce','vinegar','vegetable broth',
  ],
  ingredients: [],
};

// Run with allergy active
console.log('═══ Tree nut allergy active ═══\n');

const withFix = findRecipes({
  recipes,
  ingredients: nutAllergicUser.ingredients,
  staples: nutAllergicUser.staples,
  allergies: new Set(['tree nut']),
});

console.log(`Total recipes available (with fix): ${withFix.length}`);
const at100WithFix = withFix.filter(r => r.pct >= 100);
console.log(`Of those at 100% match: ${at100WithFix.length}`);

// Manual comparison: how many recipes contain tree-nut keywords AND are
// now in the result set? Those are the recipes the fix unlocked.
const nutContaining = withFix.filter(r => recipeHasAllergen(r, 'tree nut'));
console.log(`\nRecipes containing tree-nut keywords now allowed: ${nutContaining.length}`);
console.log(`(Before the fix, ALL of these would have been excluded blanket.)`);

console.log('\n──── Sample of newly-allowed recipes (first 10) ────\n');
nutContaining.slice(0, 10).forEach(r => {
  // Find which ingredient(s) had nut keywords
  const nutIngs = r.ing.filter(i => /\b(?:almond|cashew|macadamia|pistachio|hazelnut|pecan|walnut|pine nut)\b/i.test(i));
  console.log(`• [${r.id}] ${r.title} (${r.pct}% match)`);
  nutIngs.slice(0, 2).forEach(ni => console.log(`    contains: ${ni.slice(0, 70)}`));
});

console.log('\n──── Spot-checks: Should the fix correctly DENY these? ────\n');

// A recipe with whole almonds (no clean swap) — should still be filtered
const wholeAlmondRecipes = recipes.filter(r =>
  r.ing.some(i => /\balmonds?\b/i.test(i)) &&
  !r.ing.some(i => /almond (?:milk|butter|flour|extract)/i.test(i))
);
console.log(`Recipes with whole almonds (no easy swap): ${wholeAlmondRecipes.length}`);

const allowedWholeAlmonds = wholeAlmondRecipes.filter(r =>
  withFix.some(wr => wr.id === r.id)
);
console.log(`  Of those, allowed by fix: ${allowedWholeAlmonds.length}`);
console.log(`  ${allowedWholeAlmonds.length === 0 ? '✓ Correctly excluded (no swap exists for whole almonds)' : '⚠️  Some whole-almond recipes leaked through — investigate'}`);

// Now the comparison: what was the count BEFORE the fix?
// We can simulate by using a strict allergen check (any allergen → exclude)
const strictPool = recipes.filter(r => !recipeHasAllergen(r, 'tree nut'));
const strictWithMatching = findRecipes({
  recipes: strictPool,
  ingredients: nutAllergicUser.ingredients,
  staples: nutAllergicUser.staples,
  // Don't pass allergies here — already filtered the pool
});
console.log(`\n══ Comparison ══`);
console.log(`Before fix (blanket exclude):  ${strictWithMatching.length} recipes`);
console.log(`After fix (smart substitute):  ${withFix.length} recipes`);
console.log(`Delta — newly-unlocked:        +${withFix.length - strictWithMatching.length}`);

const at100Strict = strictWithMatching.filter(r => r.pct >= 100).length;
console.log(`\n100% matches before:  ${at100Strict}`);
console.log(`100% matches after:   ${at100WithFix.length}`);
console.log(`Delta:                +${at100WithFix.length - at100Strict}`);
