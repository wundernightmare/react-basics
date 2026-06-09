import { Trans } from "@lingui/react/macro";
import { Check, RotateCcw, Trash2 } from "lucide-react";

import type { Task } from "@entities/task/model/task";
import { Button } from "@shared/ui";

import { StatusBadge } from "./status-badge";

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  busy?: boolean;
}

/**
 * Presentational row for a single task. All mutations are delegated to the
 * parent via callbacks so the entity stays free of data-fetching concerns.
 */
export function TaskItem({ task, onToggle, onDelete, busy = false }: Props) {
  const isDone = task.status === "done";

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <span className="flex-1 truncate text-sm" data-done={isDone}>
        <span className={isDone ? "text-muted-foreground line-through" : ""}>{task.title}</span>
      </span>

      <StatusBadge status={task.status} />

      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() => onToggle(task)}
        aria-label={isDone ? "reopen" : "complete"}
      >
        {isDone ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
        {isDone ? <Trans>Вернуть</Trans> : <Trans>Готово</Trans>}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        disabled={busy}
        onClick={() => onDelete(task)}
        aria-label="delete"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
