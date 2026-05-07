/**
 * Text utilities — normalization, stemming, escaping.
 * Pure functions with zero side effects.
 */

/**
 * Normalize an ingredient name: lowercase, strip punctuation (preserving
 * accented/unicode letters like ñ, é, ü), collapse whitespace.
 *
 * IMPORTANT: dashes (-, –, —) are converted to SPACES before stripping
 * other punctuation. Without this, "plant-based" becomes "plantbased"
 * (joined) instead of "plant based" (two words), which breaks word-boundary
 * matching for many hyphenated ingredients ("low-sodium", "gluten-free",
 * "fire-roasted", "non-dairy", "self-rising", "plant-based").
 */
export function norm(s) {
  return s.toLowerCase()
    .replace(/[-–—]/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Naive English stemmer tuned for recipe ingredient names.
 * Handles: curries→curry, halves→half, roasting→roast, roasted→roast,
 *          potatoes→potato, burgers→burger, diced→dice, sliced→slice.
 *
 * Rules are ordered most-specific-first to avoid over-stemming.
 */
export function stem(w) {
  w = w.toLowerCase();
  if (w.length < 4) return w;
  // Preserve words ending in "ced/ged/sed/zed" → remove only "d" (diced→dice, sliced→slice)
  if (w.endsWith('ced') || w.endsWith('ged') || w.endsWith('sed') || w.endsWith('zed')) {
    return w.length > 4 ? w.slice(0, -1) : w;
  }
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ves') && w.length > 4) return w.slice(0, -3) + 'f';
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed')  && w.length > 4) return w.slice(0, -2);
  // English plural rule: only strip 'es' when the singular form ends with
  // s/x/z/ch/sh/o (boxes→box, tomatoes→tomato). Otherwise just strip 's'.
  // Without this, "apples" becomes "appl" instead of "apple".
  if (w.endsWith('es') && w.length > 4) {
    const stem3 = w.slice(0, -2);  // word minus "es"
    const lastChar = stem3.slice(-1);
    const last2 = stem3.slice(-2);
    if (lastChar === 's' || lastChar === 'x' || lastChar === 'z' || lastChar === 'o' ||
        last2 === 'ch' || last2 === 'sh') {
      return stem3;  // boxes → box, tomatoes → tomato
    }
    // Fall through to just stripping 's' for words like "apples" → "apple"
  }
  if (w.endsWith('s')   && w.length > 3) return w.slice(0, -1);
  return w;
}

/**
 * Strip measurements, units, prep instructions, and notes from an ingredient string.
 * Returns just the core ingredient name for clean display.
 * E.g. "200 g / 7 oz tenderstem broccoli* (broccolini)" → "tenderstem broccoli"
 *      "½ teaspoon freshly ground black pepper" → "black pepper"
 *      "2 to 3 large kale leaves, shredded" → "kale"
 *      "juice of 1 lemon" → "lemon juice"
 */
export function stripMeasure(s) {
  if (!s) return s;
  let str = s.trim();

  // 0. Pre-clean: strip bracketed measurements like "[½ cup]", "[1.1lbs]", "[400ml)"
  str = str.replace(/\[[^\]]*[\]\)]/g, '').trim();

  // 1. Strip leading label prefixes
  str = str.replace(/^(?:option|optional|note|garnish|topping|for serving|for the|plus|and|suggested accompaniments)\s*:?\s+/i, '');
  str = str.replace(/^for\s+(?:garnish|serving|topping)\s*\(.*\)\s*/i, '');

  // 2. Strip leading "approx.", "about", "a ", "an "
  str = str.replace(/^(?:approx\.?|approximately|about|roughly)\s+/i, '');
  str = str.replace(/^an?\s+(?=\w)/i, '');

  // 3. Handle "juice of/from N lemon" / "zest of N lemon" → "lemon juice" / "lemon zest"
  const juiceZest = str.match(/^(juice|zest)\s+(?:of|from)\s+[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-–+\s]+(.+)/i);
  if (juiceZest) {
    const type = juiceZest[1].toLowerCase();
    let fruit = juiceZest[2].replace(/^(?:small|medium|large)\s+/i, '').trim()
      .replace(/,.*$/, '').replace(/\s+and\s+.*$/i, '').replace(/s$/, '');
    return fruit + ' ' + type;
  }
  const juiceFrom = str.match(/^(juice|zest)\s+from\s+(.+)/i);
  if (juiceFrom) {
    let fruit = juiceFrom[2].replace(/^[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-–+\s]+/, '').trim()
      .replace(/,.*$/, '').replace(/s$/, '');
    return fruit + ' ' + juiceFrom[1].toLowerCase();
  }
  // "seeds of N cardamom pods" → "cardamom"
  const seedsOf = str.match(/^seeds?\s+of\s+[\d½¼¾⅓⅔.,/\-–+\s]+(.+)/i);
  if (seedsOf) {
    return seedsOf[1].replace(/\s+pods?$/i, '').trim();
  }

  // 4. Handle "x NNNg can of chickpeas" (UK multiplier pattern)
  str = str.replace(/^[x×]\s+[\d.,]+\s*(?:g|kg|ml|l|oz|lb)\s*/i, '');
  str = str.replace(/^(?:can|cans|tin|tins|jar|jars|bag|bags|pack|packs|packet|packets|block|blocks)\s+(?:of\s+)?/i, '');

  // 5. Strip quantities and units iteratively
  const UNIT = String.raw`(?:g|kg|oz|lb|lbs|ml|l|dl|cups?|tsp|tbsp|teaspoons?|tablespoons?|ounces?|pounds?|grams?|inch(?:es)?|cm|cloves?|bunch(?:es)?|handfuls?|pieces?|cans?|tins?|heads?|stalks?|sprigs?|pinch(?:es)?|dash(?:es)?|slices?|sheets?|blocks?|packets?|packages?|pouches?|sachets?|sticks?|loaves?|tubes?|bars?|bags?|jars?|bottles?|portions?|servings?|leaves?|drops?|packs?)`;
  const UNIT_ADJ = String.raw`(?:heaped|rounded|level|packed|generous|scant|good)`;

  str = str.replace(/^[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-–~≈+×x\s]+/, '');
  str = str.replace(/^oz\.?\s*/i, '');

  const unitPat = new RegExp(String.raw`^(?:${UNIT_ADJ}\s+)?${UNIT}(?:\.)?(?:\s|$)`, 'i');
  let safety = 12;
  while (safety-- > 0) {
    const m = str.match(unitPat);
    if (m) {
      str = str.slice(m[0].length).trim();
      const altPat = new RegExp(String.raw`^/\s*[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-–+]+\s*(?:${UNIT})?\s*`, 'i');
      const alt = str.match(altPat);
      if (alt) str = str.slice(alt[0].length).trim();
      continue;
    }
    if (/^to\s+[\d½¼¾⅓⅔]+/i.test(str)) { str = str.replace(/^to\s+[\d½¼¾⅓⅔.,/\-–+]+\s*/, ''); continue; }
    if (/^[\d½¼¾⅓⅔.,/\-–+]+\s/.test(str)) { str = str.replace(/^[\d½¼¾⅓⅔.,/\-–+]+\s+/, ''); continue; }
    if (/^of\s+/i.test(str)) { str = str.replace(/^of\s+/i, ''); continue; }
    if (/^plus\s+[\d½¼¾⅓⅔]+/i.test(str)) { str = str.replace(/^plus\s+[\d½¼¾⅓⅔.,/\-–+]+\s*/, ''); continue; }
    break;
  }

  // 6. Clean up
  // CRITICAL: only strip after-comma content if it looks like prep/usage
  // notes. Don't blanket-strip "unsweetened, unflavored plant-based milk"
  // → "unsweetened" (loses the actual ingredient identity).
  // PREP_VERBS: only verbs/states that are clearly POST-INGREDIENT prep notes,
  // never adjective forms of the ingredient itself.
  // EXCLUDED on purpose: raw, cooked, toasted, rolled, frozen, thawed —
  // these often describe the ingredient form ("raw cashews", "rolled oats")
  // not a prep step. The NOISE regex below handles them as leading words.
  const PREP_VERBS = '(?:chopped|diced|minced|sliced|crushed|grated|shredded|peeled|seeded|deseeded|halved|quartered|pitted|stemmed|trimmed|cleaned|cubed|drained|rinsed|melted|softened|divided|sifted|julienned|mashed|cored|torn|packed|pressed|warmed|cooled|chilled|squeezed|finely|roughly|coarsely|thinly|thickly|optional|to\\s+taste|for\\s+\\w+|see\\s+\\w+|or\\s+more|or\\s+less|plus\\s+more|approximately|about|approx|cut\\s+into\\s+\\w+|stems\\s+removed|leaves\\s+only|drained\\s+and\\s+rinsed|peeled\\s+and\\s+\\w+|halved\\s+and\\s+\\w+|seeded\\s+and\\s+\\w+|finely\\s+\\w+|roughly\\s+\\w+|coarsely\\s+\\w+|thinly\\s+\\w+|thickly\\s+\\w+)';
  str = str
    .replace(new RegExp(`,\\s*${PREP_VERBS}.*$`, 'i'), '')  // only strip prep-like after-comma
    .replace(/\s+-\s+.*$/, '')
    // Replace parens with single space so "caster (superfine) sugar"
    // becomes "caster sugar" not "castersugar". Step 15 collapses extra space.
    .replace(/\s*\([^)]*\)?\s*/g, ' ')
    .replace(/\*+/g, '')
    .replace(/\.\s*$/, '')
    .replace(/\s+instead\s+of\s+.*$/i, '')
    .replace(/\s*-\s*see\s+.*$/i, '')
    .trim();

  // 7. Strip prep/descriptor noise words
  const NOISE = /\b(?:fresh|freshly|ground|organic|raw|dried|dry|frozen|thawed|shredded|chopped|diced|minced|sliced|grated|crushed|mashed|sifted|julienned|trimmed|stemmed|peeled|pitted|deseeded|seeded|cored|halved|quartered|torn|packed|pressed|softened|melted|warm|cold|hot|chilled|lightly|roughly|finely|thinly|coarsely|undrained|toasted|roasted|cooked|leftover|ready-rolled|smashed|scrubbed)\s+/gi;
  let prev = '';
  while (str !== prev) { prev = str; str = str.replace(NOISE, '').trim(); }
  str = str.replace(/\s+(?:warm|cold|hot|chilled|thawed|softened|melted|chopped|diced|minced|sliced|shredded|grated|crushed|mashed|peeled|pitted|trimmed|stemmed|quartered|halved|toasted|roasted)$/i, '');
  str = str.replace(/[-–]\s*rough$/i, '');
  // Strip multi-word trailing prep phrases WITHOUT requiring a leading comma.
  // Recipe authors are inconsistent about commas: "black beans drained and
  // rinsed" should match "black beans" the same as "black beans, drained
  // and rinsed". The combined-AND guard in the matcher would otherwise
  // wrongly reject these as combined ingredients.
  // Loop until stable so multiple trailing phrases all get stripped.
  const TRAILING_PREP_PHRASES = /\s+(?:drained\s+and\s+rinsed|rinsed\s+and\s+drained|drained\s+well|drained\s+very\s+well|patted\s+dry|peeled\s+and\s+(?:diced|chopped|sliced|minced|cubed|grated|halved|quartered)|halved\s+and\s+(?:diced|chopped|sliced|minced|cubed)|seeded\s+and\s+(?:diced|chopped|sliced|minced))$/i;
  let prevPrep = '';
  while (str !== prevPrep) { prevPrep = str; str = str.replace(TRAILING_PREP_PHRASES, '').trim(); }

  // 8. Strip size descriptors
  str = str.replace(/^(?:large|small|medium|big|thin|thick|extra-?large|extra-?small|mini|tiny|generous|good|fine)\s+/i, '');

  // 9. Strip trailing plant-part / container / form words
  str = str.replace(/\s+(?:leaves|stalks|stems|sprigs|sheets|bulbs|florets|cloves?|ears|ribs|fronds|slices?|pieces?|strips?|chunks?|wedges?|rounds?|rings?)$/i, '');
  str = str.replace(/^(?:head|sheet|sprig|stalk|bunch|clove|piece|slice|block|pack|batch|dash|pinch)\s+of\s+/i, '');

  // 10. Strip trailing purpose phrases
  str = str.replace(/\s*,?\s*(?:for\s+(?:frying|serving|garnish|topping|drizzling|dipping|coating|dusting)|as\s+needed|to\s+taste|if\s+needed|if\s+desired)\s*$/i, '');
  // 10b. Strip plant-part descriptors after a comma:
  //   "scallions, white and green parts"
  //   "fresh sweet corn, husks and silks removed"
  //   "kale, stems removed"
  //   "lemongrass, white parts only"
  // These are prep descriptions, not part of the ingredient identity.
  str = str.replace(/\s*,\s*(?:white\s+and\s+green\s+parts?|green\s+parts?\s+only|white\s+parts?\s+only|husks?\s+and\s+silks?\s+removed|stems?\s+removed|leaves?\s+only|stem\s+ends?\s+(?:removed|trimmed)|root\s+ends?\s+(?:removed|trimmed)|tough\s+(?:stems?|outer\s+leaves?)\s+removed|woody\s+ends?\s+removed|outer\s+leaves?\s+removed)\s*$/i, '');

  // 11. Strip leading "each of"
  str = str.replace(/^each\s+of\s+/i, '');

  // 12. Truncate at " or " if followed by a measurement
  const orMatch = str.match(/^(.+?)\s+or\s+[\d½¼¾⅓⅔]/);
  if (orMatch && orMatch[1].length > 3) str = orMatch[1];

  // 13. Strip compound patterns like "water + 1½ tsp corn starch"
  str = str.replace(/\s*\+\s*[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-–]+\s*(?:tsp|tbsp|teaspoons?|tablespoons?|cups?)\s+.*$/i, '');
  str = str.replace(/\s+with\s+[\d½¼¾⅓⅔⅛⅜⅝⅞.,/\-–]+\s*(?:tsp|tbsp|teaspoons?|tablespoons?|cups?)\s+.*$/i, '');
  str = str.replace(/\s+from\s+[\d½¼¾⅓⅔].*$/i, '');

  // 14. Strip leading residual unit words
  str = str.replace(/^(?:tsp|tbsp|teaspoons?|tablespoons?|cups?|oz|ml|g|kg|lb|lbs|ounces?|pounds?|grams?|heaped|scant|packed|level)\s+/i, '');
  if (/^[½¼¾⅓⅔⅛⅜⅝⅞]/.test(str)) {
    str = str.replace(/^[½¼¾⅓⅔⅛⅜⅝⅞.,/\-–+\s]+/, '');
    str = str.replace(/^(?:tsp|tbsp|teaspoons?|tablespoons?|cups?|oz|ml|g|kg|lb|lbs|ounces?|pounds?|grams?)\s+/i, '');
  }

  // 15. Final cleanup
  str = str.replace(/\s+/g, ' ').trim();
  str = str.replace(/^[-–]\s*/, '').replace(/\s*[-–]$/, '');
  str = str.replace(/[)\]]+\s*$/, '').trim();

  // Safety net: if stripMeasure ate too much and the result is just a unit
  // word, fall back to the original. NOTE: "cloves" / "clove" are EXCLUDED
  // because cloves is also a real spice ingredient — recipes saying "ground
  // cloves" should canonicalize to "cloves" not the full original. Garlic
  // cloves get their own handling via identity rewrites.
  if (/^(?:pinch|dash|cup|cups|can|cans|tin|tins|slice|slices|head|heads|bunch|piece|pieces|ounce|ounces|pound|package|tsp|tbsp|teaspoon|tablespoon|scoops?)$/i.test(str)) {
    return s.trim();
  }

  return str || s.trim();
}

/**
 * Decode HTML entities (e.g. &frac14; → ¼, &amp; → &).
 * Used to clean scraped recipe data before display.
 */
const _decodeArea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
export function decodeHTML(s) {
  if (!_decodeArea || !s || !s.includes('&')) return s;
  // Strip tags first to prevent XSS via innerHTML on textarea
  _decodeArea.innerHTML = s.replace(/<[^>]*>/g, '');
  return _decodeArea.value;
}

/**
 * Escape a string for safe insertion into innerHTML.
 * Prevents XSS by converting <, >, &, ", ' to HTML entities.
 */
export function escHTML(s) {
  if (s == null) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s).replace(/[&<>"']/g, c => map[c]);
}

/**
 * Replace a gluten ingredient with its GF substitute.
 * E.g. "all-purpose flour" → "gluten-free flour", "soy sauce" → "tamari"
 * @param {string} ingredient - Raw ingredient name
 * @param {Object} gfSwaps - GF_SWAPS lookup from aliases.js
 * @returns {string}
 */
export function applyGfSwap(ingredient, gfSwaps) {
  const n = norm(ingredient);
  for (const [glutenItem, gfItem] of Object.entries(gfSwaps)) {
    if (norm(glutenItem) === n) return gfItem;
  }
  return ingredient;
}

