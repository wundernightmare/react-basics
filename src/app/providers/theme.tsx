import { type ReactNode, useEffect } from "react";

import { resolveTheme, useThemeStore } from "@shared/model/theme";

interface Props {
  children: ReactNode;
}

/**
 * Applies the persisted theme to <html> and keeps it in sync with the OS
 * preference while the user is on "system" mode. The initial paint is already
 * handled by the inline script in index.html — this provider takes over once
 * React mounts so theme changes are reactive.
 */
export function ThemeProvider({ children }: Props) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const apply = () => {
      const effective = resolveTheme(mode);
      document.documentElement.classList.toggle("dark", effective === "dark");
      document.documentElement.style.colorScheme = effective;
    };
    apply();

    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);

  return children;
}
