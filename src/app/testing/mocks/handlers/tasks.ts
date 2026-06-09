import { HttpResponse, http } from "msw";
import { z } from "zod";

import { type Task, TaskCreateSchema, TaskSchema, TaskUpdateSchema } from "@entities/task";

import { db } from "../db";
import { notFound, now, problem, typedJson } from "./_utils";

// Handlers register on the same `/api` prefix the client's BASE_URL uses.
const BASE = "/api";

export const tasksHandlers = [
  http.get(`${BASE}/tasks`, () => typedJson(z.array(TaskSchema), db.tasks)),

  http.post(`${BASE}/tasks`, async ({ request }) => {
    const parsed = TaskCreateSchema.safeParse(await request.json());
    if (!parsed.success) return problem(422, "Unprocessable Entity", "Invalid task payload");

    const task: Task = {
      id: db.nextId(),
      title: parsed.data.title,
      status: "todo",
      createdAt: now(),
      updatedAt: now(),
    };
    db.tasks.push(task);
    return typedJson(TaskSchema, task, { status: 201 });
  }),

  http.patch(`${BASE}/tasks/:id`, async ({ params, request }) => {
    const task = db.tasks.find((t) => t.id === params.id);
    if (!task) return notFound("Task not found");

    const parsed = TaskUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return problem(422, "Unprocessable Entity", "Invalid task payload");

    Object.assign(task, parsed.data, { updatedAt: now() });
    return typedJson(TaskSchema, task);
  }),

  http.delete(`${BASE}/tasks/:id`, ({ params }) => {
    const index = db.tasks.findIndex((t) => t.id === params.id);
    if (index === -1) return notFound("Task not found");

    db.tasks.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
