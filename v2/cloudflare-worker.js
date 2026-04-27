const ORIGIN = 'https://kaplancali-dev.github.io/Vegan-Recipe-Finder';
const SITE_URL = 'https://myharvestvegan.com';
const OG_DATA_URL = 'https://raw.githubusercontent.com/kaplancali-dev/Vegan-Recipe-Finder/main/og-data.json';
const FALLBACK_IMAGE = `${SITE_URL}/hero-image4.png`;

let cachedOGData = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600000;

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
  } catch (e) {}
  return cachedOGData;
}

function escHTML(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildOGPage(recipe, recipeId) {
  const title = escHTML(recipe.t);
  const img = recipe.i || FALLBACK_IMAGE;
  const parts = [];
  if (recipe.time) parts.push(`${recipe.time} min`);
  if (recipe.srv) parts.push(`${recipe.srv} servings`);
  if (recipe.cal) parts.push(`${recipe.cal} cal`);
  const meta = parts.length ? parts.join(' · ') : '';
  const site = recipe.s ? `From ${escHTML(recipe.s)} — ` : '';
  const description = `${site}${meta ? meta + '. ' : ''}On HARVEST — over 4,500 plant-based recipes matched to what's in your kitchen.`;
  const redirectUrl = `${SITE_URL}#r=${recipeId}`;
  const ogUrl = `${SITE_URL}?r=${recipeId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title} — HARVEST</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${escHTML(description)}">
<meta property="og:image" content="${escHTML(img)}">
<meta property="og:url" content="${escHTML(ogUrl)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="HARVEST™ — See What Your Kitchen Already Knows">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${escHTML(description)}">
<meta name="twitter:image" content="${escHTML(img)}">
<meta http-equiv="refresh" content="0;url=${escHTML(redirectUrl)}">
</head>
<body>
<p>Redirecting to <a href="${escHTML(redirectUrl)}">HARVEST</a>...</p>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const recipeId = url.searchParams.get('r');

    if (recipeId) {
      const ogData = await getOGData();
      if (ogData && ogData[recipeId]) {
        const html = buildOGPage(ogData[recipeId], recipeId);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    const originUrl = `${ORIGIN}${url.pathname}${url.search}`;
    const response = await fetch(originUrl, {
      headers: request.headers,
      redirect: 'follow',
    });

    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Served-By', 'harvest-worker');
    return newResponse;
  },
};
