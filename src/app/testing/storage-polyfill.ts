// Web Storage polyfill for the test environment.
//
// The vitest + jsdom runner can hand tests a bare `{}` for
// `window.localStorage`/`sessionStorage` — an object with none of the `Storage`
// methods. Any code that persists through it then throws
// `TypeError: storage.setItem is not a function`. In this app that is every
// Zustand `persist` store (e.g. `useThemeStore`): the moment a test triggers a
// write, the persist middleware tries to use the captured storage and blows up.
//
// This file is registered as the FIRST `setupFiles` entry (see vite.config.ts)
// so it runs before any store module is imported — the persist middleware
// captures `window.localStorage` once at store-creation time, so the working
// storage must already be in place by then.
//
// The shim is conditional: where the environment already exposes a working
// Storage we leave it untouched.

function isWorkingStorage(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { getItem?: unknown }).getItem === "function" &&
    typeof (value as { setItem?: unknown }).setItem === "function" &&
    typeof (value as { removeItem?: unknown }).removeItem === "function"
  );
}

function installStorage(name: "localStorage" | "sessionStorage"): void {
  if (isWorkingStorage(globalThis[name] as unknown)) return;

  const store = new Map<string, string>();
  const storage = {
    get length(): number {
      return store.size;
    },
    clear(): void {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index: number): string | null {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    },
  };

  Object.defineProperty(globalThis, name, {
    value: storage,
    writable: true,
    configurable: true,
  });
}

installStorage("localStorage");
installStorage("sessionStorage");
