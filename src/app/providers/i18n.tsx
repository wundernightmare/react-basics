import { I18nProvider as LinguiProvider } from "@lingui/react";
import { type ReactNode, useEffect, useState } from "react";

import { detectLocale, i18n, loadCatalog } from "@shared/i18n";

interface Props {
  children: ReactNode;
}

export function I18nProvider({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const locale = detectLocale();
    document.documentElement.lang = locale;
    void loadCatalog(locale).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <LinguiProvider i18n={i18n}>{children}</LinguiProvider>;
}
