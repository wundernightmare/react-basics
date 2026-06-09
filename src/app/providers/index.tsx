import type { ReactNode } from "react";

import { I18nProvider } from "./i18n";
import { QueryProvider } from "./query";
import { ThemeProvider } from "./theme";

interface Props {
  children: ReactNode;
}

export function Providers({ children }: Props) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryProvider>{children}</QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
