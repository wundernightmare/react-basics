import { Trans } from "@lingui/react/macro";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import { PATHS } from "@shared/routing";
import { Button } from "@shared/ui";

export function HomePage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          <Trans>Шаблон фронтенда</Trans>
        </h1>
        <p className="max-w-prose text-muted-foreground">
          <Trans>
            Vite + React, слои Feature-Sliced Design, TanStack Query, Zod-валидация ответов,
            интернационализация на Lingui и тестовый стенд на Vitest + MSW. Откройте раздел задач,
            чтобы увидеть полный CRUD-пример.
          </Trans>
        </p>
      </div>

      <div>
        <Button asChild>
          <Link to={PATHS.tasks}>
            <Trans>Перейти к задачам</Trans>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
