#!/usr/bin/env node
/**
 * Find the highest-impact missing staples for David's pantry — fast version.
 *
 * Strategy: run findRecipes ONCE with David's staples, then look at recipes
 * that are missing exactly 1 ingredient. The single missing ingredient IS
 * the bottleneck for that recipe. Count occurrences across all 1-missing
 * recipes — that's the impact of adding it. Then filter to items that
 * exist in the picker so adding them is realistic.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const { findRecipes, expandWithAliases } = await import(join(ROOT, 'src/services/matching.js'));
const recipes = JSON.parse(readFileSync(join(ROOT, 'src/data/recipes.json'), 'utf8'));

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

const onboardSrc = readFileSync(join(ROOT, 'src/components/Onboarding.js'), 'utf8');
const sectMatch = onboardSrc.match(/const STAPLE_SECTIONS = (\[[\s\S]*?\n\];)/);
const STAPLE_SECTIONS = eval(sectMatch[1].slice(0, -1));
const allPickerItems = STAPLE_SECTIONS.flatMap(s =>
  s.items.map(i => (typeof i === 'string' ? i : i.name))
);

const stapleSet = new Set(davidStaples.map(s => s.toLowerCase()));
const missing = allPickerItems.filter(item => !stapleSet.has(item.toLowerCase()));
console.log(`David's staples: ${davidStaples.length} / picker ${allPickerItems.length}`);
console.log(`Missing from David's pantry: ${missing.length}\n`);

// Run findRecipes once
const results = findRecipes({ recipes, ingredients: [], staples: davidStaples });
const at100 = results.filter(r => r.pct >= 100).length;
console.log(`Currently 100% match: ${at100} recipes\n`);

// Recipes missing exactly 1 ingredient — that ingredient is the bottleneck
const oneShort = results.filter(r => r.pct < 100 && r.need.length === 1);
const twoShort = results.filter(r => r.pct < 100 && r.need.length === 2);
console.log(`Recipes 1 ingredient short: ${oneShort.length}`);
console.log(`Recipes 2 ingredients short: ${twoShort.length}\n`);

// For each missing picker item, expand its aliases. Count how many 1-short
// recipes have their missing canonical satisfied by THIS item's expansion.
const impacts = new Map(); // pickerItem -> count

for (const item of missing) {
  const expanded = new Set(expandWithAliases([item]));
  let countOne = 0, countTwoBoth = 0;
  // 1-short: this item alone unlocks the recipe
  for (const r of oneShort) {
    const need = r.need[0]; // the one missing canonical (could be "salt+pepper" combined)
    // Match if any of the need's parts are covered by this item's expansion
    const needParts = need.split(' + ');
    if (needParts.every(p => expanded.has(p))) countOne++;
  }
  if (countOne > 0) impacts.set(item, { one: countOne });
}

const sorted = [...impacts.entries()]
  .map(([item, info]) => ({ item, ...info }))
  .sort((a, b) => b.one - a.one);

console.log('══ HIGHEST IMPACT (single-ingredient unlocks) ══');
console.log('');
console.log('Rank  Δ recipes   Item');
console.log('────  ─────────   ───────────────────');
for (let i = 0; i < Math.min(15, sorted.length); i++) {
  const r = sorted[i];
  console.log(`${String(i+1).padStart(4)}  +${String(r.one).padStart(7)}   ${r.item}`);
}
