import { playwright } from "@vitest/browser-playwright";
import type { UserConfig } from "vite";
import { defineConfig } from "vitest/config";

import baseConfig from "./vite.config";

// Browser-mode test config — runs `*.browser.spec.tsx` in a real Chromium via
// Playwright (rendered with `vitest-browser-react`). Kept separate from
// vite.config.ts on purpose: the default `vitest run`, Stryker, and CI all stay
// on the fast jsdom path and never need a browser. Opt in with `pnpm test:browser`.
//
// First-time setup (downloads ~150 MB): `pnpm exec playwright install chromium`.
const base = baseConfig as UserConfig;

export default defineConfig({
  // Reuse the base plugins (react-swc + Lingui macro transform + tailwind) and
  // the FSD path aliases so browser specs resolve exactly like the rest of src.
  plugins: base.plugins,
  resolve: base.resolve,
  test: {
    include: ["src/**/*.browser.spec.{ts,tsx}"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
