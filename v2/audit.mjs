import { findRecipes, expandWithAliases } from './src/services/matching.js';
import { readFileSync } from 'fs';

const recipes = JSON.parse(readFileSync('src/data/recipes.json'));
const pantry = ['black beans','lentils','tofu','kidney beans','edamame','hemp seeds','tahini','flax seeds','chia seeds','pasta (any)','rice (any)','oats','potatoes','sweet potatoes','garlic','onions','olive oil','any cooking oil','soy sauce / tamari','sesame oil','vegetable broth','maple syrup','tomato paste','nutritional yeast','apple cider vinegar','dijon mustard','rice vinegar','vegan mayo','miso paste','sea salt','black pepper','garlic powder','smoked paprika','ginger','chili powder','cumin','cinnamon','onion powder','curry powder','oregano','turmeric','cayenne','garam masala','red pepper flakes','nut butter (any)','walnuts','almonds','vanilla extract','cocoa powder','baking powder','cornstarch','baking soda','vegan butter','chickpeas','navy beans','pinto beans','pumpkin seeds','protein powder','almond flour','coconut flour','arrowroot powder','brazil nuts','coriander','cardamom','five spice','nutmeg','chocolate chips (any)','apple','berries (any)','crushed tomatoes','diced tomatoes','balsamic vinegar','italian seasoning','carrots','oat flour','corn','salt','pepper','soy sauce','rice','lemon juice','paprika','chili flakes','thyme','broccoli','basil','olives','sriracha / hot sauce','cabbage','kale','chili oil','pomegranate','allulose','stevia / monk fruit','GF bread','rice noodles','firm tofu','extra-firm tofu','mung beans','dates','lemon'];

const results = findRecipes({recipes, staples: pantry});

const buckets = {100: 0, '90-99': 0, '80-89': 0, '70-79': 0, '60-69': 0, '50-59': 0, '<50': 0};
for (const r of results) {
  if (r.pct === 100) buckets['100']++;
  else if (r.pct >= 90) buckets['90-99']++;
  else if (r.pct >= 80) buckets['80-89']++;
  else if (r.pct >= 70) buckets['70-79']++;
  else if (r.pct >= 60) buckets['60-69']++;
  else if (r.pct >= 50) buckets['50-59']++;
  else buckets['<50']++;
}
console.log('Match distribution AFTER fixes:');
for (const [k, v] of Object.entries(buckets)) console.log(`  ${k}%: ${v}`);

const needCount = {};
for (const r of results) {
  for (const n of r.needNames) {
    const simple = n.toLowerCase().replace(/[^a-z\s]/g,' ').replace(/\s+/g,' ').trim().slice(0, 50);
    needCount[simple] = (needCount[simple] || 0) + 1;
  }
}
const topMissing = Object.entries(needCount).sort((a,b) => b[1]-a[1]).slice(0, 25);
console.log('\nTop "missing" ingredients (looking for things that should match):');
for (const [ing, count] of topMissing) console.log(`  [${count.toString().padStart(4)}]  ${ing}`);

// Verify lime juice fix
console.log('\n=== Lime juice fix verification ===');
const exp = expandWithAliases(['lemon']);
console.log('User has "lemon" → expanded includes "lime juice"?:', exp.includes('lime juice'));
console.log('User has "lemon" → expanded includes "fresh lime juice"?:', exp.includes('fresh lime juice'));
