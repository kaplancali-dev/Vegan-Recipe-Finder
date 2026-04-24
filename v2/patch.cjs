const fs = require('fs');
let code = fs.readFileSync('fetch-missing-images.cjs', 'utf8');

const newFn = `async function findRealRecipeUrl(title) {
  const cleanTitle = title.replace(/^(vegan|raw|instant pot)\\s+/gi, '').trim();

  const sitesToTry = [
    'minimalistbaker.com',
    'rainbowplantlife.com',
    'veganricha.com',
    'noracooks.com',
    'budgetbytes.com',
  ];

  for (const site of sitesToTry) {
    try {
      const searchUrl = \`https://\${site}/?s=\${encodeURIComponent(cleanTitle)}\`;
      const resp = await fetch(searchUrl, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const regex = new RegExp('href="(https://' + site.replace('.', '\\\\.') + '/[^"]+?)"');
      const linkMatch = html.match(regex);
      if (linkMatch) {
        const href = linkMatch[1];
        if (href.includes('/page/') || href.includes('/category/') || href.includes('/tag/')) continue;
        return href;
      }
    } catch {}
    await sleep(500);
  }

  // Fallback: DuckDuckGo lite
  await sleep(Math.random() * 3000 + 2000);
  const cleanQuery = encodeURIComponent(cleanTitle + ' vegan recipe');
  const url = \`https://lite.duckduckgo.com/lite/?q=\${cleanQuery}\`;

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://lite.duckduckgo.com/',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    const matches = [...html.matchAll(/href="(https?:\/\/[^"]+)"/gi)];
    for (const m of matches) {
      const u = m[1];
      if (u.includes('duckduckgo') || u.includes('duck.co')) continue;
      if (u.includes('recipe') || u.includes('cook') || u.includes('food')) return u;
    }
  } catch {
    return null;
  }

  return null;
}`;

// Replace from "async function findRealRecipeUrl" to the closing "}" before "// ─── Step 2"
code = code.replace(
  /async function findRealRecipeUrl[\s\S]*?\n\}\n\n\/\/ ─── Step 2/,
  newFn + '\n\n// ─── Step 2'
);

fs.writeFileSync('fetch-missing-images.cjs', code);
console.log('Done!');
