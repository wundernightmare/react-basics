import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

async function bootstrap(container: HTMLElement) {
  // Optional in-browser mocking: `VITE_ENABLE_MOCKS=true pnpm dev` starts the
  // MSW worker so the app runs entirely against the in-memory fixtures — no
  // backend required. Never honoured in a production build.
  const enableMocks =
    import.meta.env.MODE !== "production" && import.meta.env.VITE_ENABLE_MOCKS === "true";

  if (enableMocks) {
    try {
      const { worker } = await import("@app/testing/mocks/worker");
      await worker.start({ quiet: true, onUnhandledFrame: "bypass" });
    } catch (error) {
      console.error("Failed to start MSW", error);
    }
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap(root);
