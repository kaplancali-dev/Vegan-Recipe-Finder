#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const matching = await import(join(ROOT, 'src/services/matching.js'));
const text = await import(join(ROOT, 'src/utils/text.js'));

// Use FULL pantry (read from Onboarding.js) — same as production
const onboardSrc = readFileSync(join(ROOT, 'src/components/Onboarding.js'), 'utf8');
const sectMatch = onboardSrc.match(/const STAPLE_SECTIONS = (\[[\s\S]*?\n\];)/);
const STAPLE_SECTIONS = eval(sectMatch[1].slice(0, -1));
const pantry = STAPLE_SECTIONS.flatMap(s => s.items.map(i => typeof i === 'string' ? i : i.name));
const expanded = matching.expandWithAliases(pantry);
console.log('Pantry has sea salt:', pantry.includes('sea salt'));
console.log('Pantry has black pepper:', pantry.includes('black pepper'));
console.log('Expanded includes "sea salt":', expanded.includes('sea salt'));
console.log('Expanded includes "black pepper":', expanded.includes('black pepper'));
console.log('Expanded includes "freshly ground black pepper":', expanded.includes('freshly ground black pepper'));

const expandedSet = new Set(expanded);

// The problem ingredient
const raw = '  Sea salt and freshly ground black pepper, to taste';
console.log('\nRAW ingredient:', JSON.stringify(raw));

const stripped = text.stripMeasure(raw);
console.log('After stripMeasure:', JSON.stringify(stripped));

// _stripUsageNotes is private — re-implement with same regex constants
const RE_FOOTNOTE = /[*†‡]+/g;
const RE_PARENS = /\s*\([^)]*\)/g;
const RE_BRACKETS = /\s*\[[^\]]*\]/g;
const RE_FOR_USAGE = /\s*[,\-]?\s*\bfor\s+(cooking|frying|sauté|sauteing|sautéing|greasing|brushing|drizzling|garnish|garnishing|serving|topping|finishing|dusting|sprinkling|coating|baking|roasting|the\s+top|extra)\b.*$/i;
const RE_TO_TASTE = /\s*[,\-]?\s*\bto\s+taste\b.*$/i;
const PREP = '(?:divided|melted|softened|room\\s+temperature|chilled|warmed|cooled|drained|rinsed|cubed|diced|chopped|sliced|minced|crushed|grated|shredded|peeled|seeded|deseeded|cooked|raw|toasted|rolled|frozen|thawed|optional|halved|quartered|pitted|stemmed|trimmed|cleaned|patted\\s+dry|squeezed|drained\\s+well|finely\\s+chopped|finely\\s+diced|thinly\\s+sliced|roughly\\s+chopped|coarsely\\s+chopped|cut\\s+into\\s+\\w+(?:\\s+\\w+)*)';
const RE_PREP_STATE = new RegExp(`\\s*,\\s*${PREP}(?:\\s*(?:,|and)\\s*${PREP})*\\b.*$`, 'i');

const usageStripped = stripped
  .replace(RE_FOOTNOTE, '')
  .replace(RE_PARENS, '')
  .replace(RE_BRACKETS, '')
  .replace(RE_FOR_USAGE, '')
  .replace(RE_TO_TASTE, '')
  .replace(RE_PREP_STATE, '')
  .trim();
console.log('After _stripUsageNotes:', JSON.stringify(usageStripped));

const cleaned = usageStripped
  .replace(/\s*\/\s*/g, ' or ')
  .replace(/\s*&\s*/g, ' and ')
  .replace(/\s*\+\s*/g, ' and ');
console.log('After connector swap:', JSON.stringify(cleaned));

const ri = text.norm(cleaned);
console.log('After norm:', JSON.stringify(ri));

const stems = matching.precomputeUserStems(expanded);
const direct = matching.ingredientMatches(ri, expanded, expandedSet, stems);
console.log('\nDirect ingredientMatches result:', direct);

// Try _splitCombined logic on RAW input (matches what findRecipes does)
function _splitCombined(rawIng) {
  let cleaned = rawIng.toLowerCase();
  cleaned = cleaned.replace(/\(.*?\)/g, '').replace(/[*†‡]+/g, '').trim();
  cleaned = cleaned.replace(/\bto\s+taste\b/g, '').replace(/\boptional\b/g, '').trim();
  cleaned = cleaned.replace(/^[\d½¼¾⅓⅔.,/\s-]+/, '').trim();
  cleaned = cleaned.replace(/^(?:tbsp|tsp|teaspoons?|tablespoons?|cups?|pinch(?:es)?|dash(?:es)?|splash(?:es)?|sprigs?|leaves?|cloves?|pieces?|grams?|g|ml|l|oz|lb|lbs|ounces?|pounds?)\.?\s+(?:of\s+)?/i, '').trim();
  cleaned = cleaned.replace(/^pinch\s+of\s+/i, '').replace(/^splash\s+of\s+/i, '');
  cleaned = cleaned.replace(/,\s*(?:and\s+)?/g, ' and ').trim();
  const parts = cleaned.split(/\s+(?:and|&|\+)\s+/i)
    .map(p => p.trim())
    .filter(Boolean);
  return parts;
}

const parts = _splitCombined(raw);
console.log('\n_splitCombined parts:', parts);

for (const p of parts) {
  const pNorm = text.norm(p);
  const m = matching.ingredientMatches(pNorm, expanded, expandedSet, stems);
  console.log(`  component "${p}" → norm "${pNorm}" → match=${m}`);
}
