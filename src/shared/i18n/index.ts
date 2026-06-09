import { i18n } from "@lingui/core";
import type { Messages } from "@lingui/core";

export const SUPPORTED_LOCALES = ["ru", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  ru: "Русский",
  en: "English",
};

const LOCALE_STORAGE_KEY = "fb-locale";

/**
 * Vite-resolved catalog map — only the requested locale is loaded at runtime.
 * The glob pattern is statically analysed by Vite for code-splitting. The
 * compiled `messages.ts` files are produced by `pnpm i18n:compile`; when they
 * are absent (fresh clone before extract) we fall back to empty messages and
 * the source strings render as-is.
 */
const catalogs = import.meta.glob<{ messages: Messages }>("../../locales/*/messages.ts");

export async function loadCatalog(locale: string): Promise<void> {
  const path = `../../locales/${locale}/messages.ts`;
  const loader = catalogs[path];
  try {
    if (loader) {
      const mod = await loader();
      i18n.loadAndActivate({ locale, messages: mod.messages });
    } else {
      i18n.loadAndActivate({ locale, messages: {} });
    }
  } catch {
    i18n.loadAndActivate({ locale, messages: {} });
  }
}

/** Detect the best initial locale. Priority: localStorage → navigator → "ru". */
export function detectLocale(): SupportedLocale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as SupportedLocale;
  }

  const preferred = [...(navigator.languages ?? [navigator.language || "ru"])];
  for (const lang of preferred) {
    const short = lang.split("-")[0];
    if (short && (SUPPORTED_LOCALES as readonly string[]).includes(short)) {
      return short as SupportedLocale;
    }
  }

  return "ru";
}

/** Persist the locale choice and (re)load its catalog. */
export async function changeLocale(locale: SupportedLocale): Promise<void> {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  await loadCatalog(locale);
}

export { i18n };
