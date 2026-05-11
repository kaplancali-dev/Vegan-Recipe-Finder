#!/usr/bin/env node
/**
 * Verify the new suggestions service returns correct results.
 *
 * Compares against the original missing-staples-impact.mjs output
 * (David's pantry: coconut milk +42, mushrooms +31, avocado +31).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const { computeIngredientSuggestions } = await import(join(ROOT, 'src/services/suggestions.js'));
const recipes = JSON.parse(readFileSync(join(ROOT, 'src/data/recipes.json'), 'utf8'));

// David's pantry — same as missing-staples-impact.mjs
const davidStaples = [
  'black beans','lentils','tofu','kidney beans','edamame','hemp seeds','tahini','flax seeds','chia seeds','pasta (any)','rice (any)',
  'oats','potatoes','sweet potatoes','garlic','olive oil','any cooking oil','soy sauce / tamari','sesame oil','vegetable broth','maple syrup',
  'tomato paste','nutritional yeast','apple cider vinegar','dijon mustard','rice vinegar','vegan mayo','miso paste','sea salt','black pepper',
  'garlic powder','smoked paprika','ginger','chili powder','cumin','cinnamon','onion powder','curry powder','oregano','turmeric',
  'cayenne','garam masala','red pepper flakes','nut butter (any)','walnuts','almonds','vanilla extract','cocoa powder','baking powder',
  'cornstarch','baking soda','vegan butter','chickpeas','navy beans','pinto beans','pumpkin seeds','protein powder','almond flour',
  'coconut flour','arrowroot powder','brazil nuts','coriander','cardamom','five spice','nutmeg','chocolate chips (any)','berries (any)',
  'crushed tomatoes','diced tomatoes','balsamic vinegar','italian seasoning','carrots','oat flour','corn','salt','pepper','soy sauce',
  'rice','lemon juice','paprika','chili flakes','thyme','broccoli','basil','olives','sriracha / hot sauce','chili oil','pomegranate',
  'allulose','stevia / monk fruit','GF bread','rice noodles','firm tofu','extra-firm tofu','mung beans','dates','lemon','soy milk',
  'white onion','yellow onion','white beans','black-eyed peas','silken tofu','soft tofu','tempeh','quinoa','corn tortillas','GF tortillas',
  'red onion','cabbage','tomatoes','avocado oil','toasted sesame oil','grapeseed oil','vegan yogurt','soy sauce / tamari / coconut aminos',
  'gluten-free flour','flaxseed meal','xanthan gum','capers','tomato sauce','canned tomatoes (any)','natural sweetener (any)','coconut sugar',
  'date sugar','dark chocolate','sage','cilantro','allspice','bay leaves','cannellini beans','GF pasta (any)','tamari / coconut aminos','salsa',
  'pumpkin pie spice','psyllium husk','aquafaba','matcha','green peas','white vinegar',
];

console.time('compute');
const { currentTotal, suggestions } = computeIngredientSuggestions({
  recipes,
  ingredients: [],
  staples: davidStaples,
  limit: 10,
});
console.timeEnd('compute');

console.log(`\nCurrent 100% match recipes: ${currentTotal}\n`);
console.log('Top 10 suggestions:\n');
console.log('Rank  +unlocks  newTotal  item');
console.log('────  ────────  ────────  ───────────────');
suggestions.forEach((s, i) => {
  console.log(
    `${String(i+1).padStart(4)}  +${String(s.unlocks).padStart(7)}  ${String(s.newTotal).padStart(8)}  ${s.item}`
  );
});

// Sanity-check expected results
const expected = { 'coconut milk': 42, 'mushrooms (any)': 31, 'avocado': 31 };
let ok = true;
for (const [item, count] of Object.entries(expected)) {
  const got = suggestions.find(s => s.item.toLowerCase() === item.toLowerCase());
  if (!got) {
    console.log(`\n  ⚠️  Expected ${item} (+${count}) not in top 10`);
    ok = false;
  } else if (got.unlocks !== count) {
    console.log(`\n  ⚠️  ${item}: expected +${count}, got +${got.unlocks}`);
    ok = false;
  }
}
console.log(ok ? '\n  ✓ Matches expected output from prior analysis' : '\n  ✗ MISMATCH — investigate');
