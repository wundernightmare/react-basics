import { z } from "zod";

/** The three states a task moves through. */
export const TaskStatusSchema = z.enum(["todo", "in_progress", "done"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TASK_STATUSES = TaskStatusSchema.options;

/** Server representation of a task — also the shape MSW handlers return. */
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  status: TaskStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

/** Request body for creating a task. */
export const TaskCreateSchema = z.object({
  title: z.string().trim().min(1, "Введите название").max(200),
});
export type TaskCreate = z.infer<typeof TaskCreateSchema>;

/** Request body for a partial update (title and/or status). */
export const TaskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  status: TaskStatusSchema.optional(),
});
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
