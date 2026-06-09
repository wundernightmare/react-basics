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
 * ⚠️  Requires `public/mockServiceWorker.js`. Generate it once with:
 *     pnpm dlx msw init public/ --save
 */
export const worker = setupWorker(...handlers);
