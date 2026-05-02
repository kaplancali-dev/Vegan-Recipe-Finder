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
  { label: '🫘 Proteins & Legumes', items: [
    'chickpeas','black beans','lentils','kidney beans','white beans',
    'tofu','tempeh','edamame','hemp seeds','chia seeds','flax seeds',
    'tahini','cashews',
  ]},
  { label: '🌾 Grains & Starches', items: [
    'pasta','rice','quinoa','oats','potatoes','sweet potatoes',
    'corn tortillas','rice noodles','breadcrumbs',
  ]},
  { label: '🥦 Vegetables', items: [
    'garlic','onions','carrots','broccoli','spinach','kale',
    'tomatoes','bell peppers','mushrooms','avocado','zucchini',
    'corn','cucumber','green onions','cauliflower','cabbage',
  ]},
  { label: '🍋 Fruits', items: [
    'lemon','lime','banana','berries','dates',
  ]},
  { label: '🫙 Pantry & Oils', items: [
    'olive oil','coconut oil','sesame oil','soy sauce',
    'vegetable broth','coconut milk','maple syrup','canned tomatoes',
    'tomato paste','nutritional yeast','apple cider vinegar',
    'rice vinegar','dijon mustard','miso paste','vegan mayo',
  ]},
  { label: '🌿 Spices & Herbs', items: [
    'salt','black pepper','garlic powder','onion powder','cumin',
    'smoked paprika','cinnamon','chili powder','ginger','curry powder',
    'oregano','basil','thyme','cayenne','turmeric','red pepper flakes',
    'garam masala',
  ]},
  { label: '🥜 Nuts & Milks', items: [
    'peanut butter','plant milk','almonds','walnuts',
  ]},
  { label: '🍨 Baking', items: [
    'vanilla extract','cocoa powder','baking soda','baking powder',
    'cornstarch','coconut cream','vegan butter',
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

/* ── State ──────────────────────────────────────────────────── */

const _staplesPicked = new Set();
const _allergiesPicked = new Set();
let _currentStep = 1;

/* ── Render ─────────────────────────────────────────────────── */

function _buildStapleChips() {
  return STAPLE_SECTIONS.map(sec => `
    <div class="obd-cat-label">${escHTML(sec.label)}</div>
    <div class="obd-chips">
      ${sec.items.map(item =>
        `<span class="obd-chip" data-obd-staple="${escHTML(item)}">${escHTML(item)}</span>`
      ).join('')}
    </div>
  `).join('');
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
        <div class="obd-hook">Your fridge is judging you behind closed doors.<br>It goes full <em>Mean Girls</em> when you're not around.<br>We can fix that.</div>
        <div class="obd-sub">Tell us what's lurking in there — the sad half-onion, the mystery jar, the kale you bought with good intentions — and we'll match you to plant-based recipes you can actually make tonight.</div>
        <div class="obd-stat">Takes about a minute. Unlocks 4,500+ recipes from the world's top plant-based cooks.</div>
        <button class="obd-btn obd-btn-primary" data-obd-go="2">Let's go</button><br>
        <button class="obd-btn-skip" data-obd-skip>Skip — I trust my chaos <span class="obd-skip-note">(you can come back anytime)</span></button>
      </div>

      <!-- STEP 2: Staples -->
      <div class="obd-step" data-obd-step="2">
        <div class="obd-title">What's always in your kitchen?</div>
        <div class="obd-sub">Tap everything you usually have on hand.
          Don't overthink it — you can change these anytime.</div>
        <div id="obdStaples">${_buildStapleChips()}</div>
        <div id="obdStapleCount" class="obd-count"></div>
        <button class="obd-btn obd-btn-primary" data-obd-go="3">Next — Allergies</button><br>
        <button class="obd-btn-skip" data-obd-go="4">No allergies, skip ahead</button>
      </div>

      <!-- STEP 3: Allergies -->
      <div class="obd-step" data-obd-step="3">
        <div class="obd-title">Any ingredients to avoid?</div>
        <div class="obd-sub">We'll filter these out of every recipe. Tap any that apply — or skip if none.</div>
        <div class="obd-chips" style="justify-content:center">
          ${_buildAllergenChips()}
        </div>
        <button class="obd-btn obd-btn-primary" data-obd-go="4">See my recipes</button>
      </div>

      <!-- STEP 4: Done -->
      <div class="obd-step" data-obd-step="4">
        <div style="font-size:2.5rem;margin-bottom:4px">🎉</div>
        <div class="obd-title">Your pantry is ready!</div>
        <div class="obd-sub" style="font-size:1rem">Your selections have been saved.
          HARVEST will now match you to recipes based on what you have.</div>
        <div style="font-size:.85rem;color:var(--ink-soft);line-height:1.5;margin-bottom:12px">
          Add fresh items anytime under <strong>My Pantry</strong> to unlock even more recipes.</div>
        <button class="obd-btn obd-btn-primary" data-obd-done>Start cooking</button>
      </div>
    </div>
  `;
}

/* ── Step navigation ────────────────────────────────────────── */

function _goToStep(overlay, step) {
  _currentStep = step;

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
