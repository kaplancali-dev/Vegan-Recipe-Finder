#!/usr/bin/env node
/**
 * fetch-missing-images.cjs
 *
 * Strategy: For each recipe missing an image, search Google Images
 * for the recipe title, grab the first real food image, download it,
 * upload to Supabase storage, and update recipes.json.
 *
 * Usage:
 *   cd v2
 *   SUPABASE_SERVICE_KEY="your-service-role-key" node fetch-missing-images.cjs
 *
 * Get the service role key from: Supabase Dashboard → Settings → API → service_role
 *
 * Requirements: Node 18+ (uses native fetch). No external dependencies.
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'recipe-images';
const RECIPES_PATH = path.join(__dirname, 'src/data/recipes.json');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Helpers ─────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Try to find an image from the recipe's actual URL page first.
 * Falls back to null if the page doesn't exist or has no OG image.
 */
async function findImageFromPage(pageUrl) {
  try {
    const resp = await fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;

    const html = await resp.text();

    // og:image
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) return ogMatch[1];

    // twitter:image
    const twMatch =
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch && twMatch[1]) return twMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Search Google Images for the recipe title and return the first image URL.
 */
async function searchGoogleImage(title) {
  const query = encodeURIComponent(`${title} vegan recipe`);
  const url = `https://www.google.com/search?q=${query}&tbm=isch&safe=active`;

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) return null;
    const html = await resp.text();

    // Google Images embeds image URLs in various formats
    // Look for high-res image URLs in the page source
    const imgMatches = html.match(/\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)",\d+,\d+\]/gi);
    if (imgMatches) {
      for (const m of imgMatches) {
        const urlMatch = m.match(/\["(https?:\/\/[^"]+)"/);
        if (urlMatch && urlMatch[1] && !urlMatch[1].includes('google') && !urlMatch[1].includes('gstatic')) {
          return urlMatch[1];
        }
      }
    }

    // Fallback: look for data URLs or other image patterns
    const altMatches = html.match(/(?:src|data-src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi);
    if (altMatches) {
      for (const m of altMatches) {
        const urlMatch = m.match(/"(https?:\/\/[^"]+)"/);
        if (
          urlMatch &&
          urlMatch[1] &&
          !urlMatch[1].includes('google') &&
          !urlMatch[1].includes('gstatic') &&
          !urlMatch[1].includes('favicon')
        ) {
          return urlMatch[1];
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Search Bing Images as an alternative.
 */
async function searchBingImage(title) {
  const query = encodeURIComponent(`${title} vegan recipe`);
  const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return null;

    const html = await resp.text();

    // Bing puts image URLs in m= parameter or data-src attributes
    const mMatches = html.match(/"murl":"(https?:\/\/[^"]+)"/gi);
    if (mMatches) {
      for (const m of mMatches) {
        const urlMatch = m.match(/"murl":"(https?:\/\/[^"]+)"/);
        if (urlMatch && urlMatch[1]) {
          return urlMatch[1];
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/** Download an image and return { buffer, contentType }. */
async function downloadImage(imgUrl) {
  try {
    const resp = await fetch(imgUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
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

/** Upload image buffer to Supabase storage. Returns public URL. */
async function uploadToSupabase(recipeId, buffer, contentType) {
  const ext = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';

  const filename = `${recipeId}.${ext}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`;

  try {
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
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
      console.error(`  Upload ${resp.status}: ${text.slice(0, 150)}`);
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
    console.error('ERROR: Set the SUPABASE_SERVICE_KEY environment variable.');
    console.error('');
    console.error('Usage:');
    console.error('  SUPABASE_SERVICE_KEY="eyJ..." node fetch-missing-images.cjs');
    console.error('');
    console.error('Get it from: Supabase Dashboard → Settings → API → service_role (secret)');
    process.exit(1);
  }

  console.log('Loading recipes...');
  const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));
  const missing = recipes.filter((r) => !r.img || r.img.trim() === '');

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

    // 1. Try the recipe's own URL first
    let imgUrl = await findImageFromPage(recipe.url);

    // 2. Try Bing image search
    if (!imgUrl) {
      imgUrl = await searchBingImage(recipe.title);
    }

    // 3. Try Google image search
    if (!imgUrl) {
      imgUrl = await searchGoogleImage(recipe.title);
    }

    if (!imgUrl) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — no image found`);
      failed++;
      failedList.push(recipe);
      await sleep(1000);
      continue;
    }

    // Download the image
    const img = await downloadImage(imgUrl);
    if (!img) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — download failed`);
      failed++;
      failedList.push(recipe);
      await sleep(1000);
      continue;
    }

    // Upload to Supabase
    const publicUrl = await uploadToSupabase(recipe.id, img.buffer, img.contentType);
    if (publicUrl) {
      const idx = recipes.findIndex((r) => r.id === recipe.id);
      if (idx !== -1) recipes[idx].img = publicUrl;
      console.log(`${progress} ✓ ${recipe.id} ${recipe.title}`);
      success++;

      // Save progress every 10 successful uploads
      if (success % 10 === 0) {
        fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));
        console.log(`  (saved progress — ${success} so far)`);
      }
    } else {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — upload failed`);
      failed++;
      failedList.push(recipe);
    }

    await sleep(1500); // Polite delay for search engines
  }

  // Final save
  fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${success} succeeded, ${failed} failed`);
  console.log(`recipes.json updated.\n`);

  if (failedList.length) {
    console.log('Failed recipes:');
    failedList.forEach((r) => console.log(`  ${r.id} ${r.title}`));
  }

  if (success > 0) {
    console.log('\nNext steps:');
    console.log('  1. npm run build');
    console.log('  2. cd .. && cp -r v2/dist/* .');
    console.log('  3. git add -A && git commit -m "Add recipe images" && git push');
  }
}

main().catch(console.error);
