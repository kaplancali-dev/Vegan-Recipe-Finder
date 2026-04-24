#!/usr/bin/env node
/**
 * fetch-missing-images.cjs
 *
 * Finds real recipe pages via DuckDuckGo, grabs OG images,
 * uploads to Supabase, updates recipes.json.
 *
 * Usage:
 *   cd v2
 *   SUPABASE_SERVICE_KEY='your-key-here' node fetch-missing-images.cjs
 *
 * IMPORTANT: Wrap the key in single quotes to avoid shell issues.
 * Get it from: Supabase Dashboard → Settings → API → service_role (secret)
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const BUCKET = 'recipe-images';
const RECIPES_PATH = path.join(__dirname, 'src/data/recipes.json');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Get key from env or command-line arg ─────────────────────
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Also accept as first argument: node fetch-missing-images.cjs <key>
if (!SUPABASE_KEY && process.argv[2]) {
  SUPABASE_KEY = process.argv[2];
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Step 1: Find a REAL recipe page via DuckDuckGo ──────────

async function findRealRecipeUrl(title) {
  const query = encodeURIComponent(`${title} vegan recipe`);
  // DuckDuckGo HTML search
  const url = `https://html.duckduckgo.com/html/?q=${query}`;

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;

    const html = await resp.text();

    // Extract result URLs — DDG HTML puts them in <a class="result__a" href="...">
    const matches = [...html.matchAll(/class="result__a"[^>]*href="([^"]+)"/gi)];
    for (const m of matches) {
      let resultUrl = m[1];
      // DDG wraps URLs in a redirect — extract the actual URL
      const uddg = resultUrl.match(/uddg=([^&]+)/);
      if (uddg) resultUrl = decodeURIComponent(uddg[1]);

      // Prefer known recipe blog domains
      if (
        resultUrl.includes('minimalistbaker.com') ||
        resultUrl.includes('noracooks.com') ||
        resultUrl.includes('ohsheglows.com') ||
        resultUrl.includes('cookieandkate.com') ||
        resultUrl.includes('lovingitvegan.com') ||
        resultUrl.includes('rainbowplantlife.com') ||
        resultUrl.includes('itdoesnttastelikechicken.com') ||
        resultUrl.includes('veganricha.com') ||
        resultUrl.includes('frommybowl.com') ||
        resultUrl.includes('forksoverknives.com') ||
        resultUrl.includes('thewokoflife.com') ||
        resultUrl.includes('maangchi.com') ||
        resultUrl.includes('budgetbytes.com') ||
        resultUrl.includes('food52.com') ||
        resultUrl.includes('epicurious.com') ||
        resultUrl.includes('tasty.co') ||
        resultUrl.includes('allrecipes.com') ||
        resultUrl.includes('simplyrecipes.com')
      ) {
        return resultUrl;
      }
    }

    // If no preferred domain, take first recipe-like result
    for (const m of matches) {
      let resultUrl = m[1];
      const uddg = resultUrl.match(/uddg=([^&]+)/);
      if (uddg) resultUrl = decodeURIComponent(uddg[1]);
      if (resultUrl.includes('recipe') || resultUrl.includes('cook')) {
        return resultUrl;
      }
    }

    // Last resort: first result
    if (matches.length > 0) {
      let resultUrl = matches[0][1];
      const uddg = resultUrl.match(/uddg=([^&]+)/);
      if (uddg) resultUrl = decodeURIComponent(uddg[1]);
      return resultUrl;
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Step 2: Get OG image from a real page ───────────────────

async function getOgImage(pageUrl) {
  try {
    const resp = await fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    if (!resp.ok) return null;

    const html = await resp.text();

    // og:image (both attribute orderings)
    const og =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (og?.[1]) return og[1];

    // twitter:image
    const tw =
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (tw?.[1]) return tw[1];

    // wp-content image fallback
    const wpMatch = html.match(/(?:src|data-src)=["'](https?:\/\/[^"']*wp-content\/uploads[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
    if (wpMatch?.[1]) return wpMatch[1];

    return null;
  } catch {
    return null;
  }
}

// ─── Step 3: Download image ──────────────────────────────────

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

// ─── Step 4: Upload to Supabase ──────────────────────────────

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
      console.error(`  Upload error ${resp.status}: ${text.slice(0, 150)}`);
      return null;
    }
  } catch (e) {
    console.error(`  Upload error: ${e.message}`);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_KEY) {
    console.error(`
ERROR: No Supabase service role key provided.

Usage (pick one):

  # Option 1: Environment variable (wrap in single quotes!)
  SUPABASE_SERVICE_KEY='eyJhbG...' node fetch-missing-images.cjs

  # Option 2: Command-line argument
  node fetch-missing-images.cjs 'eyJhbG...'

Get the key from: Supabase Dashboard → Settings → API → service_role (secret)
`);
    process.exit(1);
  }

  // Validate key format
  if (!SUPABASE_KEY.startsWith('eyJ')) {
    console.error('ERROR: Key does not look like a JWT (should start with "eyJ").');
    console.error('Make sure you copied the full service_role key from Supabase.');
    process.exit(1);
  }

  console.log(`Key starts with: ${SUPABASE_KEY.substring(0, 15)}...`);
  console.log(`Key length: ${SUPABASE_KEY.length} chars\n`);

  // Quick upload test
  console.log('Testing Supabase upload permission...');
  const testBuf = Buffer.from('test');
  try {
    const testResp = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/_test.txt`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'text/plain',
        'x-upsert': 'true',
      },
      body: testBuf,
      signal: AbortSignal.timeout(10000),
    });
    if (testResp.ok) {
      console.log('✓ Supabase upload works!\n');
      // Clean up test file
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/_test.txt`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
      }).catch(() => {});
    } else {
      const errText = await testResp.text();
      console.error(`✗ Supabase upload FAILED: ${testResp.status} ${errText.slice(0, 150)}`);
      console.error('\nMake sure you are using the service_role key (not anon key).');
      console.error('Find it at: Supabase Dashboard → Settings → API → service_role\n');
      process.exit(1);
    }
  } catch (e) {
    console.error(`✗ Could not reach Supabase: ${e.message}`);
    process.exit(1);
  }

  console.log('Loading recipes...');
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
  const failedList = [];

  for (let i = 0; i < missing.length; i++) {
    const recipe = missing[i];
    const progress = `[${i + 1}/${missing.length}]`;

    // 1. Search DuckDuckGo for a real recipe page
    const realUrl = await findRealRecipeUrl(recipe.title);
    if (!realUrl) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — no search results`);
      failed++;
      failedList.push(recipe);
      await sleep(2000);
      continue;
    }

    // 2. Get OG image from that real page
    const imgUrl = await getOgImage(realUrl);
    if (!imgUrl) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — no OG image at ${new URL(realUrl).hostname}`);
      failed++;
      failedList.push(recipe);
      await sleep(1500);
      continue;
    }

    // 3. Download the image
    const img = await downloadImage(imgUrl);
    if (!img) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — image download failed`);
      failed++;
      failedList.push(recipe);
      await sleep(1000);
      continue;
    }

    // 4. Upload to Supabase
    const publicUrl = await uploadToSupabase(recipe.id, img.buffer, img.contentType);
    if (publicUrl) {
      const idx = recipes.findIndex(r => r.id === recipe.id);
      if (idx !== -1) recipes[idx].img = publicUrl;
      console.log(`${progress} ✓ ${recipe.id} ${recipe.title} (${(img.buffer.length / 1024).toFixed(0)}KB)`);
      success++;

      if (success % 10 === 0) {
        fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));
        console.log(`  (saved progress — ${success} images so far)`);
      }
    } else {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — upload failed`);
      failed++;
      failedList.push(recipe);
    }

    await sleep(2000); // Be polite to DuckDuckGo
  }

  fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${success} succeeded, ${failed} failed`);
  console.log(`recipes.json updated.\n`);

  if (failedList.length) {
    console.log(`Failed recipes (${failedList.length}):`);
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
