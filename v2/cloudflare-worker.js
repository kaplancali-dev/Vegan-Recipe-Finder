const ORIGIN = 'https://kaplancali-dev.github.io/Vegan-Recipe-Finder';
const SITE_URL = 'https://myharvestvegan.com';
const OG_DATA_URL = 'https://raw.githubusercontent.com/kaplancali-dev/Vegan-Recipe-Finder/main/og-data.json';
const FALLBACK_IMAGE = `${SITE_URL}/og-preview.png`;
const NOTIFY_EMAIL = 'kaplancali@icloud.com';

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

/**
 * Handle broken-link report webhook from Supabase.
 * Sends an email via Resend API.
 */
async function handleReport(request, env) {
  // Verify shared secret
  const authHeader = request.headers.get('x-webhook-secret') || '';
  if (!env.WEBHOOK_SECRET || authHeader !== env.WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await request.json();
    // Supabase webhook sends { type, table, record, ... }
    const row = payload.record || payload;
    const recipeTitle = (row.message || '').replace('Broken link report: ', '');
    const recipeId = row.line || 'unknown';
    const recipeUrl = row.stack || 'N/A';
    const reportedAt = row.created_at || new Date().toISOString();
    const userAgent = row.user_agent || '';

    const emailBody = [
      `Recipe: ${recipeTitle}`,
      `ID: ${recipeId}`,
      `URL: ${recipeUrl}`,
      `Reported: ${reportedAt}`,
      `User-Agent: ${userAgent}`,
      '',
      `View in app: ${SITE_URL}?r=${recipeId}`,
    ].join('\n');

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HARVEST Alerts <alerts@myharvestvegan.com>',
        to: [NOTIFY_EMAIL],
        subject: `🔗 Broken link: ${recipeTitle}`,
        text: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response('Email send failed', { status: 502 });
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error('Report handler error:', e);
    return new Response('Error', { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Broken-link report webhook endpoint
    if (url.pathname === '/api/report' && request.method === 'POST') {
      return handleReport(request, env);
    }

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
