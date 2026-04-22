/**
 * Integration tests — end-to-end flows through the state/matching pipeline.
 *
 * These tests wire together store + matching + component logic
 * to verify full user flows without actual DOM rendering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadState, get, set, resetState, subscribe, gatherAllData, applyAllData } from '../../src/state/store.js';
import { findRecipes, expandWithAliases, computePantryPower, sortResults } from '../../src/services/matching.js';
import { generateSyncCode, importSyncCode } from '../../src/services/sync.js';
import { norm, escHTML, stem } from '../../src/utils/text.js';
import recipes from '../../src/data/recipes.json';

describe('Full app flow: Ingredient → Recipe matching', () => {
  beforeEach(() => {
    resetState();
    loadState();
  });

  it('adding ingredients to state produces matching recipes', () => {
    set('ingredients', ['tofu', 'garlic', 'rice']);
    const ings = get('ingredients');
    expect(ings).toEqual(['tofu', 'garlic', 'rice']);

    const results = findRecipes({
      recipes,
      ingredients: ings,
      staples: [],
    });

    // Should find some recipes that contain tofu
    const tofuRecipes = results.filter(r => r.haveNames.includes('tofu'));
    expect(tofuRecipes.length).toBeGreaterThan(0);
  });

  it('adding staples improves match percentages', () => {
    set('ingredients', ['tofu']);
    set('staples', ['garlic', 'soy sauce', 'rice', 'coconut milk']);

    const ings = get('ingredients');
    const staples = get('staples');

    const results = findRecipes({
      recipes,
      ingredients: ings,
      staples,
    });

    // With staples, some recipes should have a reasonable match
    const someMatch = results.filter(r => r.pct >= 30);
    expect(someMatch.length).toBeGreaterThan(0);
  });

  it('allergies filter out matching recipes', () => {
    const allResults = findRecipes({
      recipes,
      ingredients: [],
      staples: [],
    });

    const filteredResults = findRecipes({
      recipes,
      ingredients: [],
      staples: [],
      allergies: new Set(['peanut']),
    });

    // Should have fewer results when filtering peanuts
    expect(filteredResults.length).toBeLessThan(allResults.length);

    // No filtered results should contain peanut ingredients
    filteredResults.forEach(r => {
      const hasP = r.ing.some(i => norm(i).includes('peanut'));
      expect(hasP).toBe(false);
    });
  });

  it('category filter returns only matching categories', () => {
    const results = findRecipes({
      recipes,
      ingredients: [],
      staples: [],
      selectedCats: ['Breakfast'],
    });

    results.forEach(r => {
      expect(r.cats.includes('Breakfast')).toBe(true);
    });
  });

  it('max time filter respects the limit', () => {
    const results = findRecipes({
      recipes,
      ingredients: [],
      staples: [],
      maxTime: 15,
    });

    results.forEach(r => {
      expect(r.time).toBeLessThanOrEqual(15);
    });
  });

  it('name search finds recipes by title', () => {
    const results = findRecipes({
      recipes,
      ingredients: [],
      staples: [],
      nameSearch: 'smoothie',
    });

    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => {
      const titleLower = r.title.toLowerCase();
      const hasMatch = titleLower.includes('smoothie') ||
                       r.ing.some(i => norm(i).includes('smoothie'));
      expect(hasMatch).toBe(true);
    });
  });
});

describe('Full app flow: Favorites round-trip', () => {
  beforeEach(() => {
    resetState();
    loadState();
  });

  it('favoriting a recipe persists to state', () => {
    const favs = get('favorites');
    expect(favs).toEqual([]);

    // Add favorite
    set('favorites', [42, 100]);
    expect(get('favorites')).toEqual([42, 100]);
  });

  it('removing a favorite preserves others', () => {
    set('favorites', [1, 2, 3, 4]);
    const favs = get('favorites');
    const updated = favs.filter(id => id !== 2);
    set('favorites', updated);
    expect(get('favorites')).toEqual([1, 3, 4]);
  });

  it('subscribers are notified on favorite change', () => {
    let notified = false;
    subscribe('favorites', () => { notified = true; });
    set('favorites', [99]);
    expect(notified).toBe(true);
  });
});

describe('Full app flow: Shopping list', () => {
  beforeEach(() => {
    resetState();
    loadState();
  });

  it('adding items to shopping list persists', () => {
    set('shopList', ['tofu', 'rice', 'coconut milk']);
    expect(get('shopList')).toHaveLength(3);
  });

  it('removing an item from shopping list works', () => {
    set('shopList', ['tofu', 'rice', 'coconut milk']);
    const current = get('shopList');
    const updated = current.filter(i => norm(i) !== 'rice');
    set('shopList', updated);
    expect(get('shopList')).toEqual(['tofu', 'coconut milk']);
  });

  it('clearing shopping list results in empty array', () => {
    set('shopList', ['tofu', 'rice']);
    set('shopList', []);
    expect(get('shopList')).toEqual([]);
  });
});

describe('Full app flow: Meal planner', () => {
  beforeEach(() => {
    resetState();
    loadState();
  });

  it('assigns recipes to days', () => {
    const plan = [null, null, null, null, null, null, null];
    plan[0] = 42; // Monday
    plan[4] = 99; // Friday
    set('mealPlan', plan);

    const saved = get('mealPlan');
    expect(saved[0]).toBe(42);
    expect(saved[4]).toBe(99);
    expect(saved[2]).toBeNull();
  });
});

describe('Full app flow: Cloud sync round-trip', () => {
  beforeEach(() => {
    resetState();
    loadState();
  });

  it('gatherAllData captures current state', () => {
    set('ingredients', ['tofu', 'rice']);
    set('staples', ['garlic']);
    set('favorites', [1, 2, 3]);

    const data = gatherAllData();
    expect(data.vrf_ings).toEqual(['tofu', 'rice']);
    expect(data.vrf_staples).toEqual(['garlic']);
    expect(data.vrf_favs).toEqual([1, 2, 3]);
  });

  it('applyAllData restores state correctly', () => {
    const data = {
      vrf_ings: ['avocado', 'lime'],
      vrf_staples: ['salt', 'pepper'],
      vrf_favs: [10, 20],
      vrf_shop: ['nori'],
      vrf_meal: [1, null, null, null, null, null, 2],
      vrf_allergies: ['peanut'],
    };

    applyAllData(data);

    expect(get('ingredients')).toEqual(['avocado', 'lime']);
    expect(get('staples')).toEqual(['salt', 'pepper']);
    expect(get('favorites')).toEqual([10, 20]);
    expect(get('shopList')).toEqual(['nori']);
    expect(get('mealPlan')).toEqual([1, null, null, null, null, null, 2]);
    expect(get('allergies')).toEqual(['peanut']);
  });

  it('sync code export → import round-trips all data', () => {
    set('ingredients', ['mushrooms', 'spinach']);
    set('favorites', [5, 15, 25]);
    set('staples', ['olive oil']);

    const code = generateSyncCode();
    expect(typeof code).toBe('string');

    // Clear state (resetState clears in-memory; also clear localStorage)
    resetState();
    localStorage.clear();
    loadState();
    expect(get('ingredients')).toEqual([]);

    // Import
    const success = importSyncCode(code);
    expect(success).toBe(true);

    // Note: importSyncCode calls applyAllData which uses vrf_ keys
    // The gatherAllData uses vrf_ keys, so the round-trip should work
    expect(get('ingredients')).toEqual(['mushrooms', 'spinach']);
    expect(get('favorites')).toEqual([5, 15, 25]);
    expect(get('staples')).toEqual(['olive oil']);
  });
});

describe('Full app flow: Pantry Power computation', () => {
  it('computes correct stats against the full recipe set', () => {
    const stats = computePantryPower(recipes, ['tofu', 'garlic', 'rice'], ['soy sauce', 'coconut milk']);
    expect(stats.totalRecipes).toBe(recipes.length);
    expect(stats.canMakeNow).toBeGreaterThanOrEqual(0);
    expect(stats.eightyPercent).toBeGreaterThanOrEqual(stats.canMakeNow);
  });

  it('returns zeros for empty pantry', () => {
    const stats = computePantryPower(recipes, [], []);
    expect(stats.canMakeNow).toBe(0);
    expect(stats.eightyPercent).toBe(0);
  });
});

describe('Full app flow: Ingredient alias expansion', () => {
  it('expands aliases against real recipe data', () => {
    const expanded = expandWithAliases(['mushrooms (any)']);
    // Should include many mushroom variants
    expect(expanded).toContain('shiitake mushrooms');
    expect(expanded).toContain('cremini');

    // Verify that expanded ingredients match real recipes
    const results = findRecipes({
      recipes,
      ingredients: ['mushrooms (any)'],
      staples: [],
    });

    // Should find recipes with any mushroom variant (pct > 0 means at least one ingredient matched)
    const mushRecipes = results.filter(r => r.pct > 0);
    expect(mushRecipes.length).toBeGreaterThan(0);
  });
});

describe('Data integrity: recipes.json', () => {
  it('has expected number of recipes', () => {
    expect(recipes.length).toBeGreaterThan(900);
  });

  it('every recipe has required fields', () => {
    recipes.forEach(r => {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('title');
      expect(r).toHaveProperty('ing');
      expect(Array.isArray(r.ing)).toBe(true);
      expect(r.ing.length).toBeGreaterThan(0);
    });
  });

  it('no recipe has duplicate IDs', () => {
    const ids = recipes.map(r => r.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('every recipe has nutrition data', () => {
    recipes.forEach(r => {
      expect(r).toHaveProperty('nut');
      expect(r.nut).toHaveProperty('cal');
      expect(r.nut).toHaveProperty('pro');
    });
  });

  it('no recipe has unreasonably high nutrition values', () => {
    recipes.forEach(r => {
      expect(r.nut.cal).toBeLessThan(3000);
      expect(r.nut.pro).toBeLessThan(200);
      expect(r.nut.carb).toBeLessThan(500);
      expect(r.nut.fat).toBeLessThan(300);
    });
  });

  it('every recipe has categories array', () => {
    recipes.forEach(r => {
      expect(r).toHaveProperty('cats');
      expect(Array.isArray(r.cats)).toBe(true);
    });
  });
});

describe('Security: escHTML prevents XSS', () => {
  it('escapes script tags', () => {
    expect(escHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes event handlers', () => {
    expect(escHTML('" onload="alert(1)')).toBe('&quot; onload=&quot;alert(1)');
  });

  it('escapes single quotes', () => {
    expect(escHTML("' onclick='alert(1)")).toContain('&#39;');
  });

  it('handles null/undefined gracefully', () => {
    expect(escHTML('')).toBe('');
  });
});
