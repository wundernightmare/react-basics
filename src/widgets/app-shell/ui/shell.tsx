import { Trans } from "@lingui/react/macro";
import { Languages, Moon, Sun } from "lucide-react";
import { NavLink, Outlet } from "react-router";

import { type SupportedLocale, changeLocale, detectLocale } from "@shared/i18n";
import { cn } from "@shared/lib/cn";
import { resolveTheme, useThemeStore } from "@shared/model/theme";
import { PATHS } from "@shared/routing";
import { Button } from "@shared/ui";

function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const isDark = resolveTheme(mode) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="toggle theme"
      onClick={() => setMode(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function LocaleSwitch() {
  const next: SupportedLocale = detectLocale() === "ru" ? "en" : "ru";
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="switch language"
      onClick={() => void changeLocale(next)}
    >
      <Languages className="size-4" />
      {next.toUpperCase()}
    </Button>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
    isActive ? "bg-muted text-foreground" : "text-muted-foreground",
  );
}

/** Application chrome: header with navigation + the routed page in <Outlet>. */
export function Shell() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <span className="mr-2 font-semibold tracking-tight">frontend-basics</span>
          <nav className="flex items-center gap-1">
            <NavLink to={PATHS.root} end className={navClass}>
              <Trans>Главная</Trans>
            </NavLink>
            <NavLink to={PATHS.tasks} className={navClass}>
              <Trans>Задачи</Trans>
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
