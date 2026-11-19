import { beforeEach, describe, expect, it } from "vitest";

import { resolveTheme, useThemeStore } from "./theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: "system" });
  });

  it("resolves explicit and system modes", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("system")).toBe("light");
  });

  it("persists the selected mode", () => {
    useThemeStore.getState().setMode("dark");
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(localStorage.getItem("fb-theme")).toContain('"mode":"dark"');
  });
});
