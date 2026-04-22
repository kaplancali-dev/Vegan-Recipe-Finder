#!/usr/bin/env node
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://zhncgdbhgkeiybdbzsql.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmNnZGJoZ2tlaXliZGJ6c3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Mjc3MjcsImV4cCI6MjA5MjIwMzcyN30.6kVwmiSaFHWg1Qq1ZWj3HsMXt39GGk77O4Ma4KFim9M';

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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
    try { matches.push(JSON.parse(m[1])); } catch (e) {}
  }
  return matches;
}

async function main() {
  console.log('Fetching recipe page...');
  const url = 'https://thebigmansworld.com/healthy-no-bake-chocolate-peanut-butter-chewy-bars-vegan-gluten-free/';

  const pageRes = await fetchBinary(url);
  const html = pageRes.body.toString();

  const jsonLd = extractJsonLd(html);
  let imageUrl = null;
  for (const item of jsonLd) {
    const recipe = item['@type'] === 'Recipe' ? item :
      (item['@graph'] || []).find(g => g['@type'] === 'Recipe');
    if (recipe && recipe.image) {
      imageUrl = typeof recipe.image === 'string' ? recipe.image :
        Array.isArray(recipe.image) ? recipe.image[0] :
        recipe.image.url;
      break;
    }
  }

  if (!imageUrl) {
    console.log('No image found in JSON-LD, trying og:image...');
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/);
    if (ogMatch) imageUrl = ogMatch[1];
  }

  if (!imageUrl) { console.log('No image found!'); return; }

  console.log('Downloading image:', imageUrl);
  const imgData = await fetchBinary(imageUrl);

  console.log('Uploading to Supabase...');
  const ext = imgData.contentType?.includes('png') ? 'png' : imgData.contentType?.includes('webp') ? 'webp' : 'jpg';
  const filePath = `4138.${ext}`;

  await new Promise((resolve, reject) => {
    const parsed = new URL(`${SUPABASE_URL}/storage/v1/object/recipe-images/${filePath}`);
    const req = https.request({
      hostname: parsed.hostname, path: parsed.pathname, method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON}`, 'apikey': SUPABASE_ANON,
        'Content-Type': imgData.contentType || 'image/jpeg',
        'Content-Length': imgData.body.length, 'x-upsert': 'true',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Uploaded: ${SUPABASE_URL}/storage/v1/object/public/recipe-images/${filePath}`);
          resolve();
        } else {
          console.log(`❌ Upload failed (${res.statusCode}): ${data}`);
          reject();
        }
      });
    });
    req.on('error', reject);
    req.write(imgData.body);
    req.end();
  });
}

main().catch(console.error);
