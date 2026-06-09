import { afterAll, afterEach, beforeAll } from "vitest";

import { db } from "./mocks/db";
import { server } from "./mocks/server";

// MSW resolves relative request-handler paths (e.g. "/api/tasks") against the
// global `location`. The node environment has none, so give it an origin —
// it matches the absolute base the client uses in node (VITE_API_URL in
// vite.config.ts), keeping the handlers themselves relative (so the browser
// worker still works against whatever origin serves the app).
if (typeof globalThis.location === "undefined") {
  Object.defineProperty(globalThis, "location", {
    value: new URL("http://localhost/"),
    writable: true,
    configurable: true,
  });
}

// Setup for the `node` Vitest project (pure unit + integration tests, no DOM).
// Deliberately lighter than the jsdom setup: no jest-dom matchers, no
// Testing Library cleanup, no jsdom polyfills — just the MSW node server and
// the in-memory db, reset between tests for full isolation.

beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  db.reset();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
