import { Trans } from "@lingui/react/macro";
import { Link } from "react-router";

import { PATHS } from "@shared/routing";
import { Button } from "@shared/ui";

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">
        <Trans>Страница не найдена</Trans>
      </p>
      <Button variant="outline" asChild>
        <Link to={PATHS.root}>
          <Trans>На главную</Trans>
        </Link>
      </Button>
    </section>
  );
}
