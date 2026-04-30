import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/** Stamp the service worker with the current build hash so the browser
 *  detects a new version and cleans up stale caches on every deploy. */
function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = resolve(__dirname, '../sw.js');
      let sw = readFileSync(swPath, 'utf8');
      const buildId = Date.now().toString(36);
      sw = sw.replace(
        /const CACHE_VERSION = '[^']+'/,
        `const CACHE_VERSION = 'harvest-${buildId}'`
      );
      writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig({
  root: '.',
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  plugins: [swVersionPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
});
