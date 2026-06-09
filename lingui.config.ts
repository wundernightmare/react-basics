import type { LinguiConfig } from "@lingui/conf";
import { formatter } from "@lingui/format-po";

// Source locale is Russian: components are written with Russian source strings
// inside `<Trans>` / `t\`\`` macros, and `lingui extract` collects them into
// `src/locales/{locale}/messages.po`. `lingui compile --typescript` then emits
// the runtime `messages.ts` catalogs that `src/shared/i18n` loads on demand.
const config: LinguiConfig = {
  locales: ["ru", "en"],
  sourceLocale: "ru",
  catalogs: [
    {
      path: "src/locales/{locale}/messages",
      include: ["src"],
      exclude: ["**/node_modules/**"],
    },
  ],
  format: formatter({ lineNumbers: true }),
};

export default config;
