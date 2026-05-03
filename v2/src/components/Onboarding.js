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

const STAPLE_SECTIONS = [
  // 0 — Beans & Legumes
  { label: '🫘 Beans & Legumes', sub: 'the workhorses', items: [
    'chickpeas','black beans','lentils','kidney beans','navy beans','pinto beans','white beans',
    { name: 'mung beans', hint: 'sprout-worthy' },
    'split peas','black-eyed peas','lima beans',
    'firm tofu','extra-firm tofu','soft tofu','silken tofu','tempeh','edamame',
    { name: 'jackfruit', hint: 'the pulled pork impersonator' },
    { name: 'TVP', hint: 'the ground beef understudy' },'soy curls',
  ]},
  // 1 — Grains & Starches
  { label: '🌾 Grains & Starches', sub: 'the carb committee', items: [
    'pasta (any)','rice (any)',
    { name: 'quinoa', hint: 'still pronouncing it wrong' },
    'oats','millet','sweet potatoes','potatoes',
    'corn tortillas','polenta','buckwheat',
    'rice noodles','glass noodles','nori',
    'GF bread','GF breadcrumbs','GF tortillas',
  ]},
  // 2 — Vegetables
  { label: '🥦 Vegetables', sub: 'the main event', items: [
    { name: 'garlic', hint: 'always more' },
    'onions','fresh ginger','spinach',
    { name: 'kale', hint: 'we know' },
    'carrots','celery','broccoli','cauliflower','bell peppers',
    'mushrooms (any)','tomatoes',
    { name: 'avocado', hint: "yes it's a fruit, no we don't care" },
    'zucchini','corn','cucumber','green onions','eggplant','cabbage',
    'lettuce (any)','green beans','asparagus',
    { name: 'jalapeño', hint: 'proceed with caution' },
    'beets','radishes','artichoke hearts','bean sprouts','bamboo shoots','shallots',
  ]},
  // 3 — Fruits
  { label: '🍋 Fruits', sub: "for snacking, smoothies, and pretending you're virtuous", items: [
    'lemon','lime','banana','berries (any)','cranberries','cherries',
    'mango','apple','oranges','pineapple','peaches','pears',
    'kiwi','papaya',
    { name: 'pomegranate', hint: 'worth the mess' },
    'plantain','figs','grapes','watermelon','coconut',
    { name: 'dates', hint: "nature's caramel, no notes" },
    'raisins',
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
    'cashew milk','vegan yogurt','vegan cream cheese','vegan parmesan',
  ]},
  // 6 — Oils & Fats
  { label: '🫒 Oils & Fats', sub: 'the slip-and-slide section', items: [
    'olive oil','coconut oil','avocado oil','sesame oil','chili oil',
    { name: 'vegan butter', hint: "yes it melts, yes it's real" },
    'vegetable oil','toasted sesame oil','sunflower oil','grapeseed oil',
  ]},
  // 7 — Canned & Jarred
  { label: '🥫 Canned & Jarred', sub: 'shelf-stable MVPs', items: [
    'canned tomatoes (any)','tomato sauce','tomato paste','vegetable broth',
    'coconut milk','olives','artichoke hearts','roasted red peppers',
    { name: 'sun-dried tomatoes', hint: 'umami bombs' },
    'capers',
  ]},
  // 8 — Sauces & Condiments
  { label: '🫙 Sauces & Condiments', sub: 'the personality section', items: [
    'soy sauce / tamari / coconut aminos','miso paste','vegan mayo',
    'ketchup','yellow mustard','dijon mustard','BBQ sauce',
    { name: 'hoisin sauce', hint: 'stir-fry cheat code' },
    'vegan worcestershire','tamarind paste',
    { name: 'gochujang', hint: 'Korean heat, instant depth' },
    'sriracha / hot sauce','sambal oelek','curry paste','liquid smoke',
    'vegan sour cream',
    { name: 'nutritional yeast', hint: 'cheese flavor, zero guilt' },
  ]},
  // 9 — Sweeteners & Vinegars
  { label: '🍯 Sweeteners & Vinegars', sub: 'the sweet-and-sour squad', items: [
    { name: 'maple syrup', hint: 'not just for pancakes' },
    'natural sweetener (any)','agave nectar','coconut sugar',
    'date syrup','molasses','coconut nectar','allulose','stevia / monk fruit',
    'apple cider vinegar','rice vinegar','balsamic vinegar',
    'white vinegar','red wine vinegar','white wine vinegar','sherry vinegar',
  ]},
  // 10 — Baking & Flours
  { label: '🧂 Baking & Flours', sub: 'for your ambitious Sunday self', items: [
    'baking soda','baking powder','cornstarch','arrowroot powder',
    'gluten-free flour','almond flour','coconut flour','oat flour',
    'tapioca flour','brown rice flour','chickpea flour','cassava flour',
    { name: 'xanthan gum', hint: 'tiny amount, big difference' },
    'cream of tartar','active dry yeast','protein powder',
  ]},
  // 11 — Spices & Herbs
  { label: '🌿 Spices & Herbs', sub: 'the flavor council', items: [
    'turmeric','cumin',
    { name: 'smoked paprika', hint: 'makes everything better' },
    'cinnamon','chili powder','ginger','curry powder',
    'black pepper','garlic powder','onion powder',
    'oregano','basil','thyme','sage','coriander','cayenne',
    'cardamom','cloves','allspice','bay leaves','five spice','nutmeg',
    'sea salt',
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
    'coconut cream','shredded coconut',
    'date sugar','allulose','stevia / monk fruit',
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
];

/* ── Page prompts (one per staple sub-page) ────────────────── */

const PAGE_PROMPTS = [
  "Let's start with the protein heavy-hitters. These are the beans, lentils, and tofu that keep you full and your muscles happy.",
  "Carbs aren't the enemy — they're the foundation. Pick the grains and starches you always have lurking in a cabinet somewhere.",
  "The produce aisle. Tap everything you usually grab, even the one you buy and forget about until it's too late.",
  "Fruit! The stuff you eat with good intentions and the stuff you eat standing over the sink at midnight. Both count.",
  "Nuts and seeds — tiny but mighty. These add crunch, protein, and that satisfying feeling of eating like a responsible adult.",
  "Milks and oils — the behind-the-scenes MVPs. They don't get the glory, but nothing works without them.",
  "The pantry shelf essentials. Canned goods, sauces, the stuff that turns 'I have nothing' into an actual meal.",
  "Sweeteners and vinegars — the sweet-and-sour backbone. A splash of vinegar or drizzle of maple can save almost anything.",
  "Spices are where the magic happens. This is the difference between 'I ate' and 'I COOKED.' Go wild.",
  "Last stop — the dessert pantry. Because sometimes dinner is just the opening act. You're almost done!",
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
        <div class="obd-hook">Your fridge is judging you behind closed doors. It goes full <em>Mean Girls</em> when you're not around. We can fix that.</div>
        <div class="obd-sub">Tell us what's lurking in there — the sad half-onion, the mystery jar, the kale you bought with good intentions — and we'll match you to plant-based recipes you can actually make tonight.</div>
        <div class="obd-stat">Takes about a minute. Unlocks 4,500+ recipes from the world's top plant-based cooks.</div>
        <button class="obd-btn obd-btn-primary" data-obd-go="2">Let's go</button><br>
        <button class="obd-btn-skip" data-obd-skip>Skip — I trust my chaos <span class="obd-skip-note">(you can come back anytime)</span></button>
      </div>

      <!-- STEP 2: Staples (paginated) -->
      <div class="obd-step" data-obd-step="2">
        <div class="obd-title">What's always in your kitchen?</div>
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
        <div class="obd-sub" style="font-size:1rem">Your fridge just went from Mean Girls to your biggest hype man. It's already rehearsing what to say when you come back from the farmers market.</div>
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

function _dismiss(overlay) {
  set('onboarded', true);
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.remove();
    // Launch guided tour after onboarding fades out
    startTour();
  }, 350);
}

/* ── Init ───────────────────────────────────────────────────── */

/**
 * Initialize onboarding. Shows the walkthrough if this is a first visit.
 */
export function initOnboarding() {
  const onboarded = get('onboarded');
  const hasStaples = get('staples').length > 0;

  // Don't show if already onboarded or has staples
  if (onboarded || hasStaples) return;

  // Don't show if arriving via a shared recipe deep link
  const hasDeepLink = window.location.hash.match(/^#r=\d+/) ||
    new URLSearchParams(window.location.search).get('r');
  if (hasDeepLink) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'obd-overlay';
  overlay.id = 'obdOverlay';
  overlay.innerHTML = _buildHTML();
  document.body.appendChild(overlay);

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
      _dismiss(overlay);
      return;
    }

    // Done button
    if (el.closest('[data-obd-done]')) {
      _dismiss(overlay);
      return;
    }
  });
}
