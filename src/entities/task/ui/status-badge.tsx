import { useLingui } from "@lingui/react/macro";

import type { TaskStatus } from "@entities/task/model/task";
import { cn } from "@shared/lib/cn";

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  done: "bg-primary text-primary-foreground",
};

interface Props {
  status: TaskStatus;
}

export function StatusBadge({ status }: Props) {
  const { t } = useLingui();

  const label: Record<TaskStatus, string> = {
    todo: t`К выполнению`,
    in_progress: t`В работе`,
    done: t`Готово`,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {label[status]}
    </span>
  );
}
