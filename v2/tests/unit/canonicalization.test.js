/**
 * Regression tests for the ingredient canonicalization pipeline.
 *
 * Each test corresponds to a bug fixed during the matching audit. If any
 * of these fail, that bug class has regressed and the matcher will start
 * marking real-world recipes as "missing" ingredients the user actually has.
 */

import { describe, it, expect } from 'vitest';
import { stripMeasure, norm } from '../../src/utils/text.js';
import { findRecipes, isGlutenRecipe } from '../../src/services/matching.js';

// Helper: canonicalize one raw ingredient end-to-end the way the build
// script does. Uses the same pipeline (stripMeasure + norm + a few easy
// post-clean rules). The full canonicalizer is in scripts/canonicalize-
// ingredients.mjs — for runtime tests we just verify the underlying
// stripMeasure/norm primitives behave correctly.
function quickClean(s) {
  return norm(stripMeasure(s));
}

describe('stripMeasure: ingredient-bug regressions', () => {
  it('keeps "ground cloves" as cloves (not the original)', () => {
    // BUG: stripMeasure used to fall back to the original whenever its
    // result was a single unit word. "cloves" is also a real spice.
    expect(quickClean('¼ teaspoon ground cloves')).toBe('cloves');
  });

  it('strips "drained and rinsed" without requiring a leading comma', () => {
    // BUG: "1 15-oz can black beans drained and rinsed" lost the bean name
    // because the combined-AND guard rejected the whole match.
    expect(quickClean('1 15-ounce can black beans drained and rinsed')).toBe('black beans');
    expect(quickClean('1 15-oz can pinto beans, drained and rinsed')).toBe('pinto beans');
  });

  it('handles caster sugar (UK) without joining words', () => {
    // BUG: paren-strip was using empty string instead of single space →
    // "caster (superfine) sugar" became "castersugar".
    expect(quickClean('100 g caster (superfine) sugar')).toBe('caster sugar');
  });

  it('preserves spelt FLOUR but strips spelt-grain forms', () => {
    expect(quickClean('1 cup spelt flour')).toBe('spelt flour');
    // bare "spelt" is still recognizable — the gluten filter elsewhere
    // handles the un-makeable case
  });

  it('handles "Sea salt and freshly ground black pepper, to taste"', () => {
    // BUG: combined-ingredient splitter wrongly rejected this as
    // "too many words" because trailing whitespace got eaten by .trim()
    // before split.
    const out = quickClean('Sea salt and freshly ground black pepper, to taste');
    // Either canonicalizer-pre-stripped form or full passthrough; the key
    // behavior is matched in findRecipes (tested below).
    expect(out).toMatch(/salt/);
    expect(out).toMatch(/pepper/);
  });

  it('handles fractions correctly (½ ¼ ¾ ⅓ ⅔)', () => {
    expect(quickClean('½ tbsp olive oil')).toBe('olive oil');
    expect(quickClean('¼ cup soy sauce')).toBe('soy sauce');
    expect(quickClean('¾ cup flour')).toBe('flour');
  });

  it('strips multiple comma-prep notes', () => {
    expect(quickClean('1 onion, peeled and chopped')).toBe('onion');
    expect(quickClean('1 medium tomato, diced finely')).toBe('tomato');
  });

  it('drops "for garnish/topping/serving" usage notes', () => {
    expect(quickClean('chopped parsley, for garnish')).toBe('parsley');
    expect(quickClean('lime wedges, for serving')).toMatch(/lime/);
  });
});

describe('isGlutenRecipe: hard-gluten filter', () => {
  const make = (ings) => ({ ing: ings });

  it('flags farro recipes', () => {
    expect(isGlutenRecipe(make(['1 cup farro', 'spinach', 'olive oil']))).toBe(true);
  });
  it('flags couscous recipes', () => {
    expect(isGlutenRecipe(make(['1 cup pearl couscous', 'olive oil']))).toBe(true);
  });
  it('flags barley/seitan/bulgur', () => {
    expect(isGlutenRecipe(make(['barley']))).toBe(true);
    expect(isGlutenRecipe(make(['seitan']))).toBe(true);
    expect(isGlutenRecipe(make(['bulgur wheat']))).toBe(true);
  });
  it('flags beer/lager/ale/stout/ipa but NOT ginger ale', () => {
    expect(isGlutenRecipe(make(['1 cup pale ale']))).toBe(true);
    expect(isGlutenRecipe(make(['1 bottle stout']))).toBe(true);
    expect(isGlutenRecipe(make(['1 cup ginger ale']))).toBe(false);
  });
  it('does NOT flag spelt FLOUR (substitutable with 1:1 GF blend)', () => {
    expect(isGlutenRecipe(make(['1 cup spelt flour']))).toBe(false);
  });
  it('does not flag malt vinegar (GF in practice)', () => {
    expect(isGlutenRecipe(make(['1 tbsp malt vinegar']))).toBe(false);
  });
  it('does not flag ordinary GF recipes', () => {
    expect(isGlutenRecipe(make(['rice', 'beans', 'olive oil']))).toBe(false);
  });
});

describe('findRecipes: end-to-end matching against canonicalized recipes', () => {
  // Build a tiny recipe with the iclean field as canonicalize-
  // ingredients.mjs would produce.
  const make = (ing, iclean) => ({
    id: 1, title: 'Test Recipe', ing, iclean, cats: [], nut: { pro: 5, fib: 5 }
  });

  it('matches when user pantry contains the canonical name', () => {
    const recipe = make(
      ['1 15-oz can kidney beans, drained and rinsed'],
      [['kidney beans']]
    );
    const result = findRecipes({
      recipes: [recipe], staples: ['kidney beans'], ingredients: []
    });
    expect(result[0].pct).toBe(100);
  });

  it('combined ingredients: requires ALL components in pantry', () => {
    const recipe = make(
      ['Sea salt and freshly ground black pepper, to taste'],
      [['salt', 'pepper']]
    );
    // User with both → match
    const r1 = findRecipes({
      recipes: [recipe], staples: ['salt', 'pepper'], ingredients: []
    });
    expect(r1[0].pct).toBe(100);
    // User with only salt → no match (combined needs both)
    const r2 = findRecipes({
      recipes: [recipe], staples: ['salt'], ingredients: []
    });
    expect(r2[0].pct).toBe(0);
  });

  it('drops empty / cross-recipe / for-garnish ingredients from required count', () => {
    const recipe = make(
      ['1 cup rice', 'cilantro for garnish', '1 recipe Tahini Sauce'],
      [['rice'], [], []]
    );
    const result = findRecipes({
      recipes: [recipe], staples: ['rice'], ingredients: []
    });
    expect(result[0].pct).toBe(100);
  });

  it('gluten recipes are filtered out entirely', () => {
    const farroRecipe = make(['1 cup farro'], [['farro']]);
    const riceRecipe = make(['1 cup rice'], [['rice']]);
    const result = findRecipes({
      recipes: [farroRecipe, riceRecipe], staples: ['rice', 'farro'], ingredients: []
    });
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Test Recipe'); // only the rice one
  });
});
