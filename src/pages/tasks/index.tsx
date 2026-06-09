import { Trans } from "@lingui/react/macro";

import { useDeleteTask, useTasks, useUpdateTask } from "@/api/tasks";
import { type Task, TaskItem } from "@entities/task";
import { CreateTaskForm } from "@features/create-task";

export function TasksPage() {
  const { data: tasks, isPending, isError, error, refetch } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggle = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      body: { status: task.status === "done" ? "todo" : "done" },
    });
  };

  const handleDelete = (task: Task) => {
    deleteTask.mutate(task.id);
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          <Trans>Задачи</Trans>
        </h1>
        <p className="text-sm text-muted-foreground">
          <Trans>Пример CRUD: данные приходят из MSW-моков в режиме разработки и тестов.</Trans>
        </p>
      </div>

      <CreateTaskForm />

      {isPending ? (
        <p className="text-sm text-muted-foreground" role="status">
          <Trans>Загрузка…</Trans>
        </p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-2" role="alert">
          <p className="text-sm text-destructive">{error.message}</p>
          <button className="text-sm underline" onClick={() => void refetch()}>
            <Trans>Повторить</Trans>
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          <Trans>Пока нет задач — добавьте первую.</Trans>
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
              busy={updateTask.isPending || deleteTask.isPending}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
