/**
 * HARVEST Pantry Scan — Cloudflare Worker
 *
 * Proxies image-to-ingredient requests to Claude's vision API.
 * - Hides the Anthropic API key from the client
 * - Rate-limits per IP (configurable DAILY_LIMIT, default 10)
 * - CORS-locked to ALLOWED_ORIGIN
 *
 * Secrets (set via `wrangler secret put`):
 *   ANTHROPIC_API_KEY — your Anthropic API key
 */

const PROMPT = `You are a kitchen ingredient identifier. Look at each photo carefully and list EVERY food ingredient, spice, condiment, oil, sauce, flour, grain, bean, nut, seed, fruit, and vegetable you can see.

Return ONLY a JSON array of strings — one entry per ingredient, lowercase, singular form when sensible. Use short common names.

Example: ["chickpeas","cumin","olive oil","garlic","rice","soy sauce","maple syrup","smoked paprika"]

Rules:
- List individual items, not brands or containers
- If you see a spice rack, list each visible spice
- Combine obvious duplicates
- Include pantry staples like salt, pepper, oils
- Do NOT include non-food items
- Return ONLY the JSON array, nothing else`;

export default {
  async fetch(request, env) {
    // ── CORS preflight ──────────────────────────────────────────
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim());
    // Also allow localhost for development
    const isAllowed = allowed.includes(origin) ||
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1") ||
      origin.startsWith("file://");

    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowed ? origin : allowed[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
    }

    // ── Rate limiting (simple per-IP daily counter) ─────────────
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const rateKey = `rate:${ip}:${today}`;
    const dailyLimit = parseInt(env.DAILY_LIMIT) || 10;

    // Use Cloudflare KV if available, otherwise skip rate limiting
    if (env.RATE_STORE) {
      const current = parseInt(await env.RATE_STORE.get(rateKey)) || 0;
      if (current >= dailyLimit) {
        return jsonResponse({
          error: "Daily scan limit reached",
          message: `You can scan up to ${dailyLimit} times per day. Try again tomorrow!`,
          limit: dailyLimit,
          used: current
        }, 429, corsHeaders);
      }
      // Increment counter (TTL = 48 hours to auto-clean)
      await env.RATE_STORE.put(rateKey, String(current + 1), { expirationTtl: 172800 });
    }

    // ── Parse request ───────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
    }

    const { image, mediaType, slotLabel } = body;
    if (!image || !mediaType) {
      return jsonResponse({ error: "Missing image or mediaType" }, 400, corsHeaders);
    }

    // ── Call Claude vision API ───────────────────────────────────
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: "Server misconfigured — missing API key" }, 500, corsHeaders);
    }

    try {
      const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: image }
              },
              {
                type: "text",
                text: `This photo is of my ${(slotLabel || "kitchen").toLowerCase()}. ${PROMPT}`
              }
            ]
          }]
        })
      });

      if (!claudeResp.ok) {
        const errText = await claudeResp.text();
        console.error("Claude API error:", claudeResp.status, errText);
        return jsonResponse({
          error: "AI scan failed",
          detail: `Claude returned ${claudeResp.status}`
        }, 502, corsHeaders);
      }

      const claudeData = await claudeResp.json();
      const text = claudeData.content?.[0]?.text || "[]";
      const match = text.match(/\[[\s\S]*\]/);
      const ingredients = match ? JSON.parse(match[0]) : [];

      return jsonResponse({ ingredients, slotLabel }, 200, corsHeaders);

    } catch (err) {
      console.error("Scan error:", err);
      return jsonResponse({ error: "Scan failed", detail: err.message }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}
