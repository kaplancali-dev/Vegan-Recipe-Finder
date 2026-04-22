#!/usr/bin/env node
/**
 * Fetch ingredient lists + images for the 10 new protein bar recipes.
 * Run on your Mac: node fetch-protein-bars.js
 *
 * Requires: npm install -g node-fetch@2 (or Node 18+ with native fetch)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Mjc3MjcsImV4cCI6MjA5MjIwMzcyN30.6kVwmiSaFHWg1Qq1ZWj3HsMXt39GGk77O4Ma4KFim9M';

const RECIPES = [
  { id: 4134, url: 'https://minimalistbaker.com/no-bake-vegan-protein-bars-4-ingredients/', title: 'No-Bake Vegan Protein Bars' },
  { id: 4135, url: 'https://minimalistbaker.com/easy-5-ingredient-protein-bars-peanut-butter-chocolate/', title: 'Peanut Butter Chocolate Protein Bars' },
  { id: 4136, url: 'https://ohsheglows.com/quick-n-easy-no-bake-protein-bars/', title: 'No-Bake Protein Bars' },
  { id: 4137, url: 'https://www.ambitiouskitchen.com/peanut-butter-cup-protein-bars/', title: 'Chocolate Peanut Butter Protein Bars' },
  { id: 4138, url: 'https://beamingbaker.com/4-ingredient-no-bake-chocolate-peanut-butter-oatmeal-bars-vegan-gluten-free-protein-packed/', title: 'No-Bake Chocolate PB Oatmeal Bars' },
  { id: 4139, url: 'https://www.thefullhelping.com/higher-protein-raw-vegan-snack-bars-easy-to-customize/', title: 'Higher Protein Raw Snack Bars' },
  { id: 4140, url: 'https://feelgoodfoodie.net/recipe/vegan-protein-bars/', title: 'Vegan Protein Bars' },
  { id: 4141, url: 'https://beamingbaker.com/4-ingredient-no-bake-peanut-butter-coconut-oatmeal-bars-vegan-gluten-free-dairy-free/', title: 'Peanut Butter Coconut Oatmeal Bars' },
  { id: 4142, url: 'https://minimalistbaker.com/healthy-5-ingredient-granola-bars/', title: '5-Ingredient Granola Bars' },
  { id: 4143, url: 'https://dreenaburton.com/homemade-vegan-protein-bars/', title: 'Homemade Vegan Protein Bars' },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBinary(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), contentType: res.headers['content-type'] }));
    }).on('error', reject);
  });
}

function extractJsonLd(html) {
  const matches = [];
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      matches.push(parsed);
    } catch (e) { /* skip invalid json */ }
  }
  return matches;
}

function findRecipe(jsonLdArray) {
  for (const item of jsonLdArray) {
    if (item['@type'] === 'Recipe') return item;
    if (Array.isArray(item['@graph'])) {
      for (const g of item['@graph']) {
        if (g['@type'] === 'Recipe') return g;
      }
    }
    if (Array.isArray(item)) {
      for (const g of item) {
        if (g['@type'] === 'Recipe') return g;
      }
    }
  }
  return null;
}

function cleanIngredient(raw) {
  // Strip quantities, measurements, and prep notes
  let s = raw
    .replace(/\([^)]*\)/g, '')           // remove parentheticals
    .replace(/[\d½⅓⅔¼¾⅛⅜⅝⅞]+/g, '')    // remove numbers/fractions
    .replace(/\b(cups?|cup|tbsp|tsp|tablespoons?|teaspoons?|ounces?|oz|lbs?|pounds?|grams?|g|ml|liters?|pinch|dash|inch|large|medium|small|heaping|scant|packed|level)\b/gi, '')
    .replace(/,.*$/, '')                   // take first part before comma
    .replace(/\bfor\b.*$/i, '')            // remove "for serving" etc
    .replace(/\bto\b\s+\btaste\b/i, '')
    .replace(/\bor\b.*$/i, '')             // remove "or substitute"
    .replace(/\bas\s+needed\b/i, '')
    .replace(/\boptional\b/gi, '')
    .replace(/\bplus\b.*$/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // Skip empty or too-short results
  if (!s || s.length < 3) return null;
  return s;
}

async function uploadToSupabase(id, imageBuffer, contentType) {
  const ext = contentType?.includes('png') ? 'png' : contentType?.includes('webp') ? 'webp' : 'jpg';
  const filePath = `${id}.${ext}`;

  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/storage/v1/object/recipe-images/${filePath}`;
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'apikey': SUPABASE_ANON,
        'Content-Type': contentType || 'image/jpeg',
        'Content-Length': imageBuffer.length,
        'x-upsert': 'true',
      }
    };

    const req = https.request(options, (res) => {
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
    req.write(imageBuffer);
    req.end();
  });
}

async function processRecipe(recipe) {
  console.log(`\n── ${recipe.id}: ${recipe.title} ──`);
  console.log(`   Fetching ${recipe.url}`);

  try {
    const { status, body } = await fetchUrl(recipe.url);
    if (status !== 200) {
      console.log(`   ❌ HTTP ${status}`);
      return null;
    }

    const jsonLdArray = extractJsonLd(body);
    const recipeData = findRecipe(jsonLdArray);

    if (!recipeData) {
      console.log('   ❌ No JSON-LD Recipe found');
      return null;
    }

    // Extract ingredients
    const rawIngredients = recipeData.recipeIngredient || [];
    const cleaned = rawIngredients
      .map(cleanIngredient)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe
      .sort();

    console.log(`   ✅ Ingredients (${cleaned.length}): ${cleaned.join(', ')}`);

    // Extract image
    let imageUrl = null;
    if (recipeData.image) {
      if (typeof recipeData.image === 'string') imageUrl = recipeData.image;
      else if (Array.isArray(recipeData.image)) imageUrl = recipeData.image[0];
      else if (recipeData.image.url) imageUrl = recipeData.image.url;
    }

    // Extract nutrition if available
    let nutrition = null;
    if (recipeData.nutrition) {
      const n = recipeData.nutrition;
      nutrition = {
        cal: parseInt(n.calories) || 0,
        pro: parseFloat(n.proteinContent) || 0,
        carb: parseFloat(n.carbohydrateContent) || 0,
        fat: parseFloat(n.fatContent) || 0,
        fib: parseFloat(n.fiberContent) || 0,
      };
      console.log(`   📊 Nutrition: ${JSON.stringify(nutrition)}`);
    }

    // Download and upload image
    let finalImageUrl = null;
    if (imageUrl) {
      console.log(`   📷 Downloading image...`);
      try {
        const imgData = await fetchBinary(imageUrl);
        if (imgData.status === 200) {
          console.log(`   📤 Uploading to Supabase...`);
          finalImageUrl = await uploadToSupabase(recipe.id, imgData.body, imgData.contentType);
          console.log(`   ✅ Image: ${finalImageUrl}`);
        } else {
          console.log(`   ❌ Image download failed (${imgData.status})`);
        }
      } catch (e) {
        console.log(`   ❌ Image error: ${e.message}`);
      }
    }

    return {
      id: recipe.id,
      ingredients: cleaned,
      nutrition,
      imageUrl: finalImageUrl,
    };
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('🌿 Fetching protein bar recipe data...\n');

  const results = [];
  for (const recipe of RECIPES) {
    const result = await processRecipe(recipe);
    if (result) results.push(result);
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n\n═══ SUMMARY ═══');
  console.log(`Processed: ${results.length}/${RECIPES.length}`);

  // Write results to a JSON file for easy import
  const outputPath = path.join(__dirname, 'protein-bar-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);

  // Print the ingredient arrays ready to paste
  console.log('\n\n═══ INGREDIENT ARRAYS (copy/paste ready) ═══\n');
  for (const r of results) {
    console.log(`// id:${r.id}`);
    console.log(`ing:[${r.ingredients.map(i => `"${i}"`).join(',')}]`);
    if (r.nutrition) {
      console.log(`nut:${JSON.stringify(r.nutrition)}`);
    }
    console.log('');
  }
}

main().catch(console.error);
