import { beforeEach, describe, expect, it } from "vitest";

import { changeLocale, detectLocale, i18n } from "./index";

describe("i18n", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "ru";
  });

  it("prefers a supported stored locale", () => {
    localStorage.setItem("fb-locale", "en");
    expect(detectLocale()).toBe("en");
  });

  it("persists and activates a locale", async () => {
    await changeLocale("en");
    expect(localStorage.getItem("fb-locale")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(i18n.locale).toBe("en");
  });
});
