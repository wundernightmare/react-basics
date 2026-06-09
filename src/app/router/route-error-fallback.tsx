import { Trans } from "@lingui/react/macro";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";

import { PATHS } from "@shared/routing";
import { Button } from "@shared/ui";

/**
 * Rendered by React Router when a route loader/component throws. Keeps the
 * crash contained to the routed area instead of taking down the whole app.
 */
export function RouteErrorFallback() {
  const error = useRouteError();

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        <Trans>Что-то пошло не так</Trans>
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">{detail}</p>
      <Button asChild variant="outline">
        <Link to={PATHS.root}>
          <Trans>На главную</Trans>
        </Link>
      </Button>
    </main>
  );
}
