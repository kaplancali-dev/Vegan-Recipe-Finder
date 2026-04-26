/**
 * HARVEST — Cloudflare Worker for dynamic Open Graph link previews.
 *
 * When a bot/crawler (iMessage, Facebook, Twitter, Slack, etc.) fetches
 * a URL like myharvestvegan.com?r=189, this Worker serves a small HTML
 * page with recipe-specific og:title, og:image, and og:description.
 *
 * Real users get passed through to the normal GitHub Pages site.
 *
 * Setup:
 *   1. Create a Worker in Cloudflare dashboard
 *   2. Paste this script
 *   3. Add a route: myharvestvegan.com/*
 */

const ORIGIN = 'https://kaplancali-dev.github.io/Vegan-Recipe-Finder';
const SITE_URL = 'https://myharvestvegan.com';
const OG_DATA_URL = `${SITE_URL}/og-data.json`;
const FALLBACK_IMAGE = `${SITE_URL}/hero-image4.png`;

const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|Applebot|TelegramBot|Pinterestbot|redditbot|Embedly|Quora|Outbrain|vkShare|W3C_Validator|iframely/i;

let cachedOGData = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600000; // 1 hour

async function getOGData() {
  const now = Date.now();
  if (cachedOGData && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedOGData;
  }
  try {
    const resp = await fetch(OG_DATA_URL);
    if (resp.ok) {
      cachedOGData = await resp.json();
      cacheTimestamp = now;
    }
  } catch (e) {
    // If fetch fails, use stale cache or null
  }
  return cachedOGData;
}

function escHTML(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildOGPage(recipe, recipeId) {
  const title = escHTML(recipe.t);
  const img = recipe.img || FALLBACK_IMAGE;
  const parts = [];
  if (recipe.time) parts.push(`${recipe.time} min`);
  if (recipe.srv) parts.push(`${recipe.srv} servings`);
  if (recipe.cal) parts.push(`${recipe.cal} cal`);
  const meta = parts.length ? parts.join(' · ') : '';
  const site = recipe.site ? `From ${escHTML(recipe.site)} — ` : '';
  const description = `${site}${meta ? meta + '. ' : ''}On HARVEST — nearly 2,000 plant-based recipes matched to what's in your kitchen.`;
  const url = `${SITE_URL}?r=${recipeId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title} — HARVEST</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${escHTML(description)}">
<meta property="og:image" content="${escHTML(img)}">
<meta property="og:url" content="${escHTML(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="HARVEST — Eat More Plants!">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${escHTML(description)}">
<meta name="twitter:image" content="${escHTML(img)}">
<meta http-equiv="refresh" content="0;url=${escHTML(url)}">
</head>
<body>
<p>Redirecting to <a href="${escHTML(url)}">HARVEST</a>...</p>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const recipeId = url.searchParams.get('r');
    const userAgent = request.headers.get('user-agent') || '';

    // Only intercept if there's a recipe ID AND it's a bot
    if (recipeId && BOT_UA.test(userAgent)) {
      const ogData = await getOGData();
      if (ogData && ogData[recipeId]) {
        const html = buildOGPage(ogData[recipeId], recipeId);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    // For real users (or if no recipe match), pass through to origin
    const originUrl = `${ORIGIN}${url.pathname}${url.search}`;
    const response = await fetch(originUrl, {
      headers: request.headers,
      redirect: 'follow',
    });

    // Clone response so we can modify headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Served-By', 'harvest-worker');
    return newResponse;
  },
};
