#!/usr/bin/env node
/**
 * fetch-missing-images.cjs
 *
 * Strategy:
 *   1. Try the recipe's own URL for an OG image (some are real)
 *   2. Fall back to Pexels API (free, reliable, designed for this)
 *
 * Setup:
 *   1. Put your Supabase service_role key in v2/.supabase-key
 *   2. Put your Pexels API key in v2/.pexels-key
 *      (Get one free at https://www.pexels.com/api/)
 *   3. Run: node fetch-missing-images.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const BUCKET = 'recipe-images';
const RECIPES_PATH = path.join(__dirname, 'src/data/recipes.json');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Load keys from files ────────────────────────────────────
function loadKey(filename) {
  try {
    return fs.readFileSync(path.join(__dirname, filename), 'utf8').trim();
  } catch { return null; }
}

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || loadKey('.supabase-key');
const PEXELS_KEY = process.env.PEXELS_KEY || loadKey('.pexels-key');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Strategy 1: Try the recipe's own URL ────────────────────

async function getOgImageFromUrl(pageUrl) {
  try {
    const resp = await fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;

    const html = await resp.text();

    const og =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (og && og[1]) return og[1];

    const tw =
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (tw && tw[1]) return tw[1];

    return null;
  } catch {
    return null;
  }
}

// ─── Strategy 2: Pexels API search ──────────────────────────

async function searchPexels(query) {
  if (!PEXELS_KEY) return null;

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const resp = await fetch(url, {
      headers: { 'Authorization': PEXELS_KEY },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        console.log('  (Pexels rate limit — waiting 30s)');
        await sleep(30000);
        return searchPexels(query); // retry once
      }
      return null;
    }

    const data = await resp.json();
    if (data.photos && data.photos.length > 0) {
      // Use the medium-sized image (good balance of quality/size)
      return data.photos[0].src.medium;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Download image ─────────────────────────────────────────

async function downloadImage(imgUrl) {
  try {
    const resp = await fetch(imgUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;

    const ct = resp.headers.get('content-type') || 'image/jpeg';
    if (!ct.startsWith('image/')) return null;

    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 2000) return null;

    return { buffer: buf, contentType: ct };
  } catch {
    return null;
  }
}

// ─── Upload to Supabase ─────────────────────────────────────

async function uploadToSupabase(recipeId, buffer, contentType) {
  const ext = contentType.includes('png') ? 'png'
    : contentType.includes('webp') ? 'webp'
    : 'jpg';

  const filename = `${recipeId}.${ext}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`;

  try {
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
      signal: AbortSignal.timeout(30000),
    });

    if (resp.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
    } else {
      const text = await resp.text();
      console.error(`  Upload error ${resp.status}: ${text.slice(0, 100)}`);
      return null;
    }
  } catch (e) {
    console.error(`  Upload error: ${e.message}`);
    return null;
  }
}

// ─── Build a good search query for Pexels ───────────────────

function buildSearchQuery(title) {
  // Remove common prefixes that don't help image search
  let q = title
    .replace(/^(Vegan|Raw|Instant Pot|Gluten-Free)\s+/i, '')
    .replace(/\(.*?\)/g, '')  // Remove parenthetical
    .trim();

  // Add "vegan food" to help get food-specific results
  return q + ' vegan food';
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_KEY) {
    console.error('ERROR: No Supabase key. Put it in v2/.supabase-key');
    process.exit(1);
  }
  if (!PEXELS_KEY) {
    console.error(`
ERROR: No Pexels API key found.

Setup:
  1. Go to https://www.pexels.com/api/ and sign up (free)
  2. Copy your API key
  3. Save it: echo "YOUR_KEY" > .pexels-key
  4. Run: node fetch-missing-images.cjs
`);
    process.exit(1);
  }

  // Test Supabase upload
  console.log('Testing Supabase upload...');
  const testResp = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/_test.txt`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'text/plain',
      'x-upsert': 'true',
    },
    body: Buffer.from('test'),
    signal: AbortSignal.timeout(10000),
  });
  if (testResp.ok) {
    console.log('✓ Supabase upload works!');
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/_test.txt`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
    }).catch(() => {});
  } else {
    console.error('✗ Supabase upload failed. Check your service_role key.');
    process.exit(1);
  }

  // Test Pexels API
  console.log('Testing Pexels API...');
  const pxTest = await fetch('https://api.pexels.com/v1/search?query=food&per_page=1', {
    headers: { 'Authorization': PEXELS_KEY },
    signal: AbortSignal.timeout(10000),
  });
  if (pxTest.ok) {
    console.log('✓ Pexels API works!\n');
  } else {
    console.error('✗ Pexels API failed. Check your API key.');
    process.exit(1);
  }

  const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));
  const missing = recipes.filter(r => !r.img || r.img.trim() === '');

  console.log(`Total recipes: ${recipes.length}`);
  console.log(`Missing images: ${missing.length}\n`);

  if (!missing.length) {
    console.log('All recipes have images!');
    return;
  }

  let success = 0;
  let failed = 0;
  let fromUrl = 0;
  let fromPexels = 0;
  const failedList = [];

  for (let i = 0; i < missing.length; i++) {
    const recipe = missing[i];
    const progress = `[${i + 1}/${missing.length}]`;

    let imgUrl = null;
    let source = '';

    // Strategy 1: Try the recipe's own URL
    imgUrl = await getOgImageFromUrl(recipe.url);
    if (imgUrl) {
      source = 'page';
    }

    // Strategy 2: Pexels API
    if (!imgUrl) {
      const query = buildSearchQuery(recipe.title);
      imgUrl = await searchPexels(query);
      if (imgUrl) source = 'pexels';
    }

    if (!imgUrl) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — no image found`);
      failed++;
      failedList.push(recipe);
      await sleep(500);
      continue;
    }

    // Download
    const img = await downloadImage(imgUrl);
    if (!img) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — download failed`);
      failed++;
      failedList.push(recipe);
      await sleep(500);
      continue;
    }

    // Upload to Supabase
    const publicUrl = await uploadToSupabase(recipe.id, img.buffer, img.contentType);
    if (publicUrl) {
      const idx = recipes.findIndex(r => r.id === recipe.id);
      if (idx !== -1) recipes[idx].img = publicUrl;
      if (source === 'page') fromUrl++;
      if (source === 'pexels') fromPexels++;
      console.log(`${progress} ✓ ${recipe.id} ${recipe.title} (${source}, ${(img.buffer.length / 1024).toFixed(0)}KB)`);
      success++;

      if (success % 10 === 0) {
        fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));
        console.log(`  (progress saved — ${success} images)`);
      }
    } else {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — upload failed`);
      failed++;
      failedList.push(recipe);
    }

    await sleep(1000);
  }

  fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${success} succeeded (${fromUrl} from recipe pages, ${fromPexels} from Pexels)`);
  console.log(`${failed} failed`);
  console.log(`recipes.json updated.\n`);

  if (failedList.length) {
    console.log(`Failed (${failedList.length}):`);
    failedList.forEach(r => console.log(`  ${r.id} ${r.title}`));
  }

  if (success > 0) {
    console.log('\nNext steps:');
    console.log('  1. npm run build');
    console.log('  2. cd .. && cp -r v2/dist/* .');
    console.log('  3. git add -A && git commit -m "Add recipe images" && git push');
  }
}

main().catch(console.error);
