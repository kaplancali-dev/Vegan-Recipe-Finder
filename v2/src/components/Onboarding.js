/**
 * Onboarding — 4-step walkthrough for first-time visitors.
 *
 * Guides users through selecting pantry staples and allergens,
 * then saves to the store. Shown only when `onboarded` is false
 * and the user has zero staples.
 */

import { get, set } from '../state/store.js';
import { escHTML } from '../utils/text.js';
import { $ } from '../utils/dom.js';
import { startTour } from './GuidedTour.js';

/* ── Staple chips data ──────────────────────────────────────── */

export const STAPLE_SECTIONS = [
  // 0 — Beans & Legumes
  { label: '🫘 Beans & Legumes', sub: 'the workhorses', items: [
    'chickpeas','black beans','lentils','kidney beans',
    'cannellini beans','great northern beans','navy beans','butter beans','lima beans','pinto beans',
    { name: 'mung beans', hint: 'sprout-worthy' },
    'split peas','black-eyed peas',
    'firm tofu','extra-firm tofu','soft tofu','silken tofu','tempeh','edamame',
    { name: 'jackfruit', hint: 'the pulled pork impersonator' },
    { name: 'TVP', hint: 'ground beef/chicken impersonator' },'soy curls',
  ]},
  // 1 — Grains & Starches (GLUTEN-FREE — HARVEST is GF by default)
  { label: '🌾 Grains & Starches', sub: 'the carb committee', items: [
    'GF pasta (any)','rice (any)',
    { name: 'quinoa', hint: 'still pronouncing it wrong' },
    'oats','millet','sweet potatoes','potatoes',
    'corn tortillas','polenta','cornmeal','masa harina','buckwheat',
    'rice noodles','glass noodles','nori',
    { name: 'gnocchi', hint: 'verify GF (most are wheat)' },
    'GF bread','GF breadcrumbs','GF tortillas',
  ]},
  // 2 — Vegetables
  { label: '🥦 Vegetables', sub: 'the main event', items: [
    { name: 'garlic', hint: 'always more' },
    'yellow onion','white onion','red onion','fresh ginger','spinach',
    { name: 'kale', hint: 'we know' },
    'carrots','celery','broccoli','cauliflower','bell peppers',
    'mushrooms (any)','tomatoes','cherry tomatoes',
    { name: 'avocado', hint: "yes it's a fruit, no we don't care" },
    'zucchini','corn','cucumber','green onions','eggplant','cabbage',
    'butternut squash','pumpkin','pumpkin puree','arugula','leeks','collard greens',
    'lettuce (any)','green beans','asparagus','green peas','brussels sprouts',
    'parsnips','swiss chard','bok choy','turnip','pickles','okra','jicama',
    { name: 'kimchi', hint: 'Korean, look for vegan label' },
    { name: 'jalapeño', hint: 'proceed with caution' },
    { name: 'green chili', hint: 'Indian/Thai heat' },
    'beets','radishes','artichoke hearts','bean sprouts','bamboo shoots','shallots',
  ]},
  // 3 — Fruits
  { label: '🍋 Fruits', sub: "for snacking, smoothies, and pretending you're virtuous", items: [
    'lemon','lime','banana','berries (any)','cranberries','cherries',
    'mango','apple','oranges','orange juice','pineapple','peaches','pears',
    'kiwi','papaya',
    { name: 'pomegranate', hint: 'worth the mess' },
    'plantain','figs','grapes','watermelon','coconut',
    { name: 'dates', hint: "nature's caramel, no notes" },
    'raisins','dried apricots','date paste',
  ]},
  // 4 — Nuts & Seeds
  { label: '🥜 Nuts & Seeds', sub: 'creamy dreams', items: [
    { name: 'nut butter (any)', hint: 'spoon optional' },
    { name: 'cashews', hint: "soak 'em, blend 'em, thank us" },
    'almonds','walnuts','pecans','brazil nuts','macadamia nuts','hazelnuts',
    'pistachio','peanuts','sesame seeds','pine nuts','tahini',
    { name: 'hemp seeds', hint: 'no, not that kind' },
    { name: 'chia seeds', hint: 'remember 2013?' },
    'flax seeds','pumpkin seeds','sunflower seeds','protein powder',
  ]},
  // 5 — Plant-Based Dairy
  { label: '🥛 Plant-Based Dairy', sub: 'moo-free zone', items: [
    'almond milk','soy milk','rice milk','hemp milk',
    'macadamia milk','pistachio milk',
    { name: 'oat milk', hint: "the people's champion" },
    'cashew milk','vegan yogurt','vegan cream cheese','vegan parmesan','vegan feta','vegan cheese',
  ]},
  // 6 — Oils & Fats
  { label: '🫒 Oils & Fats', sub: 'the slip-and-slide section', items: [
    'olive oil','coconut oil','avocado oil','sesame oil','chili oil',
    { name: 'vegan butter', hint: "yes it melts, yes it's real" },
    'vegetable oil','toasted sesame oil','sunflower oil','grapeseed oil','peanut oil',
  ]},
  // 7 — Canned & Jarred (these were here, now adding salsa/hummus/wine/wine vinegar to existing)

  { label: '🥫 Canned & Jarred', sub: 'shelf-stable MVPs', items: [
    'canned tomatoes (any)','tomato sauce','tomato paste','vegetable broth',
    { name: 'coconut milk', hint: 'the canned kind, for curries & sauces' },
    'olives','artichoke hearts','roasted red peppers',
    { name: 'sun-dried tomatoes', hint: 'umami bombs' },
    'capers','salsa','hummus','sauerkraut','instant coffee','cooking spray',
    'hearts of palm','yellow cornmeal',
  ]},
  // 8 — Sauces & Condiments (GLUTEN-FREE focus — items where most brands
  // contain wheat/malt have a "verify GF" hint. Users with certified GF
  // versions can confidently select them.)
  { label: '🫙 Sauces & Condiments', sub: 'the personality section', items: [
    'tamari / coconut aminos','miso paste','vegan mayo',
    'ketchup','yellow mustard','dijon mustard',
    { name: 'BBQ sauce', hint: 'verify GF label' },
    { name: 'hoisin sauce', hint: 'verify GF label' },
    { name: 'vegan worcestershire', hint: 'verify GF label' },
    'tamarind paste','harissa paste',
    { name: 'gochujang', hint: 'Korean heat, verify GF label' },
    'sriracha / hot sauce','sambal oelek','curry paste','liquid smoke',
    'vegan sour cream',
    { name: 'nutritional yeast', hint: 'cheese flavor, zero guilt' },
  ]},
  // 9 — Sweeteners & Vinegars
  { label: '🍯 Sweeteners & Vinegars', sub: 'the sweet-and-sour squad', items: [
    { name: 'maple syrup', hint: 'not just for pancakes' },
    'natural sweetener (any)','agave nectar','coconut sugar','brown sugar','cane sugar','powdered sugar',
    'date syrup','molasses','coconut nectar','allulose','stevia / monk fruit',
    'apple cider vinegar','rice vinegar','balsamic vinegar',
    'white vinegar','red wine vinegar','white wine vinegar','sherry vinegar',
    { name: 'red wine', hint: 'cooking wine' },
    { name: 'white wine', hint: 'cooking wine' },
  ]},
  // 10 — Baking & Flours (GLUTEN-FREE ONLY — HARVEST is GF by default)
  { label: '🧂 Baking & Flours', sub: 'for your ambitious Sunday self', items: [
    'baking soda','baking powder','cornstarch','arrowroot powder',
    'gluten-free flour','almond flour','coconut flour','oat flour',
    'tapioca flour','brown rice flour','chickpea flour','cassava flour',
    'flaxseed meal','applesauce','aquafaba','agar powder','psyllium husk',
    { name: 'xanthan gum', hint: 'tiny amount, big difference' },
    'almond extract','matcha',
    'cream of tartar','active dry yeast','protein powder',
  ]},
  // 11 — Spices & Herbs
  { label: '🌿 Spices & Herbs', sub: 'the flavor council', items: [
    'turmeric','cumin',
    { name: 'smoked paprika', hint: 'makes everything better' },
    'cinnamon','chili powder','ginger','curry powder',
    'black pepper','garlic powder','onion powder',
    'oregano','basil','thyme','sage','coriander','cayenne',
    'cilantro','parsley','white pepper','pumpkin pie spice','taco seasoning',
    'cumin seeds','coriander seeds','mustard seeds','poppy seeds','caraway seeds',
    'cardamom','cloves','allspice','bay leaves','five spice','nutmeg',
    'sea salt','poultry seasoning','saffron','za\'atar','berbere',
    { name: 'garam masala', hint: 'instant warmth' },
    'lemongrass','star anise','dill','mint','chives','rosemary',
    'red pepper flakes','fennel seeds',
    { name: 'sumac', hint: 'lemony magic' },
    'italian seasoning',
  ]},
  // 12 — Dessert Pantry
  { label: '🍨 Dessert Pantry', sub: 'treat yourself (responsibly)', items: [
    'vanilla extract','cocoa powder',
    'chocolate chips (any)','white chocolate chips','dark chocolate',
    { name: 'cacao nibs', hint: 'chocolate for grown-ups' },
    { name: 'cacao butter', hint: 'for raw chocolate making' },
    { name: 'coconut cream', hint: 'thicker than coconut milk, for whipped toppings & rich desserts' },
    'shredded coconut',
    'date sugar','allulose','stevia / monk fruit',
  ]},
  // 13 — Asian Specialty (GF-safe items only)
  // EXCLUDED: shaoxing wine (traditional contains wheat — celiac safety)
  // VERIFY LABELS: vegan oyster sauce, mirin (some brands have wheat additives)
  { label: '🍱 Asian Specialty', sub: 'unlock Japanese, Korean, Chinese & Indian recipes', items: [
    { name: 'mirin', hint: 'sweet rice wine, verify GF label' },
    { name: 'gochugaru', hint: 'Korean chili flakes' },
    { name: 'vegan oyster sauce', hint: 'verify GF label' },
    { name: 'shichimi togarashi', hint: 'Japanese 7-spice' },
    'furikake',
    'kombu',
    { name: 'kala namak', hint: 'Indian black salt, eggy flavor for tofu scrambles' },
    { name: 'curry leaves', hint: 'Indian aromatic, fresh or dried' },
    { name: 'galangal', hint: 'Thai ginger cousin' },
    { name: 'fenugreek', hint: 'leaves or seeds, Indian' },
    { name: 'fenugreek seeds', hint: 'Indian' },
    { name: 'chana dal', hint: 'split chickpeas, Indian' },
    { name: 'gochujang paste', hint: 'Korean fermented chili, verify GF' },
    { name: 'wasabi', hint: 'Japanese horseradish' },
    { name: 'vegan fish sauce', hint: 'umami booster' },
    'daikon','yuzu','wakame',
    'rice paper',
  ]},
];

const ALLERGENS = [
  { key: 'peanut',     label: '🥜 Peanuts' },
  { key: 'tree nut',   label: '🌰 Tree Nuts' },
  { key: 'soy',        label: '🫘 Soy' },
  { key: 'coconut',    label: '🥥 Coconut' },
  { key: 'corn',       label: '🌽 Corn' },
  { key: 'mushroom',   label: '🍄 Mushrooms' },
  { key: 'nightshade', label: '🍅 Nightshades' },
];

/* ── Sub-page groupings for Step 2 ─────────────────────────── */

const STAPLE_PAGES = [
  { sections: [0],     label: 'Beans & Legumes' },
  { sections: [1],     label: 'Grains & Starches' },
  { sections: [2],     label: 'Vegetables' },
  { sections: [3],     label: 'Fruits' },
  { sections: [4],     label: 'Nuts & Seeds' },
  { sections: [5, 6],  label: 'Dairy & Oils' },
  { sections: [7, 8],  label: 'Pantry Essentials' },
  { sections: [9, 10], label: 'Sweeteners & Baking' },
  { sections: [11],    label: 'Spices & Herbs' },
  { sections: [12],    label: 'Dessert Pantry' },
  { sections: [13],    label: 'Asian Specialty' },
];

/* ── Page prompts (one per staple sub-page) ────────────────── */

const PAGE_PROMPTS = [
  "Let's start with the protein heavy-hitters. These are the beans, lentils, and tofu that keep you full and your muscles happy.",
  "Carbs aren't the enemy — they're the foundation. Pick the grains and starches you always have lurking in a cabinet somewhere.",
  "The produce aisle. Tap everything you usually grab, even the one you buy and forget about until it's too late.",
  "Fruit! The stuff you eat with good intentions and the stuff you eat standing over the sink at midnight. Both count.",
  "Nuts and seeds — tiny but mighty. These add crunch, protein, and that satisfying feeling of eating like a responsible adult.",
  "Plant milks and oils — because regular dairy is clearly for their offspring, and you, my friend, are not a cow. These are the behind-the-scenes MVPs.",
  "The pantry shelf essentials. Canned goods, sauces, the stuff that turns 'I have nothing' into an actual meal.",
  "Sweeteners and vinegars — the sweet-and-sour backbone. A splash of vinegar or drizzle of maple can save almost anything.",
  "Spices are where the magic happens. This is the difference between 'I ate' and 'I COOKED.' Go wild.",
  "The dessert pantry. Because sometimes dinner is just the opening act.",
  "Last stop — Asian specialty items. Skip if Japanese/Korean/Chinese cooking isn't your thing. Otherwise, these unlock a whole new world.",
];

/* ── State ──────────────────────────────────────────────────── */

const _staplesPicked = new Set();
const _allergiesPicked = new Set();
let _currentStep = 1;
let _currentSubPage = 0;

/* ── Render ─────────────────────────────────────────────────── */

function _buildSectionHTML(sec) {
  const subHTML = sec.sub ? `<span class="obd-cat-sub">${escHTML(sec.sub)}</span>` : '';
  return `
    <div class="obd-cat-label">${escHTML(sec.label)}${subHTML}</div>
    <div class="obd-chips">
      ${sec.items.map(item => {
        const name = typeof item === 'string' ? item : item.name;
        const hint = typeof item === 'object' && item.hint ? item.hint : '';
        const hintHTML = hint
          ? `<span class="obd-chip-hint">${escHTML(hint)}</span>`
          : '';
        return `<span class="obd-chip-wrap">
          <span class="obd-chip" data-obd-staple="${escHTML(name)}">${escHTML(name)}</span>
          ${hintHTML}
        </span>`;
      }).join('')}
    </div>
  `;
}

function _buildStaplePages() {
  return STAPLE_PAGES.map((page, i) => {
    const sectionsHTML = page.sections.map(idx => _buildSectionHTML(STAPLE_SECTIONS[idx])).join('');
    const activeClass = i === 0 ? ' active' : '';
    return `<div class="obd-subpage${activeClass}" data-obd-subpage="${i}">${sectionsHTML}</div>`;
  }).join('');
}

function _buildSubProgress() {
  return STAPLE_PAGES.map((_, i) =>
    `<span class="obd-sub-dot${i === 0 ? ' on' : ''}" data-sub-idx="${i}"></span>`
  ).join('');
}

function _buildAllergenChips() {
  return ALLERGENS.map(a =>
    `<span class="obd-chip" data-obd-allergen="${escHTML(a.key)}">${a.label}</span>`
  ).join('');
}

function _buildHTML() {
  return `
    <div class="obd-card">
      <div class="obd-progress" id="obdProgress">
        <span class="obd-dot on"></span><span class="obd-dot"></span>
        <span class="obd-dot"></span><span class="obd-dot"></span>
      </div>

      <!-- STEP 1: Welcome -->
      <div class="obd-step active" data-obd-step="1">
        <div class="obd-hero-icon">🥬🧅🫙</div>
        <div class="obd-title">Welcome to HARVEST</div>
        <div class="obd-hook">Right now, something in your fridge is quietly giving up on you. Let's prove it wrong.</div>
        <div class="obd-sub">Tell us what's lurking in there — the sad half-onion, the mystery jar, the kale you bought with good intentions — and we'll match you to plant-based recipes you can actually make tonight.</div>
        <div class="obd-stat">Takes about a minute. Unlocks over 4,000 gluten-free recipes from the world's top plant-based cooks.</div>
        <button class="obd-btn obd-btn-primary" data-obd-go="2">Let's go</button><br>
        <button class="obd-btn-skip" data-obd-skip>Skip — I trust my chaos <span class="obd-skip-note">(you can come back anytime)</span></button>
      </div>

      <!-- STEP 2: Staples (paginated) -->
      <div class="obd-step" data-obd-step="2">
        <div class="obd-title">What's always in your kitchen?</div>
        <div class="obd-why" id="obdWhyCallout">
          <strong>Quick game:</strong> tap what usually lives in your kitchen — across <strong>10 quick categories</strong>, about a minute total. The reward: from here on, we filter over 4,000 gluten-free recipes down to <em>only</em> the ones you can cook tonight. No taunting you with ingredients you don't have.
        </div>
        <div class="obd-sub obd-page-prompt" id="obdPagePrompt">${PAGE_PROMPTS[0]}</div>
        <div class="obd-sub-progress" id="obdSubProgress">${_buildSubProgress()}</div>
        <div class="obd-sub-label" id="obdSubLabel">1 of ${STAPLE_PAGES.length}</div>
        <div id="obdStaples" class="obd-subpage-container">${_buildStaplePages()}</div>
        <div id="obdStapleCount" class="obd-count"></div>
        <div class="obd-sub-nav">
          <button class="obd-btn obd-btn-back" data-obd-sub-back style="visibility:hidden">Back</button>
          <button class="obd-btn obd-btn-primary" data-obd-sub-next>Next</button>
        </div>
        <button class="obd-btn-skip" data-obd-go="4">Skip ahead</button>
      </div>

      <!-- STEP 3: Allergies -->
      <div class="obd-step" data-obd-step="3">
        <div class="obd-title">Anything your body vetoes?</div>
        <div class="obd-sub">We'll keep these out of every recipe. Tap any that apply — no judgment, just fewer surprise reactions. (Your throat closing up is not a vibe.)</div>
        <div class="obd-chips" style="justify-content:center">
          ${_buildAllergenChips()}
        </div>
        <button class="obd-btn obd-btn-primary" data-obd-go="4">Show me what I can make</button>
      </div>

      <!-- STEP 4: Done -->
      <div class="obd-step" data-obd-step="4">
        <div style="font-size:2.5rem;margin-bottom:4px">🎉</div>
        <div class="obd-title">You're in.</div>
        <div class="obd-sub" style="font-size:1rem">Nothing in your fridge is giving up on you anymore. You just gave every ingredient a reason to exist.</div>
        <div style="font-size:.85rem;color:var(--ink-soft);line-height:1.5;margin-bottom:12px">
          Toss in fresh items anytime under <strong>My Pantry</strong> — the more you add, the more recipes unlock.</div>
        <button class="obd-btn obd-btn-primary" data-obd-done>Let's cook</button>
      </div>
    </div>
  `;
}

/* ── Sub-page navigation (within Step 2) ───────────────────── */

function _goToSubPage(overlay, idx) {
  _currentSubPage = idx;
  const total = STAPLE_PAGES.length;

  // Show/hide sub-pages
  overlay.querySelectorAll('.obd-subpage').forEach(p => {
    p.classList.toggle('active', Number(p.dataset.obdSubpage) === idx);
  });

  // Update sub-progress dots
  overlay.querySelectorAll('.obd-sub-dot').forEach((d, i) => {
    d.classList.toggle('on', i <= idx);
  });

  // Update label
  const label = overlay.querySelector('#obdSubLabel');
  if (label) label.textContent = `${idx + 1} of ${total}`;

  // Update page prompt
  const prompt = overlay.querySelector('#obdPagePrompt');
  if (prompt && PAGE_PROMPTS[idx]) prompt.textContent = PAGE_PROMPTS[idx];

  // Show "Quick game" callout only on the first sub-page
  const whyCallout = overlay.querySelector('#obdWhyCallout');
  if (whyCallout) whyCallout.style.display = idx === 0 ? '' : 'none';

  // Back button visibility
  const backBtn = overlay.querySelector('[data-obd-sub-back]');
  if (backBtn) backBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';

  // Next button text — last sub-page goes to allergies
  const nextBtn = overlay.querySelector('[data-obd-sub-next]');
  if (nextBtn) {
    if (idx === total - 1) {
      nextBtn.textContent = 'Next — Allergies';
    } else {
      nextBtn.textContent = 'Next';
    }
  }

  // Scroll card to top
  const card = overlay.querySelector('.obd-card');
  if (card) card.scrollTop = 0;
}

/* ── Step navigation ────────────────────────────────────────── */

function _goToStep(overlay, step) {
  _currentStep = step;

  // Reset sub-page when entering step 2
  if (step === 2) {
    _goToSubPage(overlay, 0);
  }

  // Update step visibility
  overlay.querySelectorAll('.obd-step').forEach(s => {
    s.classList.toggle('active', s.dataset.obdStep === String(step));
  });

  // Update progress dots
  overlay.querySelectorAll('.obd-dot').forEach((d, i) => {
    d.classList.toggle('on', i < step);
  });

  // On reaching step 4, save everything to the store
  if (step === 4) {
    _saveSelections();
  }

  // Scroll card to top
  const card = overlay.querySelector('.obd-card');
  if (card) card.scrollTop = 0;
}

/* ── Save selections ────────────────────────────────────────── */

function _saveSelections() {
  // Merge picked staples into existing staples
  const current = get('staples');
  const currentLower = new Set(current.map(s => s.toLowerCase()));
  const toAdd = [..._staplesPicked].filter(s => !currentLower.has(s.toLowerCase()));
  if (toAdd.length) {
    set('staples', [...current, ...toAdd]);
  }

  // Save allergens
  if (_allergiesPicked.size) {
    const existing = get('allergies');
    const existingSet = new Set(existing);
    const newAllergens = [..._allergiesPicked].filter(a => !existingSet.has(a));
    if (newAllergens.length) {
      set('allergies', [...existing, ...newAllergens]);
    }
  }
}

/* ── Dismiss ────────────────────────────────────────────────── */

function _dismiss(overlay, onDismiss) {
  set('onboarded', true);
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.remove();
    // Notify caller (e.g. landing page) that onboarding is done
    if (typeof onDismiss === 'function') onDismiss();
    // Launch guided tour after onboarding fades out
    startTour();
  }, 350);
}

/* ── Init ───────────────────────────────────────────────────── */

/**
 * Initialize onboarding. Shows the walkthrough if this is a first visit.
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.inline=false]    Mount inline (no full-screen modal).
 * @param {string|Element} [opts.mountInto] Target element/selector when inline.
 * @param {Function} [opts.onDismiss]      Called after onboarding completes.
 * @param {number} [opts.startStep]        Which step to start on (1-4). Defaults
 *                                         to 1 in modal mode and 2 in inline mode
 *                                         (skips the welcome step since the
 *                                         landing hero already welcomes the user).
 */
export function initOnboarding(opts = {}) {
  const { inline = false, mountInto = null, onDismiss = null } = opts;
  // In inline mode the landing hero already serves as the welcome,
  // so by default skip step 1 and jump straight to the staples picker.
  const startStep = opts.startStep != null ? opts.startStep : (inline ? 2 : 1);

  const onboarded = get('onboarded');
  const hasStaples = get('staples').length > 0;

  // Don't show if already onboarded or has staples
  if (onboarded || hasStaples) return;

  // Don't show if arriving via a shared recipe deep link
  const hasDeepLink = window.location.hash.match(/^#r=\d+/) ||
    new URLSearchParams(window.location.search).get('r');
  if (hasDeepLink) return;

  // Resolve mount target for inline mode
  let mountEl = document.body;
  if (inline) {
    mountEl = typeof mountInto === 'string' ? document.querySelector(mountInto) : mountInto;
    if (!mountEl) {
      console.warn('[Onboarding] inline mode requested but mountInto not found; falling back to body');
      mountEl = document.body;
    }
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'obd-overlay' + (inline && mountEl !== document.body ? ' obd-overlay--inline' : '');
  overlay.id = 'obdOverlay';
  overlay.innerHTML = _buildHTML();
  mountEl.appendChild(overlay);

  // If a non-default starting step was requested, swap the active step
  // (default state from _buildHTML has step 1 active and the first dot on).
  if (startStep !== 1) {
    _goToStep(overlay, startStep);
  }

  // Fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });
  });

  // Event delegation — all clicks handled here
  overlay.addEventListener('click', (e) => {
    const el = e.target;

    // Staple chip toggle
    const stapleChip = el.closest('[data-obd-staple]');
    if (stapleChip) {
      const item = stapleChip.dataset.obdStaple;
      stapleChip.classList.toggle('on');
      if (stapleChip.classList.contains('on')) {
        _staplesPicked.add(item);
      } else {
        _staplesPicked.delete(item);
      }
      const countEl = overlay.querySelector('#obdStapleCount');
      if (countEl) {
        countEl.textContent = _staplesPicked.size
          ? `${_staplesPicked.size} selected`
          : '';
      }
      return;
    }

    // Allergen chip toggle
    const allergenChip = el.closest('[data-obd-allergen]');
    if (allergenChip) {
      const key = allergenChip.dataset.obdAllergen;
      allergenChip.classList.toggle('allergy-on');
      if (allergenChip.classList.contains('allergy-on')) {
        _allergiesPicked.add(key);
      } else {
        _allergiesPicked.delete(key);
      }
      return;
    }

    // Sub-page Next button (within Step 2)
    if (el.closest('[data-obd-sub-next]')) {
      if (_currentSubPage < STAPLE_PAGES.length - 1) {
        _goToSubPage(overlay, _currentSubPage + 1);
      } else {
        // Last sub-page → go to allergies (step 3)
        _goToStep(overlay, 3);
      }
      return;
    }

    // Sub-page Back button (within Step 2)
    if (el.closest('[data-obd-sub-back]')) {
      if (_currentSubPage > 0) {
        _goToSubPage(overlay, _currentSubPage - 1);
      }
      return;
    }

    // Navigation buttons
    const goBtn = el.closest('[data-obd-go]');
    if (goBtn) {
      _goToStep(overlay, Number(goBtn.dataset.obdGo));
      return;
    }

    // Skip button
    if (el.closest('[data-obd-skip]')) {
      _dismiss(overlay, onDismiss);
      return;
    }

    // Done button
    if (el.closest('[data-obd-done]')) {
      _dismiss(overlay, onDismiss);
      return;
    }
  });
}
