import { setupWorker } from "msw/browser";

import { tasksHandlers } from "./handlers/tasks";

/**
 * All MSW request handlers, ordered most-specific to least-specific (MSW
 * matches in declaration order).
 */
export const handlers = [...tasksHandlers];

/**
 * MSW browser worker. Started from `main.tsx` when `VITE_ENABLE_MOCKS=true`.
 *
 * ⚠️  Requires `public/mockServiceWorker.js` (committed). MSW 3 has no
 *     postinstall hook, so regenerate it after bumping `msw`:
 *     pnpm exec msw init
 */
export const worker = setupWorker(...handlers);
