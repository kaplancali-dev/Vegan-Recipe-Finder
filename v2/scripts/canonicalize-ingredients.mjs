#!/usr/bin/env node
/**
 * Canonicalize every recipe ingredient string into a clean, bare ingredient
 * name. Output: each recipe gets a parallel `iclean` array.
 *
 * PRINCIPLE: The canonicalizer COLLAPSES equivalents that don't matter to
 * a cook deciding "do I have this?" but PRESERVES distinctions that genuinely
 * change the recipe. The runtime alias-expander (in matching.js) handles
 * "user-pantry-has-X covers recipe-asks-for-Y" semantics — we don't replicate
 * that here.
 *
 *   COLLAPSE (handled by IDENTITY_REWRITES):
 *     sea salt / kosher salt / table salt        → salt
 *     black pepper / freshly ground pepper       → pepper
 *     red kidney beans / dark kidney beans       → kidney beans
 *     yellow/white/sweet/spanish onion           → onion
 *     ground cumin / cumin powder                → cumin
 *     1 lemon juiced / juice of lemon            → lemon juice
 *
 *   PRESERVE (canonicalizer leaves distinct):
 *     fresh tomatoes ≠ canned tomatoes ≠ cherry tomatoes
 *     red lentils ≠ green lentils ≠ brown lentils
 *     black beans ≠ kidney beans ≠ cannellini
 *     olive oil ≠ coconut oil ≠ sesame oil
 *
 * The canonicalizer DOES NOT use the runtime alias map as a canonicalization
 * source — that map's job is to expand a user pantry pick into all matchable
 * variants, not to collapse recipe ingredients.
 *
 * Usage:
 *   node scripts/canonicalize-ingredients.mjs              # write recipes-canonical.json
 *   node scripts/canonicalize-ingredients.mjs --apply      # overwrite recipes.json
 *   node scripts/canonicalize-ingredients.mjs --sample=N   # show N before/after pairs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const { norm, stripMeasure } = await import(join(ROOT, 'src/utils/text.js'));

const argv = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const APPLY = !!argv.apply;
const SAMPLE_N = argv.sample ? Number(argv.sample) : 25;

// ─── Detect "canned" intent BEFORE stripMeasure consumes the cue word ─────
// "1 14-oz can diced tomatoes" should stay distinct from "1 fresh tomato".
function detectCanned(rawIng) {
  const s = rawIng.toLowerCase();
  return /\b(?:can|cans|canned|tin|tins|tinned|jarred)\b/.test(s)
    || /\b\d+(?:\.\d+)?[\s-]*(?:oz|ounce)\b/.test(s)
    || /\b\d+(?:\.\d+)?[\s-]*g\s*tin/.test(s);
}

// ─── Pre-clean raw ingredient before stripMeasure handles it ──────────────
// Removes patterns that stripMeasure isn't designed to handle:
//   slashes (treat as alternatives, take first)
//   spelled-out numbers (Two cans, Three sprigs)
//   "such as X, Y, Z" lists (it's an example, not the ingredient)
//   "or X" alternatives at the end
//   "or more (to taste)" suffix
//   trailing exclamation/emphasis ("WELL!")
//   "X cans of", "X jars of" multipliers
function preClean(rawIng) {
  let s = rawIng.trim(); // strip leading/trailing whitespace so ^ anchors work

  // CELIAC SAFETY: when a recipe offers "wheat X or GF-grain X" as alternatives,
  // canonicalize to the GF option. Recipes like "whole wheat or brown rice penne"
  // must NOT canonicalize to "wheat ... penne" — that would suggest celiac users
  // can use wheat pasta. Detect "<wheat-word> or <gf-grain-word> X" patterns and
  // strip the wheat side, keeping just the GF side.
  // Examples handled:
  //   "whole wheat or brown rice penne pasta"  → "brown rice penne pasta"
  //   "wheat or rice noodles"                  → "rice noodles"
  //   "wheat or chickpea pasta"                → "chickpea pasta"
  //   "spelt or oat flour"                     → "oat flour"
  s = s.replace(/\b(?:whole\s+wheat|wheat|spelt|rye|barley)\s+or\s+(brown\s+rice|rice|chickpea|red\s+lentil|lentil|almond|oat|coconut|cassava|tapioca|buckwheat|quinoa)\b/gi, '$1');

  // Strip " or X" alternatives, with or without leading comma. Anything after
  // "or" + a quantity is almost always an alternative form/quantity:
  //   "...thawed, or one 14-oz can, drained"          (with comma)
  //   "...cooked black lentils or one 15-oz can..."   (no comma — same intent)
  let prevOr = '';
  while (s !== prevOr) {
    prevOr = s;
    s = s.replace(/\s*,?\s+or\s+(?:\d|½|¼|¾|⅓|⅔|one|two|three|four|five|a\b|an\b)[\s\S]*$/i, '');
  }
  // Strip emphatic ALL-CAPS or punctuation tails ("WELL!", "ENJOY!")
  s = s.replace(/\s+[A-Z]{2,}!*\s*$/, '');
  s = s.replace(/!+$/g, '');
  // CRITICAL: handle "and/or" BEFORE the generic slash-to-or rule, otherwise
  // "and/or" becomes "and or or" (bug: the slash rule fires on the / between
  // "d" and "o", inserting " or " in the middle).
  s = s.replace(/\band\s*\/\s*or\b/gi, 'or');
  // Replace remaining slashes between alpha words with " or " (numeric slashes intact)
  s = s.replace(/(?<=[a-z])\s*\/\s*(?=[a-z])/gi, ' or ');
  // Strip leading spelled-out small numbers
  s = s.replace(/^(?:one|two|three|four|five|six|seven|eight|nine|ten|a)\s+(?=\d|[a-z])/i, '');
  // "X cans/tins/jars/packages/blocks of " → strip
  s = s.replace(/^[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-–\s]*(?:cans?|tins?|jars?|packages?|packets?|pouches?|sachets?|sticks?|blocks?|bunches?|heads?|cloves?|sprigs?|sheets?|pieces?|slices?|stalks?|ears?|loaves?|bottles?|tubes?|bars?)\s+(?:of\s+)?/i, '');
  // Lone "of " left over after measurements stripped
  s = s.replace(/^of\s+/i, '');
  // "such as X, Y, Z" — recipe author's example list, not the ingredient
  s = s.replace(/\s+such\s+as\s+.*$/i, '');
  // "or more to taste" / "or more" / "or less" trailing
  s = s.replace(/\s+or\s+more(?:\s+to\s+taste)?\s*$/i, '');
  s = s.replace(/\s+or\s+less\s*$/i, '');
  // "(or X)" — alternative in parens, strip whole paren
  // (parens are stripped later by stripMeasure too, but explicit here)
  //
  // We INTENTIONALLY do NOT split "X or Y" into "X" — too risky
  // (turns "1/2 cup chopped red or green pepper" into "red"). The runtime
  // matcher's "or X" remainder logic handles this correctly anyway.
  return s.trim();
}

// ─── Post-strip cleanup of remnants ───────────────────────────────────────
// After stripMeasure + norm, certain stems still need handling.
function postClean(s) {
  if (!s) return s;
  // Leading "of " / "can " / "cans " / "tin " / "and " etc. that survived earlier stripping
  // (these often appear after parenthetical can-size annotations get stripped,
  // or after NOISE strips a leading prep word leaving "and X")
  s = s.replace(/^(?:of|and|or|plus|with|can|cans|tin|tins|jar|jars|package|packages|packet|packets|block|blocks|bunch|bunches|pack|packs)\s+(?:of\s+)?/i, '');
  // Leading "a NN unit" / "a NN-oz can" leftover from incomplete strip
  // ("a 15 oz can no salt added pinto beans" → "no salt added pinto beans")
  s = s.replace(/^a\s+\d+(?:[.,]\d+)?\s*(?:oz|ounce|ounces|g|grams|gram|ml|l|lb|lbs|pound|pounds|cup|cups)\s+(?:cans?|tins?|jars?|packages?|packets?|blocks?)?\s*/i, '');
  s = s.replace(/^\d+(?:[.,]\d+)?\s*(?:oz|ounce|ounces|g|grams|gram|ml|l|lb|lbs|pound|pounds)\s+/i, '');
  // "no salt added" / "no sugar added" anywhere in the string
  s = s.replace(/\bno\s+(?:salt|sugar|oil|sodium|fat)\s+added\s+/gi, '');
  // "no salt added" / "no sugar added" / "no oil added" descriptors
  s = s.replace(/^no\s+(?:salt|sugar|oil|sodium|fat)\s+added\s+/i, '');
  // Trailing "undrained" / "drained" / "rinsed" leftover
  s = s.replace(/\s+(?:undrained|drained|rinsed)$/i, '');
  // "fire roasted/oven roasted/pan roasted X" → "X" (the cooking method
  // doesn't change the ingredient identity)
  s = s.replace(/^(?:fire|oven|pan|dry|sun)\s+(?:roasted\s+|baked\s+)?/i, '');
  // Bare "fire" / "oven" left as prefix (e.g., "fire tomatoes" → "tomatoes")
  s = s.replace(/^(?:fire|oven|pan|dry)\s+(?=\w)/i, '');
  // Descriptors that don't add identity for matching purposes
  // Strip leading descriptor adjectives — descriptors don't add identity
  // (we apply iteratively because some lines stack: "unsweetened unflavored plant milk")
  let prevDesc = '';
  while (s !== prevDesc) {
    prevDesc = s;
    s = s.replace(/^(?:low\s+sodium|low\s+fat|reduced\s+sodium|reduced\s+fat|no\s+salt\s+added|no\s+sugar\s+added|unsweetened|unsalted|salted|sweetened|unflavored|unflavoured|flavored|flavoured|extra\s+virgin|cold[\s-]*pressed|virgin|refined|unrefined|raw|whole\s+grain|whole\s+wheat|whole|young|baby|fresh|frozen|dried|dry|plain|original|natural|organic|active|instant|cracked|ground|slivered|julienned|shaved|smashed|scrubbed|hulled|toasted|roasted|mixed|grain|multi\s*grain|multigrain|stone\s*ground|seeded|crusty|hearty|artisan)\s+/i, '');
  }
  // Trailing form-words ("tomato slices" → "tomato")
  s = s.replace(/\s+(?:slices?|chunks?|pieces?|bites?|matchsticks?|wedges?|halves?|quarters?|cubes?|sticks?|rings?|rounds?|strips?|fillets?|dollops?|spoonfuls?|spears?)$/i, '');
  // Trailing "for X" usage notes (greasing, cooking, brushing, dusting, the topping, etc.)
  s = s.replace(/\s+for\s+(?:greasing|brushing|cooking|frying|sauteing|sautéing|baking|roasting|serving|garnish|garnishing|topping|drizzling|dipping|coating|dusting|sprinkling|the\s+\w+(?:\s+\w+)?|extra)\s*$/i, '');
  // Trailing "well" / "small" leftover descriptor
  s = s.replace(/\s+(?:well|small|extra)$/i, '');
  // "X mixed" / "X mixed with Y" → "X"
  s = s.replace(/\s+mixed(?:\s+with\s+.*)?$/i, '');
  // "cut into X-inch dice" / "cut to X" / "diced into X" trailing prep
  s = s.replace(/\s+(?:cut\s+(?:in|into|to)\s+.*|diced\s+(?:in|into|to)\s+.*|sliced\s+(?:in|into|to)\s+.*|chopped\s+(?:in|into|to)\s+.*)$/i, '');
  // Bare "cut", "diced", "sliced", "chopped" trailing
  s = s.replace(/\s+(?:cut|diced|sliced|chopped|minced|grated|peeled|halved|quartered|cubed|crushed|mashed|trimmed|smashed|scrubbed)$/i, '');
  // Trailing "or" / "or to taste" / lone "or" leftovers
  s = s.replace(/\s+or(?:\s+to\s+taste)?\s*$/i, '');
  s = s.replace(/\s+and\s*$/i, '');
  // "and X" leading or trailing
  s = s.replace(/^and\s+/i, '');
  // "in a/the (dry) skillet/pan/pot ..." prep descriptions
  s = s.replace(/\s+in\s+(?:a|the)\s+(?:\w+\s+)?(?:skillet|pan|pot|bowl|oven|microwave|food\s+processor|blender)(?:\s+.*)?$/i, '');
  // Trailing "and X" where X is a single prep verb
  s = s.replace(/\s+and\s+(?:ground|chopped|diced|sliced|minced|crushed|grated|toasted|roasted|cooked|warmed|cooled|melted|softened|cubed|quartered|halved|squeezed|drained|rinsed|patted\s+dry)$/i, '');
  // "kernels removed" / "stems removed" trailing
  s = s.replace(/\s+(?:kernels?|stems?|leaves?|husks?)\s+removed$/i, '');
  // "in water/brine/oil" trailing — preservation medium, not identity
  s = s.replace(/\s+in\s+(?:water|brine|oil|salt\s+water|its\s+(?:own\s+)?(?:juice|liquid))$/i, '');
  // Trailing orphan paren ")" with no matching "(" left
  if (s.endsWith(')') && !s.includes('(')) s = s.replace(/\s*\)\s*$/, '');
  // Collapse spaces
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// ─── Identity rewrites: equivalences that don't change "do I have it?" ────
// Order matters — first match wins.
const IDENTITY_REWRITES = [
  // ── SALT — every form is salt ──
  [/^(?:fine\s+)?(?:sea|kosher|table|coarse|flaky|fine|himalayan|pink|rock|maldon|grey|smoked|extra\s+fine)\s+salt$/, 'salt'],
  [/^salt\s+to\s+taste$/, 'salt'],
  [/^pinch\s+of\s+salt$/, 'salt'],
  // ── PEPPER (default = black, ground, cracked, etc.) ──
  // White pepper preserved as a distinct ingredient.
  // Multi-modifier pattern: "(cracked|ground|...) (black) pepper" → "pepper"
  [/^(?:freshly\s+|fresh\s+|coarsely\s+|finely\s+)?(?:cracked|ground)(?:\s+black)?\s+pepper$/, 'pepper'],
  [/^black\s+(?:cracked|ground|crushed|coarse|fine)?\s*pepper$/, 'pepper'],
  [/^(?:cracked|ground|crushed|fresh|freshly\s+ground|freshly\s+cracked|fresh\s+ground|fresh\s+cracked|coarsely\s+cracked|finely\s+ground)\s+pepper$/, 'pepper'],
  [/^(?:black|ground|fresh|whole)\s+peppercorns?$/, 'pepper'],
  [/^peppercorns?$/, 'pepper'],
  [/^pepper\s+to\s+taste$/, 'pepper'],
  // ── KIDNEY BEANS (red is the default — color doesn't add identity) ──
  [/^(?:red|dark\s+red|light\s+red|dark|light)\s+kidney\s+beans?$/, 'kidney beans'],
  // ── BELL PEPPERS — color doesn't add identity (red/yellow/green/orange all = bell peppers) ──
  [/^(?:red|yellow|green|orange|purple)\s+(?:bell\s+)?peppers?$/, 'bell peppers'],
  [/^bell\s+peppers?$/, 'bell peppers'],
  // ── GUACAMOLE — at its core, avocado. If user has avocado, count as match ──
  [/^(?:homemade\s+|store[\s-]*bought\s+|prepared\s+)?guacamole$/, 'avocado'],
  // ── POTATOES — type doesn't matter for matching purposes ──
  // Russet/yukon/red/baby/fingerling/new/yellow/white potatoes all become "potatoes".
  // (Sweet potatoes stay distinct — different vegetable entirely.)
  [/^(?:russet|yukon\s+gold|yukon|idaho|red|baby|fingerling|new|yellow|white|waxy|floury|starchy|small|medium|large)\s+potatoes?$/, 'potatoes'],
  [/^potato$/, 'potatoes'],
  // ── COOKED-prefix beans/grains — "cooked black beans" is just "black beans" ──
  // The user has the bean; cooking is a step, not an identity change.
  [/^cooked\s+(black\s+beans?|kidney\s+beans?|pinto\s+beans?|navy\s+beans?|cannellini\s+beans?|great\s+northern\s+beans?|red\s+beans?|white\s+beans?|chickpeas|garbanzos|garbanzo\s+beans?|lentils|red\s+lentils|green\s+lentils|brown\s+lentils|french\s+lentils|farro|quinoa|brown\s+rice|white\s+rice|rice|pasta|noodles)$/, '$1'],
  // ── ONION default — yellow/white/sweet/spanish/vidalia are interchangeable ──
  // Red onion stays distinct (sharper, often raw).
  [/^(?:yellow|white|sweet|spanish|vidalia|cooking|brown)\s+onions?$/, 'onion'],
  [/^onions?$/, 'onion'],
  // ── GARLIC — clove count doesn't matter ──
  [/^garlic\s+cloves?$/, 'garlic'],
  [/^cloves?\s+(?:of\s+)?garlic$/, 'garlic'],
  // ── GROUND SPICES — ground X / X powder = X for spices that are usually ground ──
  [/^ground\s+(cumin|coriander|turmeric|cinnamon|ginger|cardamom|cloves?|nutmeg|allspice|cayenne|mustard|fennel)$/, '$1'],
  [/^(cumin|coriander|turmeric|cinnamon|cardamom|cloves?|nutmeg|allspice|cayenne|mustard|fennel)\s+powder$/, '$1'],
  // Specifically NOT collapsing: ginger powder ≠ fresh ginger; mustard powder is usually ok
  // ── PAPRIKA — sweet/hot variants → smoked paprika (the default vegan flavor) ──
  // Actually keep paprika distinct from smoked paprika since smoked is more flavorful
  [/^(?:sweet|hungarian|hot|spanish|smoked\s+sweet)\s+paprika(?:\s+powder)?$/, 'paprika'],
  // ── CITRUS JUICE — "juice of N lemon" / "freshly squeezed lemon juice" ──
  [/^(?:fresh(?:ly)?\s+squeezed\s+|fresh\s+)?(lemon|lime|orange)\s+juice$/, '$1 juice'],
  [/^juice\s+of\s+(?:a\s+|an\s+|half\s+a\s+|\d+\s+)?(lemon|lime|orange)s?$/, '$1 juice'],
  [/^juiced\s+(lemon|lime|orange)$/, '$1 juice'],
  // ── HERBS — "fresh basil" = "basil"; "dried basil" = "basil" (cook decides) ──
  [/^(?:fresh|dried)\s+(basil|cilantro|parsley|mint|dill|thyme|rosemary|oregano|sage|chives|tarragon|chervil|bay\s+leaves?)$/, '$1'],
  // ── FLOUR — keep type-specific flours distinct (almond, coconut, oat, etc.) ──
  [/^all[\s-]*purpose\s+flour$/, 'gluten-free flour'],
  [/^plain\s+flour$/, 'gluten-free flour'],
  [/^white\s+flour$/, 'gluten-free flour'],
  [/^wheat\s+flour$/, 'gluten-free flour'],
  // ── SUGAR — generic "sugar" is "cane sugar"; brown/coconut/date stay distinct ──
  [/^(?:granulated|white|raw|organic\s+cane|cane)\s+sugar$/, 'sugar'],
  [/^sugar$/, 'sugar'],
  // ── RICE color forms — keep brown rice and white rice distinct, but "long grain" etc. fold ──
  [/^long[\s-]*grain\s+(?:white\s+)?rice$/, 'white rice'],
  [/^short[\s-]*grain\s+(?:white\s+)?rice$/, 'white rice'],
  [/^(?:short|long)[\s-]*grain\s+brown\s+rice$/, 'brown rice'],
  [/^white\s+rice$/, 'white rice'],
  // ── BREAD — variants without GF specification are wheat. We pass through; the
  //    HARD_GLUTEN filter already removed the un-GF-able structural breads.
  // ── TOFU — firmness varies but firm/extra-firm are interchangeable ──
  [/^(?:high[\s-]*protein|super[\s-]*firm|extra[\s-]*firm|extra\s+firm)\s+tofu$/, 'firm tofu'],
  // ── CITRUS ZEST → keep distinct from juice ──
  // (no rewrite — preserve as-is)
  // ── VANILLA — "vanilla" used alone almost always means vanilla extract ──
  [/^vanilla$/, 'vanilla extract'],
  [/^pure\s+vanilla\s+extract$/, 'vanilla extract'],
  // ── COCOA / CACAO — interchangeable in 99% of recipes ──
  [/^(?:raw\s+)?cacao\s+powder$/, 'cocoa powder'],
  [/^unsweetened\s+cocoa\s+powder$/, 'cocoa powder'],
  // ── CINNAMON — stick vs ground form are equivalent for most uses ──
  [/^cinnamon\s+sticks?$/, 'cinnamon'],
  // ── BAY — bay leaf vs leaves singular/plural ──
  [/^bay\s+leaf$/, 'bay leaves'],
  // ── CHILI / CHILLI spelling unify ──
  [/^chilli(\s+\w+)?$/, 'chili$1'],
  [/^chilli$/, 'chili'],
  // ── BRITISH ↔ US produce names ──
  [/^aubergines?$/, 'eggplant'],
  [/^courgettes?$/, 'zucchini'],
  [/^rocket$/, 'arugula'],
  [/^beetroots?$/, 'beets'],
  [/^spring\s+onions?$/, 'green onions'],
  [/^scallions?$/, 'green onions'],
  // ── MUSHROOMS — most recipe types are interchangeable in most uses ──
  // (cremini / baby bella / button → mushrooms, but shiitake/oyster stay distinct)
  [/^(?:cremini|crimini|baby\s+bella|baby\s+portabella|portabella|portobello|portabellos?|portobellos?|button|white|brown)\s+mushrooms?$/, 'mushrooms'],
  // ── BOK CHOY — baby bok choy is baby — used same way ──
  [/^baby\s+bok\s+choy$/, 'bok choy'],
  // ── BERRIES — strawberries/blueberries/raspberries stay distinct as recipes
  //    typically specify, but generic "mixed berries" or "fresh berries" fold ──
  [/^(?:fresh|frozen|mixed)\s+berries$/, 'berries'],
  // ── CHICKPEAS — "garbanzo beans" same thing, also "garbanzos" ──
  [/^garbanzo\s+beans?$/, 'chickpeas'],
  [/^garbanzos$/, 'chickpeas'],
  // ── FROZEN/FRESH PEAS — same product for cooking purposes ──
  [/^(?:frozen|fresh|english|garden|sweet|shelled)\s+(?:green\s+)?peas$/, 'green peas'],
  [/^green\s+peas$/, 'green peas'],
  [/^peas$/, 'green peas'],
  // ── BREAD CRUMBS / BREADCRUMBS / PANKO — same ingredient family ──
  [/^bread\s+crumbs$/, 'breadcrumbs'],
  [/^panko\s+breadcrumbs$/, 'panko'],
];

function applyIdentityRewrites(s) {
  for (const [pat, replacement] of IDENTITY_REWRITES) {
    if (pat.test(s)) {
      const out = s.replace(pat, replacement).trim();
      if (out !== s) return out;
    }
  }
  return s;
}

// ─── Combined-ingredient splitter (for "salt and pepper" → ["salt","pepper"]) ─
function splitCombined(rawIng) {
  let s = rawIng.toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[*†‡]/g, ' ')
    .replace(/\bto\s+taste\b/gi, ' ')
    .replace(/\boptional\b/gi, ' ');
  // Strip leading quantity/units BEFORE splitting on connectors
  s = s.replace(/^[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-–~≈+×x\s]+/, '').trim();
  s = s.replace(/^(?:tbsp|tsp|teaspoons?|tablespoons?|cups?|pinch(?:es)?|dash(?:es)?|splash(?:es)?|sprigs?|leaves?|cloves?|pieces?|cans?|tins?|grams?|g|ml|l|oz|lb|lbs|ounces?|pounds?)\.?\s+(?:of\s+)?/i, '').trim();
  // Strip ", or X" alternative quantities ("cooked black beans, or 1 can, drained")
  // Anything after ", or" is almost always an alternative form/quantity.
  let prevOr = '';
  while (s !== prevOr) { prevOr = s; s = s.replace(/\s*,\s*or\s+.+$/i, ''); }
  // CRITICAL: strip trailing comma-prep BEFORE comma normalization, so
  // "salt, adjust to taste" doesn't become ["salt", "adjust to taste"]
  // (we want it to stay as bare "salt" → no split → fall through to single).
  const PREP_AFTER_COMMA = /\s*,\s*(?:to\s+taste|adjust(?:\s+to\s+taste)?|or\s+to\s+taste|or\s+more(?:\s+to\s+taste)?|or\s+less|or\s+as\s+needed|as\s+needed|if\s+needed|if\s+desired|optional|drained|rinsed|drained\s+and\s+rinsed|rinsed\s+and\s+drained|drained\s+well|drained\s+very\s+well|chopped|diced|sliced|minced|crushed|grated|shredded|peeled|seeded|softened|melted|warm|cold|undrained|toasted|roasted|cooked|warmed|cooled|squeezed|patted\s+dry|halved|quartered|cubed|divided|sifted|smashed|scrubbed|slivered|julienned|shaved|ribboned|cubed|trimmed|stemmed|cleaned|hulled|deveined|skin\s+on|peel\s+on|ends?\s+trimmed|ends?\s+removed|tops?\s+removed|tops?\s+trimmed|thawed(?:\s+and\s+\w+)?|soaked[\s\S]*|chopped\s+into\s+\w+(?:\s+\w+)*|sliced\s+into\s+\w+(?:\s+\w+)*|any\s+color|any\s+colour|leaves\s+chopped\s+finely|leaves\s+chopped|leaves\s+picked|seeds?\s+scraped|seeds?\s+removed|in\s+water|in\s+brine|in\s+salt\s+water|in\s+oil|packed\s+in\s+water|plus\s+more[\s\S]*|cut\s+into\s+\w+(?:\s+\w+)*|finely\s+\w+(?:\s+\w+)?|roughly\s+\w+(?:\s+\w+)?|thinly\s+\w+(?:\s+\w+)?|thickly\s+\w+(?:\s+\w+)?|coarsely\s+\w+(?:\s+\w+)?|very\s+\w+(?:\s+\w+)*|for\s+\w+(?:\s+\w+)?|to\s+(?:serve|garnish|drizzle|sprinkle|finish|top|coat|brush|grease|fry|cook|sauté|sautee|sprinkle\s+on\s+top)|in\s+(?:a\s+)?(?:dry\s+)?(?:skillet|pan|pot)\s+(?:and\s+\w+)?|kernels?\s+removed|stems?\s+removed|leaves?\s+only|leaves?\s+picked|stem\s+ends?\s+(?:removed|trimmed)|root\s+ends?\s+(?:removed|trimmed)|husks?\s+(?:and\s+silks?\s+)?removed|white\s+and\s+green\s+parts?|green\s+parts?\s+only|white\s+parts?\s+only|woody\s+ends?\s+removed|tough\s+(?:stems?|outer\s+leaves?)\s+removed|outer\s+leaves?\s+removed|plus\s+\w+).*$/i;
  let prevPrep = '';
  while (s !== prevPrep) { prevPrep = s; s = s.replace(PREP_AFTER_COMMA, ''); }
  // Normalize remaining commas (e.g., "salt, pepper, and onion powder")
  let normalizedConnectors = s.replace(/,\s*(?:and\s+)?/g, ' and ').trim();
  normalizedConnectors = normalizedConnectors.replace(/\s+(?:and|&|\+)\s*$/i, '').trim();
  const parts = normalizedConnectors.split(/\s+(?:and|&|\+)\s+/i)
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  // Sanity: skip if any "component" is too long or is a prep word/phrase
  const PREP_WORDS = new Set([
    'drained','rinsed','chopped','diced','sliced','slivered','minced','crushed','grated',
    'shredded','peeled','seeded','cooked','warmed','cooled','melted','softened',
    'cubed','quartered','halved','divided','rolled','beaten','whipped','sifted',
    'roasted','toasted','julienned','shaved','ribboned','well','smashed','scrubbed',
  ]);
  // Reject splits where the first component is a bare descriptor adjective
  // ("unsweetened", "unflavored", "low sodium") — these belong with the
  // following ingredient, not as a separate ingredient.
  const DESCRIPTOR_ADJ = new Set([
    'unsweetened','sweetened','unflavored','unflavoured','flavored','flavoured',
    'unsalted','salted','low sodium','low fat','reduced sodium','reduced fat',
    'no salt added','no sugar added','organic','natural','plain','original',
    'extra virgin','virgin','refined','unrefined','raw','dry','fresh','frozen',
    'thawed','warm','cold','hot','smoked','roasted','toasted','dried',
  ]);
  if (parts[0] && DESCRIPTOR_ADJ.has(parts[0])) return null;
  // Phrase-level prep detection: if any "component" starts with a prep verb,
  // it's a prep description not an ingredient ("cut into ¼-inch dice",
  // "halved and quartered", "stems removed", "drained well").
  const PREP_PHRASE_PREFIX = /^(?:cut\b|peeled\b|halved\b|seeded\b|chopped\b|diced\b|sliced\b|minced\b|crushed\b|grated\b|stems?\b|leaves?\s+only|finely\b|roughly\b|coarsely\b|thinly\b|thickly\b|squeezed\b|drained\b|rinsed\b|warmed\b|cooled\b|melted\b|softened\b|cubed\b|quartered\b|divided\b|rolled\b|beaten\b|whipped\b|sifted\b|roasted\b|toasted\b|patted\b|cleaned\b|trimmed\b|stemmed\b|woody\b|tough\b|outer\b|stem\s+ends?\b|root\s+ends?\b)/i;
  if (parts.some(p => p.split(/\s+/).length > 4)) return null;
  if (parts.some(p => PREP_WORDS.has(p))) return null;
  if (parts.some(p => PREP_PHRASE_PREFIX.test(p))) return null;
  return parts;
}

// ─── Per-ingredient canonicalization ──────────────────────────────────────
// Standalone descriptors / non-ingredient strings — drop them
const NON_INGREDIENT_RESULTS = new Set([
  'unsweetened','sweetened','unflavored','unflavoured','flavored','flavoured',
  'unsalted','salted','fresh','frozen','thawed','dried','dry','organic','natural',
  'plain','original','raw','whole','baby','young','extra virgin','virgin',
  'cold pressed','low sodium','low fat','reduced sodium','reduced fat',
  'no salt added','no sugar added','optional','divided','to taste','adjust',
  'or','and','plus','more','less','about','approximately','garnish','topping',
  'toppings','serving','servings','seasoning','well','small','medium','large','extra','soaked','squeezed',
  'finely','roughly','coarsely','thinly','thickly','any color','any','color',
  'leaves only','stems removed','etc','as needed','as desired','if using',
  // Generic placeholders that signal "use any/whatever you have on hand" —
  // these aren't strict requirements, they're suggestions. Treat as
  // unrequired (drop from match count).
  'herbs','herb','fresh herbs','herb sprigs','fresh herb sprigs','mixed herbs',
  'spices','spice','spice blend','seasonings','dried spices',
  'nuts','nuts and seeds','seeds','dried fruit','dried fruits','toppings of choice',
  'vegetables','veggies','greens','grains','protein','starch',
  'sugar substitute','sweetener of choice','milk of choice','flour of choice',
]);

function canonicalizeOne(rawIng, isCanned) {
  if (!rawIng || !rawIng.trim()) return '';
  // Drop cross-recipe references entirely. Patterns:
  //   "1 recipe Homemade Pizza Dough"
  //   "One recipe No-Cheese Sauce Recipe"
  //   "1 batch Vegan Caesar Dressing"
  //   "see X recipe" / "homemade X recipe"
  const trimmed = rawIng.trim();
  if (/^(?:[\d½¼¾⅓⅔.,/\s-]*|one|two|three|a|an)\s*(?:recipe|batch|portion|serving)\s+\w+/i.test(trimmed)) return '';
  if (/\brecipe\s*$/i.test(trimmed) && /[A-Z]/.test(trimmed)) return ''; // "X Recipe" capitalized
  // Drop "for garnish" / "for topping" / "for serving" ingredients entirely —
  // these are decoration, not requirements ("Chopped peanuts and cilantro for garnish").
  if (/\bfor\s+(?:garnish|garnishing|topping|toppings|serving|sprinkling|drizzling|finishing)\b/i.test(trimmed)) return '';
  // Drop in-house sub-recipe references — Title-Cased phrases ending in
  // sauce/dressing/dough/cheese/glaze/marinade are nearly always sub-recipes
  // ("Vegan Potato Cheese Sauce", "Cashew Caesar Dressing"). The user can
  // make or substitute these; the recipe shouldn't penalize for not having
  // a pre-made one in pantry.
  const cleanedForCaps = trimmed
    .replace(/^[\d½¼¾⅓⅔.,/\s-]*(?:cup|cups|tbsp|tsp|teaspoons?|tablespoons?|oz|ml|g|kg)\.?\s+(?:of\s+)?/i, '')
    .replace(/[“”‘’"']/g, '');  // strip quote chars so "Vegan Potato "Cheese" Sauce" still matches
  // Sub-recipe detection: require ACTUAL capital letters (no /i flag).
  // Pattern: 2+ Title-Cased words ending with sauce/dressing/etc.
  // Without the cap requirement this wrongly matched normal lowercase
  // ingredients like "white wine or low-sodium vegetable broth".
  if (/^(?:[A-Z][\w-]*\s+){2,}(?:Sauce|Dressing|Dough|Cream|Cheese|Glaze|Marinade|Pesto|Aioli|Chutney|Relish|Salsa|Spread|Dip|Hummus|Paste|Reduction|Jam|Jelly|Drizzle|Topping|Frosting|Filling|Crust|Crumble|Streusel|Batter|Puree|Purée|Bisque|Broth|Stock)$/.test(cleanedForCaps)) return '';
  // Pre-clean (handles slashes, spelled-out numbers, "such as", "or X" alternatives)
  let pre = preClean(rawIng);
  let s = stripMeasure(pre);
  s = norm(s);
  if (!s) return '';
  s = postClean(s);
  if (!s) return '';
  // Drop if result is just a descriptor word
  if (NON_INGREDIENT_RESULTS.has(s)) return '';
  // Apply identity rewrites
  s = applyIdentityRewrites(s);
  // Final descriptor check post-rewrites
  if (NON_INGREDIENT_RESULTS.has(s)) return '';
  // Canned-detection fold
  if (isCanned) {
    if (s === 'tomatoes' || s === 'tomato' || s === 'fresh tomatoes' || s === 'crushed tomatoes' || s === 'whole tomatoes') s = 'canned tomatoes';
    if (s === 'chickpeas' || s === 'garbanzo beans') s = 'canned chickpeas';
    if (s === 'beans') s = 'canned beans';
  }
  return s;
}

function canonicalizeIngredient(rawIng) {
  const isCanned = detectCanned(rawIng);
  // Run preClean BEFORE splitCombined so:
  //   - "such as X, Y, Z" gets stripped before comma-splitting
  //   - "wheat or rice X" gets reduced to "rice X" before any split
  //   - "and/or" gets normalized to "or" (preClean handles this)
  const preCleaned = preClean(rawIng);
  // Combined ingredients become individual canonical entries
  const split = splitCombined(preCleaned);
  if (split) {
    const cleaned = split.map(p => canonicalizeOne(p, false)).filter(Boolean);
    return [...new Set(cleaned)];
  }
  const single = canonicalizeOne(rawIng, isCanned);
  return single ? [single] : [];
}

// ─── Process all recipes ──────────────────────────────────────────────────
const recipesPath = join(ROOT, 'src/data/recipes.json');
const recipes = JSON.parse(readFileSync(recipesPath, 'utf8'));

let totalIngs = 0, droppedIngs = 0;
const sampleRows = [];
const targetIds = new Set([6368, 6875, 4521, 5896, 6543, 6415, 7477, 2018, 213, 8338, 4399, 4496, 4987, 6535, 7634, 7382, 7753, 7272]);

for (const recipe of recipes) {
  // iclean is an array of arrays, one per ing[i]:
  //   normal ingredient        → iclean[i] = ["onion"]
  //   combined ("salt + pepper") → iclean[i] = ["salt", "pepper"]
  //   dropped (section header)  → iclean[i] = []
  // Lockstep with ing[i] — i.e. iclean.length === ing.length.
  recipe.iclean = (recipe.ing || []).map(rawIng => {
    totalIngs++;
    const canonicalized = canonicalizeIngredient(rawIng);
    if (canonicalized.length === 0) droppedIngs++;
    return canonicalized;
  });
  // Collect sample rows (use the lockstep iclean directly)
  if ((targetIds.has(recipe.id) || sampleRows.length < SAMPLE_N) && recipe.ing && recipe.ing.length >= 5) {
    sampleRows.push({
      id: recipe.id,
      title: recipe.title,
      pairs: recipe.ing.map((raw, i) => ({
        raw: raw.trim(),
        clean: (recipe.iclean[i] || []).join(' + ') || '<dropped>',
      })),
    });
  }
}

// ─── Print sample ─────────────────────────────────────────────────────────
console.log(`\nProcessed ${recipes.length} recipes, ${totalIngs} ingredient lines`);
console.log(`Dropped ${droppedIngs} (empty / section header lines)`);
console.log(`\nSample (${sampleRows.length} recipes; targeted IDs first):\n`);

// Sort: targeted IDs first
sampleRows.sort((a, b) => (targetIds.has(a.id) ? 0 : 1) - (targetIds.has(b.id) ? 0 : 1));

for (const s of sampleRows.slice(0, SAMPLE_N)) {
  console.log(`──── ${s.id}: ${s.title} ────`);
  for (const { raw, clean } of s.pairs) {
    const truncRaw = raw.length > 60 ? raw.slice(0, 57) + '…' : raw;
    console.log(`  ${truncRaw.padEnd(62)} →  ${clean}`);
  }
  console.log('');
}

// ─── Write output ─────────────────────────────────────────────────────────
const outPath = APPLY ? recipesPath : join(ROOT, 'src/data/recipes-canonical.json');
writeFileSync(outPath, JSON.stringify(recipes));
const sizeKB = Math.round(JSON.stringify(recipes).length / 1024);
console.log(`Wrote ${recipes.length} recipes to ${outPath} (${sizeKB} KB)`);
console.log(APPLY ? 'APPLIED to live recipes.json' : 'Review file then re-run with --apply to commit');
