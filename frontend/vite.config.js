import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "^/media/(?!$)": "http://127.0.0.1:8000"
    }
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep framework code stable and cacheable between content releases.
          if (id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/scheduler/")) {
            return "react-vendor";
          }

          // Icon components are used throughout the site; isolate their
          // implementation so application updates do not invalidate React.
          if (id.includes("/node_modules/lucide-react/")) {
            return "icons-vendor";
          }

          // PDF rendering is only needed after a visitor opens the eBook
          // reader. Keep PDF.js out of the initial homepage JavaScript.
          if (id.includes("/node_modules/pdfjs-dist/")) {
            return "pdf-viewer";
          }
        }
      }
    }
  }
});
