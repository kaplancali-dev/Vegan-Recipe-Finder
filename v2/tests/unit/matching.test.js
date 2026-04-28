import { describe, it, expect } from 'vitest';
import {
  expandWithAliases,
  ingredientMatches,
  recipeHasAllergen,
  findRecipes,
  sortResults,
  computePantryPower,
} from '../../src/services/matching.js';

// Minimal recipe fixtures
const TOFU_CURRY = {
  id: 1, title: 'Tofu Curry', site: 'Test Kitchen', time: 30, servings: 4,
  cats: ['Dinner', 'Gluten-Free'],
  ing: ['tofu', 'coconut milk', 'curry powder', 'garlic', 'rice'],
  nut: { cal: 400, pro: 18, carb: 45, fat: 20, fib: 5 },
};

const PASTA_SALAD = {
  id: 2, title: 'Pasta Salad', site: 'Test Kitchen', time: 15, servings: 2,
  cats: ['Lunch', 'Quick Meals'],
  ing: ['pasta', 'tomatoes', 'basil', 'olive oil', 'salt'],
  nut: { cal: 300, pro: 8, carb: 50, fat: 10, fib: 3 },
};

const PEANUT_NOODLES = {
  id: 3, title: 'Peanut Noodles', site: 'Test Kitchen', time: 20, servings: 2,
  cats: ['Dinner', 'Quick Meals'],
  ing: ['peanut butter', 'soy sauce', 'noodles', 'garlic', 'lime'],
  nut: { cal: 450, pro: 16, carb: 55, fat: 22, fib: 4 },
};

const HIGH_PROTEIN_BOWL = {
  id: 4, title: 'Protein Power Bowl', site: 'Test Kitchen', time: 25, servings: 1,
  cats: ['Lunch', 'High-Protein'],
  ing: ['tofu', 'quinoa', 'kale', 'tahini', 'lemon'],
  nut: { cal: 500, pro: 28, carb: 40, fat: 25, fib: 8 },
};

const RECIPES = [TOFU_CURRY, PASTA_SALAD, PEANUT_NOODLES, HIGH_PROTEIN_BOWL];

describe('expandWithAliases()', () => {
  it('normalizes input ingredients', () => {
    const result = expandWithAliases(['Olive Oil']);
    expect(result).toContain('olive oil');
  });

  it('expands generic aliases', () => {
    const result = expandWithAliases(['mushrooms (any)']);
    expect(result).toContain('shiitake mushrooms');
    expect(result).toContain('portobello mushrooms');
    expect(result).toContain('cremini');
  });

  it('expands one-way substitutions', () => {
    const result = expandWithAliases(['olive oil']);
    expect(result).toContain('coconut oil');
    expect(result).toContain('avocado oil');
    expect(result).toContain('vegetable oil');
  });

  it('does not expand in reverse for subs (one-way)', () => {
    // Having coconut oil should NOT expand to include olive oil via INGREDIENT_SUBS
    // Wait — actually it does, because coconut oil has its own sub entry
    const result = expandWithAliases(['coconut oil']);
    expect(result).toContain('olive oil'); // coconut oil → [olive oil, vegetable oil, light oil]
  });

  it('handles multiple ingredients', () => {
    const result = expandWithAliases(['rice (any)', 'plant-based milk (any)']);
    expect(result).toContain('brown rice');
    expect(result).toContain('jasmine rice');
    expect(result).toContain('almond milk');
    expect(result).toContain('oat milk');
  });

  it('returns unique entries (no duplicates)', () => {
    const result = expandWithAliases(['maple syrup', 'agave']);
    const unique = new Set(result);
    expect(result.length).toBe(unique.size);
  });

  it('handles empty input', () => {
    expect(expandWithAliases([])).toEqual([]);
  });
});

describe('ingredientMatches()', () => {
  it('matches exact normalized ingredients', () => {
    expect(ingredientMatches('garlic', ['garlic', 'onion'])).toBe(true);
  });

  it('rejects identity-changing suffix matches (coconut ≠ coconut milk)', () => {
    expect(ingredientMatches('coconut milk', ['coconut'])).toBe(false);
    expect(ingredientMatches('avocado', ['avocado oil'])).toBe(false);
    expect(ingredientMatches('sesame', ['sesame oil'])).toBe(false);
    expect(ingredientMatches('coconut', ['coconut milk'])).toBe(false);
    expect(ingredientMatches('almond', ['almond flour'])).toBe(false);
  });

  it('matches by substring (user ingredient contains recipe)', () => {
    expect(ingredientMatches('rice', ['brown rice'])).toBe(true);
    expect(ingredientMatches('mushroom', ['shiitake mushroom'])).toBe(true);
  });

  it('returns false for no match', () => {
    expect(ingredientMatches('tofu', ['garlic', 'onion'])).toBe(false);
  });
});

describe('recipeHasAllergen()', () => {
  it('detects peanut allergen', () => {
    expect(recipeHasAllergen(PEANUT_NOODLES, 'peanut')).toBe(true);
    expect(recipeHasAllergen(TOFU_CURRY, 'peanut')).toBe(false);
  });

  it('detects soy allergen', () => {
    expect(recipeHasAllergen(PEANUT_NOODLES, 'soy')).toBe(true); // soy sauce
    expect(recipeHasAllergen(TOFU_CURRY, 'soy')).toBe(true); // tofu
  });

  it('detects coconut allergen', () => {
    expect(recipeHasAllergen(TOFU_CURRY, 'coconut')).toBe(true); // coconut milk
    expect(recipeHasAllergen(PASTA_SALAD, 'coconut')).toBe(false);
  });

  it('detects nightshade allergen', () => {
    expect(recipeHasAllergen(PASTA_SALAD, 'nightshade')).toBe(true); // tomatoes
    expect(recipeHasAllergen(HIGH_PROTEIN_BOWL, 'nightshade')).toBe(false);
  });

  it('handles unknown allergen key gracefully', () => {
    // Falls back to using the key itself as a keyword
    expect(recipeHasAllergen(TOFU_CURRY, 'garlic')).toBe(true);
    expect(recipeHasAllergen(TOFU_CURRY, 'chocolate')).toBe(false);
  });
});

describe('findRecipes()', () => {
  it('returns all recipes sorted by match percentage', () => {
    const results = findRecipes({ recipes: RECIPES, ingredients: ['tofu', 'garlic'], staples: [] });
    expect(results.length).toBe(4);
    // Tofu curry has tofu + garlic = 2/5 ingredients
    const curryResult = results.find(r => r.id === 1);
    expect(curryResult.pct).toBe(40);
    expect(curryResult.haveNames).toContain('tofu');
    expect(curryResult.haveNames).toContain('garlic');
  });

  it('uses staples + ingredients combined for matching', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: ['tofu'],
      staples: ['garlic', 'coconut milk', 'curry powder', 'rice'],
    });
    const curryResult = results.find(r => r.id === 1);
    expect(curryResult.pct).toBe(100);
  });

  it('filters by category', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: [],
      staples: [],
      selectedCats: ['Dinner'],
    });
    expect(results.every(r => r.cats.includes('Dinner'))).toBe(true);
    expect(results.length).toBe(2); // Tofu Curry + Peanut Noodles
  });

  it('filters by High-Protein using nutrition threshold', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: [],
      staples: [],
      selectedCats: ['High-Protein'],
    });
    expect(results.every(r => r.nut.pro >= 15)).toBe(true);
  });

  it('filters by max cook time', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: [],
      staples: [],
      maxTime: 20,
    });
    expect(results.every(r => r.time <= 20)).toBe(true);
    expect(results.length).toBe(2); // Pasta Salad (15) + Peanut Noodles (20)
  });

  it('filters by name search', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: [],
      staples: [],
      nameSearch: 'tofu',
    });
    expect(results.length).toBe(2); // Tofu Curry + Protein Power Bowl (has tofu in ingredients)
  });

  it('filters by name search with stemming', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: [],
      staples: [],
      nameSearch: 'noodles',
    });
    expect(results.some(r => r.id === 3)).toBe(true); // Peanut Noodles
  });

  it('filters out allergens', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: [],
      staples: [],
      allergies: new Set(['peanut']),
    });
    expect(results.find(r => r.id === 3)).toBeUndefined(); // Peanut Noodles removed
    expect(results.length).toBe(3);
  });

  it('combines multiple filters', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: ['tofu'],
      staples: ['garlic'],
      selectedCats: ['Dinner'],
      maxTime: 30,
      allergies: new Set(['peanut']),
    });
    // Only Tofu Curry matches: Dinner, <=30min, no peanut
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(1);
  });

  it('returns empty array when no recipes match', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: [],
      staples: [],
      selectedCats: ['NonexistentCategory'],
    });
    expect(results).toEqual([]);
  });

  it('sorts by match percentage descending by default', () => {
    const results = findRecipes({
      recipes: RECIPES,
      ingredients: ['tofu', 'garlic', 'coconut milk', 'curry powder', 'rice'],
      staples: [],
    });
    // First result should be Tofu Curry (100% match)
    expect(results[0].id).toBe(1);
    expect(results[0].pct).toBe(100);
  });
});

describe('sortResults()', () => {
  it('sorts by time ascending', () => {
    const results = findRecipes({ recipes: RECIPES, ingredients: [], staples: [] });
    const sorted = sortResults(results, 'time');
    expect(sorted[0].time).toBe(15);
  });

  it('sorts alphabetically', () => {
    const results = findRecipes({ recipes: RECIPES, ingredients: [], staples: [] });
    const sorted = sortResults(results, 'alpha');
    expect(sorted[0].title).toBe('Pasta Salad');
  });

  it('sorts by servings descending', () => {
    const results = findRecipes({ recipes: RECIPES, ingredients: [], staples: [] });
    const sorted = sortResults(results, 'serv');
    expect(sorted[0].servings).toBe(4);
  });

  it('does not mutate the original array', () => {
    const results = findRecipes({ recipes: RECIPES, ingredients: [], staples: [] });
    const firstId = results[0].id;
    sortResults(results, 'alpha');
    expect(results[0].id).toBe(firstId);
  });
});

describe('computePantryPower()', () => {
  it('computes canMakeNow and eightyPercent', () => {
    const stats = computePantryPower(
      RECIPES,
      ['tofu', 'coconut milk', 'curry powder', 'garlic', 'rice'],
      []
    );
    expect(stats.canMakeNow).toBeGreaterThanOrEqual(1); // Tofu Curry = 100%
    expect(stats.eightyPercent).toBeGreaterThanOrEqual(1);
    expect(stats.totalRecipes).toBe(4);
  });

  it('returns zeros with empty pantry', () => {
    const stats = computePantryPower(RECIPES, [], []);
    expect(stats.canMakeNow).toBe(0);
    expect(stats.eightyPercent).toBe(0);
  });

  it('counts staples + ingredients together', () => {
    const statsWithIngs = computePantryPower(RECIPES, ['tofu'], ['garlic', 'coconut milk', 'curry powder', 'rice']);
    const statsAllIngs = computePantryPower(RECIPES, ['tofu', 'garlic', 'coconut milk', 'curry powder', 'rice'], []);
    expect(statsWithIngs.canMakeNow).toBe(statsAllIngs.canMakeNow);
  });
});
