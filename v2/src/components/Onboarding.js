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
  { label: '🫘 Beans & Legumes', sub: 'keep your muscles happy', items: [
    'chickpeas','black beans','lentils','kidney beans',
    'cannellini beans','great northern beans','navy beans','butter beans','lima beans','pinto beans',
    'mung beans',
    'split peas','black-eyed peas',
    'firm tofu',
    'extra-firm tofu',
    'soft tofu',
    'silken tofu',
    'tempeh','edamame',
    'jackfruit',
    'TVP','soy curls',
  ]},
  // 1 — Grains & Starches (GLUTEN-FREE — HARVEST is GF by default)
  { label: '🌾 Grains & Starches', sub: 'the carb committee', items: [
    'GF pasta (any)','rice (any)',
    'quinoa',
    'oats','millet','sweet potatoes','potatoes',
    'corn tortillas',
    'polenta',
    'cornmeal',
    'masa harina',
    'buckwheat',
    'rice noodles','glass noodles','nori',
    'gnocchi',
    'GF bread','GF breadcrumbs','GF tortillas',
  ]},
  // 2 — Vegetables
  { label: '🥦 Vegetables', sub: 'go crazy. not literally.', items: [
    'garlic',
    'yellow onion','white onion','red onion','fresh ginger','spinach',
    'kale',
    'carrots','celery','broccoli','cauliflower','bell peppers',
    'mushrooms (any)','tomatoes','cherry tomatoes',
    'avocado',
    'zucchini','corn','cucumber','green onions','eggplant','cabbage',
    'butternut squash','pumpkin','pumpkin puree','arugula','leeks','collard greens',
    'lettuce (any)','green beans','asparagus','green peas','brussels sprouts',
    'parsnips','swiss chard','bok choy','turnip','pickles','okra','jicama',
    'kimchi',
    'jalapeño',
    'green chili',
    'beets','radishes','artichoke hearts','bean sprouts','bamboo shoots','shallots',
  ]},
  // 3 — Fruits
  { label: '🍋 Fruits', sub: "nature's candy", items: [
    'lemon','lime','banana','berries (any)','cranberries','cherries',
    'mango','apple','oranges','orange juice','pineapple','peaches','pears',
    'kiwi','papaya',
    'pomegranate',
    'plantain','figs','grapes','watermelon','coconut',
    'dates',
    'raisins','dried apricots',
    'date paste',
  ]},
  // 4 — Nuts & Seeds
  { label: '🥜 Nuts & Seeds', sub: 'fats, fiber, protein. trifecta.', items: [
    'nut butter (any)',
    'cashews',
    'almonds','walnuts','pecans','brazil nuts','macadamia nuts','hazelnuts',
    'pistachio','peanuts','sesame seeds','pine nuts',
    'tahini',
    'hemp seeds',
    'chia seeds',
    'flax seeds','pumpkin seeds','sunflower seeds','protein powder',
  ]},
  // 5 — Plant-Based Dairy
  { label: '🥛 Plant-Based Dairy', sub: "regular dairy is for their offspring, not you. honest.", items: [
    'almond milk','soy milk','rice milk','hemp milk',
    'macadamia milk','pistachio milk',
    'oat milk',
    'cashew milk','vegan yogurt','vegan cream cheese','vegan parmesan','vegan feta','vegan cheese',
    'nutritional yeast', // cross-listed: cheese substitute role
  ]},
  // 6 — Oils & Fats
  { label: '🫒 Oils & Fats', sub: 'the slip-and-slide section', items: [
    'olive oil','coconut oil','avocado oil',
    'sesame oil',
    'chili oil',
    'vegan butter',
    'vegetable oil',
    'toasted sesame oil',
    'sunflower oil','grapeseed oil','peanut oil',
  ]},
  // 7 — Canned & Jarred (these were here, now adding salsa/hummus/wine/wine vinegar to existing)

  { label: '🥫 Canned & Jarred', sub: 'shelf-stable MVPs', items: [
    'canned tomatoes (any)','tomato sauce','tomato paste','vegetable broth',
    'coconut milk',
    'olives','artichoke hearts','roasted red peppers',
    'sun-dried tomatoes',
    'capers','salsa','hummus','sauerkraut','instant coffee','cooking spray',
    'hearts of palm','yellow cornmeal',
  ]},
  // 8 — Sauces & Condiments (GLUTEN-FREE focus — items where most brands
  // contain wheat/malt have a "verify GF" hint. Users with certified GF
  // versions can confidently select them.)
  { label: '🫙 Sauces & Condiments', sub: 'the personality section', items: [
    'tamari / coconut aminos','miso paste','vegan mayo',
    'ketchup','yellow mustard','dijon mustard',
    'BBQ sauce',
    'hoisin sauce',
    'vegan worcestershire',
    'tamarind paste','harissa paste',
    'gochujang',
    'sriracha / hot sauce','sambal oelek','curry paste',
    'liquid smoke',
    'vegan sour cream',
    'nutritional yeast',
    // Cross-listed from other sections (nut butters, tahini for sauces;
    // cornstarch/arrowroot for thickening)
    'tahini',
    'nut butter (any)','cornstarch','arrowroot powder',
  ]},
  // 9 — Sweeteners & Vinegars
  { label: '🍯 Sweeteners & Vinegars', sub: 'the sweet-and-sour squad', items: [
    'maple syrup',
    'natural sweetener (any)','agave nectar','coconut sugar','brown sugar','cane sugar','powdered sugar',
    'date syrup','molasses','coconut nectar',
    'allulose',
    'stevia / monk fruit',
    'apple cider vinegar','rice vinegar','balsamic vinegar',
    'white vinegar','red wine vinegar','white wine vinegar','sherry vinegar',
    'red wine',
    'white wine',
  ]},
  // 10 — Baking & Flours (GLUTEN-FREE ONLY — HARVEST is GF by default)
  { label: '🧂 Baking & Flours', sub: 'for your ambitious Sunday self', items: [
    'baking soda','baking powder','cornstarch','arrowroot powder',
    'gluten-free flour','almond flour',
    'coconut flour',
    'oat flour',
    'tapioca flour','brown rice flour','chickpea flour','cassava flour',
    'flaxseed meal','applesauce',
    'aquafaba',
    'agar powder',
    'psyllium husk',
    'xanthan gum',
    'almond extract','matcha',
    'cream of tartar','active dry yeast','protein powder',
    // Cross-listed from Dessert Pantry / Oils & Fats — every baker
    // reaches for these
    'vanilla extract','cocoa powder','coconut oil','vegan butter',
  ]},
  // 11 — Spices & Herbs
  { label: '🌿 Spices & Herbs', sub: 'the flavor council', items: [
    'turmeric','cumin',
    'smoked paprika',
    'cinnamon','chili powder','ginger','curry powder',
    'black pepper','garlic powder','onion powder',
    'oregano','basil','thyme','sage','coriander','cayenne',
    'cilantro','parsley','white pepper','pumpkin pie spice','taco seasoning',
    'cumin seeds','coriander seeds','mustard seeds','poppy seeds','caraway seeds',
    'cardamom','cloves','allspice','bay leaves','five spice','nutmeg',
    'sea salt','poultry seasoning','saffron','za\'atar','berbere',
    'garam masala',
    'lemongrass','star anise','dill','mint','chives','rosemary',
    'red pepper flakes','fennel seeds',
    'sumac',
    'italian seasoning',
  ]},
  // 12 — Dessert Pantry
  { label: '🍨 Dessert Pantry', sub: 'encore! encore! encore!', items: [
    'vanilla extract','almond extract','cocoa powder',
    'chocolate chips (any)','white chocolate chips','dark chocolate',
    'cacao nibs',
    'cacao butter',
    'coconut milk',
    'coconut cream',
    'coconut oil','shredded coconut','almond flour',
    // Cross-listed from Sweeteners (sweeteners that ARE the dessert
    // building blocks, not just garnishes)
    'maple syrup','dates','brown sugar','molasses',
    // Cross-listed from Spices (the dessert spices)
    'cinnamon','nutmeg',
    'date sugar',
    'allulose',
    'stevia / monk fruit',
  ]},
  // 13 — Asian Specialty (GF-safe items only)
  // EXCLUDED: shaoxing wine (traditional contains wheat — celiac safety)
  // VERIFY LABELS: vegan oyster sauce, mirin (some brands have wheat additives)
  { label: '🍱 Asian Specialty', sub: 'unlock Japanese, Korean, Chinese & Indian recipes', items: [
    'mirin',
    'gochugaru',
    'vegan oyster sauce',
    'shichimi togarashi',
    'furikake',
    'kombu',
    'kala namak',
    'curry leaves',
    'galangal',
    'fenugreek',
    'fenugreek seeds',
    'chana dal',
    'gochujang paste',
    'wasabi',
    'vegan fish sauce',
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

/* ── State ──────────────────────────────────────────────────── */

const _staplesPicked = new Set();
const _allergiesPicked = new Set();
let _currentStep = 1;
let _currentSubPage = 0;

/* ── Render ─────────────────────────────────────────────────── */

/**
 * Build the "Already used HARVEST? Sync your pantry" hint.
 *
 * Only rendered when the app is running as an installed PWA
 * (iOS Safari standalone or display-mode: standalone). Browser-tab
 * visitors never see it. Targets the iOS edge case where Safari
 * localStorage and the installed PWA's localStorage are separate
 * sandboxes — so a returning user who installs the app appears as
 * a brand-new user with an empty pantry. Cloud Sync is the bridge.
 */
function _buildSyncHint() {
  const isStandalone =
    window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (!isStandalone) return '';
  return `
    <button class="obd-sync-hint" data-obd-sync-hint type="button" aria-label="Sync pantry from another device">
      <span class="obd-sync-hint-text">
        <strong>Already used HARVEST?</strong>
        <span>Sync your pantry from another device →</span>
      </span>
      <span class="obd-sync-hint-icon" aria-hidden="true">⤓</span>
    </button>
  `;
}

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
        ${_buildSyncHint()}
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
          <strong>Two quick minutes.</strong> We show you which of the <strong>4,000+ gluten-free recipes</strong> you can cook <em>tonight</em>, and which need just one more ingredient. Let's go.
        </div>
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
        <div class="obd-title">Anything your body, or anyone at your table, vetoes?</div>
        <div class="obd-sub">We'll keep those out of every recipe. Throat closing up is not a vibe.</div>
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
        <button class="obd-home-hint" data-obd-install-help type="button" aria-label="Show me how to install HARVEST">
          <div class="hv-home-tile" aria-hidden="true">
            <img class="hv-app-icon" src="/icon-192.png" alt="">
            <span class="hv-home-tile__label">HARVEST</span>
          </div>
          <span class="obd-home-hint__text">
            <strong>Get HARVEST on your home screen.</strong>
            <span class="obd-home-hint__cta">Show me how →</span>
          </span>
        </button>
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

    // Install help pill on Step 4 — open platform-appropriate install
    // instructions WITHOUT dismissing onboarding. Mobile users get the
    // step-by-step (Share → Add to Home Screen); desktop users get the
    // QR modal so they can scan with their phone.
    if (el.closest('[data-obd-install-help]')) {
      const ua = navigator.userAgent;
      const isMobile = /iPad|iPhone|iPod|Android/.test(ua);
      if (isMobile) {
        import('./InstallPrompt.js').then(m => m.showMobileInstallInstructions());
      } else {
        import('./InstallCardDesktop.js').then(m => m.openDesktopInstallModal());
      }
      return;
    }

    // Sync hint — fade out onboarding (without marking onboarded) and
    // jump to Cloud Sync. We intentionally do NOT call _dismiss() here,
    // because that sets onboarded=true. If the user bails out of sync,
    // onboarding should appear again next launch. If sync succeeds,
    // cloudPull will hydrate `onboarded` + `staples` from the cloud,
    // which then suppresses onboarding via the existing gate.
    if (el.closest('[data-obd-sync-hint]')) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        if (typeof onDismiss === 'function') onDismiss();
        if (typeof window.__openCloudSync === 'function') {
          window.__openCloudSync();
        }
      }, 350);
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
