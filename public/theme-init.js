// Applies the persisted theme synchronously, before the body parses, to avoid a
// flash of the wrong colour scheme on first paint. Loaded as a render-blocking
// external script from index.html (NOT inline) so the page can ship a strict
// `script-src 'self'` Content-Security-Policy with no nonce/hash to maintain.
// Reads the same `fb-theme` localStorage key the Zustand store persists to
// (src/shared/model/theme.ts).
(function () {
  try {
    var raw = localStorage.getItem("fb-theme");
    var mode = "system";
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state && typeof parsed.state.mode === "string") {
        mode = parsed.state.mode;
      }
    }
    var effective = mode;
    if (mode === "system") {
      effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (effective === "dark") document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = effective;
  } catch (e) {
    // localStorage unavailable / disabled — fall back to OS default.
  }
})();
