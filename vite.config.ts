import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { createRequire } from "module";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

// pnpm doesn't hoist @lingui/swc-plugin next to @vitejs/plugin-react-swc, so
// resolve the plugin path from this package and pass an absolute id.
const linguiSwcPlugin = createRequire(import.meta.url).resolve("@lingui/swc-plugin");

export default defineConfig({
  plugins: [
    react({
      plugins: [[linguiSwcPlugin, {}]],
    }),
    lingui(),
    tailwindcss(),
  ],
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@app": resolve(__dirname, "src/app"),
      "@pages": resolve(__dirname, "src/pages"),
      "@widgets": resolve(__dirname, "src/widgets"),
      "@features": resolve(__dirname, "src/features"),
      "@entities": resolve(__dirname, "src/entities"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // The frontend uses `/api/*` purely as a network-tab marker; the dev
      // server forwards it to a real backend (strip the prefix on the way).
      // Point `VITE_API_TARGET` at your API, or rely on MSW (VITE_ENABLE_MOCKS).
      "/api": {
        target: process.env.VITE_API_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    // storage-polyfill MUST run before setup.ts: it installs a working
    // localStorage/sessionStorage before any Zustand `persist` store is
    // imported (the jsdom runner otherwise hands tests a method-less `{}`).
    setupFiles: ["./src/app/testing/storage-polyfill.ts", "./src/app/testing/setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.spec.{ts,tsx}", "src/app/testing/**", "src/locales/**", "src/main.tsx"],
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});
