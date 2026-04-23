#!/usr/bin/env node
/**
 * Fetch hero images for all recipes missing them and upload to Supabase.
 *
 * Usage:  node fetch-new-images.js
 *
 * What it does for each recipe with an empty `img` field:
 * 1. Fetches the recipe page HTML
 * 2. Extracts the hero image from JSON-LD, og:image, or twitter:image
 * 3. Downloads the image (with retries)
 * 4. Uploads to Supabase storage as {id}.jpg (with upsert)
 * 5. Updates recipes.json immediately (progress saved after each image)
 *
 * After all images are processed, it automatically:
 * - Rebuilds the app (npm run build)
 * - Copies dist to repo root
 * - Commits and pushes to GitHub
 *
 * Run from the repo root. Requires Node 18+.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Mjc3MjcsImV4cCI6MjA5MjIwMzcyN30.6kVwmiSaFHWg1Qq1ZWj3HsMXt39GGk77O4Ma4KFim9M';
const RECIPES_PATH = path.join(__dirname, 'v2', 'src', 'data', 'recipes.json');
const MAX_RETRIES = 3;

/* ── HTTP helpers ──────────────────────────────────────────── */

function fetchBinary(url, redirectCount = 0) {
  if (redirectCount > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetchBinary(next, redirectCount + 1).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        body: Buffer.concat(chunks),
        contentType: res.headers['content-type'] || ''
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchBinary(url);
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(2000 * (i + 1)); // Exponential backoff
    }
  }
}

/* ── Image extraction ──────────────────────────────────────── */

function extractImageUrl(html) {
  // Try JSON-LD first (most reliable)
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      const recipe = data['@type'] === 'Recipe' ? data :
        (data['@graph'] || []).find(g => g['@type'] === 'Recipe');
      if (recipe && recipe.image) {
        const img = typeof recipe.image === 'string' ? recipe.image :
          Array.isArray(recipe.image) ? (typeof recipe.image[0] === 'string' ? recipe.image[0] : recipe.image[0]?.url) :
          recipe.image.url;
        if (img) return img;
      }
    } catch (e) {}
  }

  // Fallback: og:image (both attribute orders)
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/) ||
                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/);
  if (ogMatch) return ogMatch[1];

  // Fallback: twitter:image
  const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/) ||
                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/);
  if (twMatch) return twMatch[1];

  return null;
}

/* ── Supabase upload ───────────────────────────────────────── */

function uploadToSupabase(imageBuffer, contentType, recipeId) {
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const filePath = `${recipeId}.${ext}`;

  return new Promise((resolve, reject) => {
    const parsed = new URL(`${SUPABASE_URL}/storage/v1/object/recipe-images/${filePath}`);
    const req = https.request({
      hostname: parsed.hostname, path: parsed.pathname, method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'apikey': SUPABASE_ANON,
        'Content-Type': contentType || 'image/jpeg',
        'Content-Length': imageBuffer.length,
        'x-upsert': 'true',
      },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(`${SUPABASE_URL}/storage/v1/object/public/recipe-images/${filePath}`);
        } else {
          reject(new Error(`Upload failed (${res.statusCode}): ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Upload timed out')); });
    req.write(imageBuffer);
    req.end();
  });
}

/* ── Utilities ─────────────────────────────────────────────── */

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveRecipes(recipes) {
  fs.writeFileSync(RECIPES_PATH, JSON.stringify(recipes));
}

/* ── Main ──────────────────────────────────────────────────── */

async function main() {
  console.log('🌱 HARVEST Image Fetcher');
  console.log('━'.repeat(50));

  const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));
  const needImages = recipes.filter(r => !r.img || !r.img.trim());

  if (!needImages.length) {
    console.log('✅ All recipes already have images!');
    return;
  }

  console.log(`Found ${needImages.length} recipes needing images.\n`);

  let success = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < needImages.length; i++) {
    const recipe = needImages[i];
    const progress = `[${i + 1}/${needImages.length}]`;
    process.stdout.write(`${progress} ${recipe.title}... `);

    try {
      // 1. Fetch the recipe page
      const pageRes = await fetchWithRetry(recipe.url);
      if (pageRes.status !== 200) {
        console.log(`❌ Page returned ${pageRes.status}`);
        failed.push({ id: recipe.id, title: recipe.title, reason: `HTTP ${pageRes.status}` });
        fail++;
        await sleep(1500);
        continue;
      }

      const html = pageRes.body.toString();

      // 2. Extract image URL
      const imageUrl = extractImageUrl(html);
      if (!imageUrl) {
        console.log('❌ No image found in page');
        failed.push({ id: recipe.id, title: recipe.title, reason: 'No image in HTML' });
        fail++;
        await sleep(1500);
        continue;
      }

      // 3. Download image
      const imgData = await fetchWithRetry(imageUrl);
      if (imgData.status !== 200 || imgData.body.length < 1000) {
        console.log(`❌ Image download failed (${imgData.status}, ${imgData.body.length} bytes)`);
        failed.push({ id: recipe.id, title: recipe.title, reason: 'Image download failed' });
        fail++;
        await sleep(1500);
        continue;
      }

      // 4. Upload to Supabase
      const publicUrl = await uploadToSupabase(imgData.body, imgData.contentType, recipe.id);

      // 5. Update recipe and save immediately (progress preserved)
      recipe.img = publicUrl;
      saveRecipes(recipes);

      const sizeKB = Math.round(imgData.body.length / 1024);
      console.log(`✅ (${sizeKB}KB)`);
      success++;

    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed.push({ id: recipe.id, title: recipe.title, reason: err.message });
      fail++;
    }

    // Rate limit: 1.5s between requests to be polite
    await sleep(1500);
  }

  // Summary
  console.log('\n' + '━'.repeat(50));
  console.log(`✅ ${success} images uploaded`);
  console.log(`❌ ${fail} failed`);

  if (failed.length) {
    console.log('\nFailed recipes:');
    failed.forEach(f => console.log(`  [${f.id}] ${f.title} — ${f.reason}`));
    console.log('\nRe-run this script to retry failed recipes.');
  }

  if (success > 0) {
    console.log('\n🔨 Building and deploying...');
    try {
      execSync('cd v2 && npm run build', { stdio: 'inherit' });
      execSync('rm -f assets/index-*.js assets/index-*.css assets/recipes-*.js', { stdio: 'inherit' });
      execSync('cp -r v2/dist/* .', { stdio: 'inherit' });
      execSync('git add -A', { stdio: 'inherit' });
      execSync(`git commit -m "Add ${success} hero images for new recipes"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('\n🚀 Deployed! Images are live on myharvestvegan.com');
    } catch (err) {
      console.log('\n⚠️  Auto-deploy failed. Run manually:');
      console.log('  cd v2 && npm run build && cd ..');
      console.log('  rm -f assets/index-*.js assets/index-*.css assets/recipes-*.js');
      console.log('  cp -r v2/dist/* .');
      console.log('  git add -A && git commit -m "Add hero images" && git push origin main');
    }
  }
}

main().catch(console.error);
