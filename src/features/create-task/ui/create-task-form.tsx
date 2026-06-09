import { zodResolver } from "@hookform/resolvers/zod";
import { useLingui } from "@lingui/react/macro";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import { useCreateTask } from "@/api/tasks";
import { type TaskCreate, TaskCreateSchema } from "@entities/task";
import { Button, Input } from "@shared/ui";

/**
 * Adds a task. Validation is driven by the same Zod schema the API layer uses
 * (`TaskCreateSchema`), so the form and the request body can never drift.
 */
export function CreateTaskForm() {
  const { t } = useLingui();
  const createTask = useCreateTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskCreate>({
    resolver: zodResolver(TaskCreateSchema),
    defaultValues: { title: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createTask.mutateAsync(values);
    reset();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2" noValidate>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            placeholder={t`Что нужно сделать?`}
            aria-label={t`Название задачи`}
            aria-invalid={errors.title ? true : undefined}
            {...register("title")}
          />
          {errors.title ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errors.title.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={createTask.isPending}>
          <Plus className="size-4" />
          {t`Добавить`}
        </Button>
      </div>
    </form>
  );
}
