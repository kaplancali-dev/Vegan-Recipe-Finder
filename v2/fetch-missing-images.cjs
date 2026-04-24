#!/usr/bin/env node
/**
 * fetch-missing-images.cjs
 *
 * Finds all recipes missing images, scrapes the OG image from each
 * recipe URL, uploads it to Supabase storage, and updates recipes.json.
 *
 * Usage:  cd v2 && node fetch-missing-images.cjs
 *
 * Requirements: Node 18+ (uses native fetch). No external dependencies.
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTQ3MTEsImV4cCI6MjA1OTI5MDcxMX0.tgEx0FXMAq4JhP1qxPcEu4OJYEa83B-xVvhMp8Bk0P8';
const BUCKET = 'recipe-images';
const RECIPES_PATH = path.join(__dirname, 'src/data/recipes.json');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ─── Helpers ─────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Extract og:image or twitter:image from raw HTML using regex.
 * No external dependencies needed.
 */
function extractImageFromHtml(html) {
  // 1. og:image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch && ogMatch[1]) return ogMatch[1];

  // 2. twitter:image
  const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twMatch && twMatch[1]) return twMatch[1];

  // 3. First large wp-content/uploads image
  const imgRegex = /<img[^>]+(?:src|data-src)=["']([^"']*(?:wp-content|uploads)[^"']+)["']/gi;
  let m;
  while ((m = imgRegex.exec(html))) {
    const src = m[1];
    if (!src.toLowerCase().includes('logo') && !src.toLowerCase().includes('icon')) {
      return src;
    }
  }

  return null;
}

/** Fetch a recipe page and return the best image URL found. */
async function findImageUrl(pageUrl) {
  try {
    const resp = await fetch(pageUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    return extractImageFromHtml(html);
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
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 1000) return null;

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
      console.error(`  Upload ${resp.status}: ${text.slice(0, 120)}`);
      return null;
    }
  } catch (e) {
    console.error(`  Upload error: ${e.message}`);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
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

    // 1. Find image URL on recipe page
    const imgUrl = await findImageUrl(recipe.url);
    if (!imgUrl) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — no image found`);
      failed++;
      failedList.push(recipe);
      await sleep(500);
      continue;
    }

    // 2. Download the image
    const img = await downloadImage(imgUrl);
    if (!img) {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — download failed`);
      failed++;
      failedList.push(recipe);
      await sleep(500);
      continue;
    }

    // 3. Upload to Supabase
    const publicUrl = await uploadToSupabase(recipe.id, img.buffer, img.contentType);
    if (publicUrl) {
      const idx = recipes.findIndex((r) => r.id === recipe.id);
      if (idx !== -1) recipes[idx].img = publicUrl;
      console.log(`${progress} ✓ ${recipe.id} ${recipe.title}`);
      success++;
    } else {
      console.log(`${progress} ✗ ${recipe.id} ${recipe.title} — upload failed`);
      failed++;
      failedList.push(recipe);
    }

    await sleep(800);
  }

  // Save updated recipes.json
  fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! ${success} succeeded, ${failed} failed`);
  console.log(`recipes.json updated.\n`);

  if (failedList.length) {
    console.log('Failed recipes:');
    failedList.forEach((r) => console.log(`  ${r.id} ${r.title} — ${r.url}`));
  }

  console.log('\nNext steps:');
  console.log('  1. npm run build');
  console.log('  2. cd .. && cp -r v2/dist/* .');
  console.log('  3. git add -A && git commit -m "Add recipe images" && git push');
}

main().catch(console.error);
