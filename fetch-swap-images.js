#!/usr/bin/env node
/**
 * Fetch images for the 2 swapped-in protein bar recipes (4144 + 4146).
 * Run on your Mac: node fetch-swap-images.js
 */
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Mjc3MjcsImV4cCI6MjA5MjIwMzcyN30.6kVwmiSaFHWg1Qq1ZWj3HsMXt39GGk77O4Ma4KFim9M';

const RECIPES = [
  { id: 4144, url: 'https://www.theconsciousplantkitchen.com/protein-cereal-bars/', title: 'Puffed Cereal Protein Bars' },
  { id: 4146, url: 'https://thebigmansworld.com/no-bake-peanut-butter-protein-bars-keto-sugar-free-vegan/', title: 'No-Bake Peanut Butter Protein Bars' },
];

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return fetchBinary(loc).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), contentType: res.headers['content-type'] }));
    }).on('error', reject);
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return fetchUrl(loc).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function extractJsonLd(html) {
  const matches = [];
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { matches.push(JSON.parse(m[1])); } catch (e) {}
  }
  return matches;
}

function findRecipe(jsonLdArray) {
  for (const item of jsonLdArray) {
    if (item['@type'] === 'Recipe') return item;
    if (Array.isArray(item['@graph'])) {
      for (const g of item['@graph']) { if (g['@type'] === 'Recipe') return g; }
    }
    if (Array.isArray(item)) {
      for (const g of item) { if (g['@type'] === 'Recipe') return g; }
    }
  }
  return null;
}

async function uploadToSupabase(id, imageBuffer, contentType) {
  const ext = contentType?.includes('png') ? 'png' : contentType?.includes('webp') ? 'webp' : 'jpg';
  const filePath = `${id}.${ext}`;
  return new Promise((resolve, reject) => {
    const parsed = new URL(`${SUPABASE_URL}/storage/v1/object/recipe-images/${filePath}`);
    const req = https.request({
      hostname: parsed.hostname, path: parsed.pathname, method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON}`, 'apikey': SUPABASE_ANON,
        'Content-Type': contentType || 'image/jpeg',
        'Content-Length': imageBuffer.length, 'x-upsert': 'true',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(`${SUPABASE_URL}/storage/v1/object/public/recipe-images/${filePath}`);
        } else { reject(new Error(`Upload failed (${res.statusCode}): ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(imageBuffer);
    req.end();
  });
}

async function processRecipe(recipe) {
  console.log(`\n── ${recipe.id}: ${recipe.title} ──`);
  console.log(`   Fetching ${recipe.url}`);
  try {
    const { status, body } = await fetchUrl(recipe.url);
    if (status !== 200) { console.log(`   ❌ HTTP ${status}`); return; }

    const jsonLdArray = extractJsonLd(body);
    const recipeData = findRecipe(jsonLdArray);

    // Extract image from JSON-LD or og:image
    let imageUrl = null;
    if (recipeData && recipeData.image) {
      if (typeof recipeData.image === 'string') imageUrl = recipeData.image;
      else if (Array.isArray(recipeData.image)) imageUrl = recipeData.image[0];
      else if (recipeData.image.url) imageUrl = recipeData.image.url;
    }
    if (!imageUrl) {
      const ogMatch = body.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/);
      if (ogMatch) imageUrl = ogMatch[1];
    }

    // Also print nutrition + ingredients for verification
    if (recipeData) {
      const rawIng = recipeData.recipeIngredient || [];
      console.log(`   📋 Ingredients: ${rawIng.join(' | ')}`);
      if (recipeData.nutrition) {
        const n = recipeData.nutrition;
        console.log(`   📊 Nutrition: cal=${n.calories} pro=${n.proteinContent} carb=${n.carbohydrateContent} fat=${n.fatContent} fib=${n.fiberContent}`);
      }
    }

    if (!imageUrl) { console.log('   ❌ No image found'); return; }

    console.log(`   📷 Downloading: ${imageUrl}`);
    const imgData = await fetchBinary(imageUrl);
    if (imgData.status !== 200) { console.log(`   ❌ Image download failed (${imgData.status})`); return; }

    console.log(`   📤 Uploading to Supabase...`);
    const finalUrl = await uploadToSupabase(recipe.id, imgData.body, imgData.contentType);
    console.log(`   ✅ ${finalUrl}`);
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
}

async function main() {
  console.log('🌿 Fetching images for swapped protein bar recipes...\n');
  for (const recipe of RECIPES) {
    await processRecipe(recipe);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\n✅ Done!');
}

main().catch(console.error);
