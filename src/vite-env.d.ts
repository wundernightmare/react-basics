/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API base URL injected at build time. Defaults to "/api". */
  readonly VITE_API_URL?: string;
  /** When "true" (and not a production build), start the MSW browser worker. */
  readonly VITE_ENABLE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
