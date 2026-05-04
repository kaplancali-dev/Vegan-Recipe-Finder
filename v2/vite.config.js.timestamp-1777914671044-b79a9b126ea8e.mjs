// vite.config.js
import { defineConfig } from "file:///sessions/loving-ecstatic-hopper/mnt/Vegan-Recipe-Finder/v2/node_modules/vite/dist/node/index.js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/sessions/loving-ecstatic-hopper/mnt/Vegan-Recipe-Finder/v2";
function swVersionPlugin() {
  return {
    name: "sw-version",
    closeBundle() {
      const swPath = resolve(__vite_injected_original_dirname, "../sw.js");
      let sw = readFileSync(swPath, "utf8");
      const buildId = Date.now().toString(36);
      sw = sw.replace(
        /const CACHE_VERSION = '[^']+'/,
        `const CACHE_VERSION = 'harvest-${buildId}'`
      );
      writeFileSync(swPath, sw);
    }
  };
}
var vite_config_default = defineConfig({
  root: ".",
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ["@supabase/supabase-js"]
        }
      }
    }
  },
  plugins: [swVersionPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.js"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvbG92aW5nLWVjc3RhdGljLWhvcHBlci9tbnQvVmVnYW4tUmVjaXBlLUZpbmRlci92MlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2xvdmluZy1lY3N0YXRpYy1ob3BwZXIvbW50L1ZlZ2FuLVJlY2lwZS1GaW5kZXIvdjIvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2xvdmluZy1lY3N0YXRpYy1ob3BwZXIvbW50L1ZlZ2FuLVJlY2lwZS1GaW5kZXIvdjIvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuLyoqIFN0YW1wIHRoZSBzZXJ2aWNlIHdvcmtlciB3aXRoIHRoZSBjdXJyZW50IGJ1aWxkIGhhc2ggc28gdGhlIGJyb3dzZXJcbiAqICBkZXRlY3RzIGEgbmV3IHZlcnNpb24gYW5kIGNsZWFucyB1cCBzdGFsZSBjYWNoZXMgb24gZXZlcnkgZGVwbG95LiAqL1xuZnVuY3Rpb24gc3dWZXJzaW9uUGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdzdy12ZXJzaW9uJyxcbiAgICBjbG9zZUJ1bmRsZSgpIHtcbiAgICAgIGNvbnN0IHN3UGF0aCA9IHJlc29sdmUoX19kaXJuYW1lLCAnLi4vc3cuanMnKTtcbiAgICAgIGxldCBzdyA9IHJlYWRGaWxlU3luYyhzd1BhdGgsICd1dGY4Jyk7XG4gICAgICBjb25zdCBidWlsZElkID0gRGF0ZS5ub3coKS50b1N0cmluZygzNik7XG4gICAgICBzdyA9IHN3LnJlcGxhY2UoXG4gICAgICAgIC9jb25zdCBDQUNIRV9WRVJTSU9OID0gJ1teJ10rJy8sXG4gICAgICAgIGBjb25zdCBDQUNIRV9WRVJTSU9OID0gJ2hhcnZlc3QtJHtidWlsZElkfSdgXG4gICAgICApO1xuICAgICAgd3JpdGVGaWxlU3luYyhzd1BhdGgsIHN3KTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICByb290OiAnLicsXG4gIGJhc2U6ICcvJyxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgc3VwYWJhc2U6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtzd1ZlcnNpb25QbHVnaW4oKV0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIGluY2x1ZGU6IFsndGVzdHMvKiovKi50ZXN0LmpzJ10sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVcsU0FBUyxvQkFBb0I7QUFDaFksU0FBUyxjQUFjLHFCQUFxQjtBQUM1QyxTQUFTLGVBQWU7QUFGeEIsSUFBTSxtQ0FBbUM7QUFNekMsU0FBUyxrQkFBa0I7QUFDekIsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sY0FBYztBQUNaLFlBQU0sU0FBUyxRQUFRLGtDQUFXLFVBQVU7QUFDNUMsVUFBSSxLQUFLLGFBQWEsUUFBUSxNQUFNO0FBQ3BDLFlBQU0sVUFBVSxLQUFLLElBQUksRUFBRSxTQUFTLEVBQUU7QUFDdEMsV0FBSyxHQUFHO0FBQUEsUUFDTjtBQUFBLFFBQ0Esa0NBQWtDLE9BQU87QUFBQSxNQUMzQztBQUNBLG9CQUFjLFFBQVEsRUFBRTtBQUFBLElBQzFCO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLEVBQ04sTUFBTTtBQUFBLEVBQ04sT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osVUFBVSxDQUFDLHVCQUF1QjtBQUFBLFFBQ3BDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsZ0JBQWdCLENBQUM7QUFBQSxFQUMzQixNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixTQUFTLENBQUMsb0JBQW9CO0FBQUEsRUFDaEM7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
