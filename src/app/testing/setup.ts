import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { db } from "./mocks/db";
import { server } from "./mocks/server";

// jsdom doesn't implement matchMedia — the theme store reads it. Provide a
// minimal stub (defaults to light) so components that resolve the theme render.
if (typeof globalThis.matchMedia === "undefined") {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof globalThis.matchMedia;
}

/**
 * Start the MSW server once before the suite. `onUnhandledRequest: "warn"`
 * surfaces typos (a request with no handler) without failing the test.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

/** Unmount React trees + reset db / handler overrides after each test. */
afterEach(() => {
  cleanup();
  db.reset();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
