import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { type Task, type TaskCreate, TaskSchema, type TaskUpdate } from "@entities/task";
import { api } from "@shared/api/client";

import { queryKeys } from "./keys";

// ─── API functions ────────────────────────────────────────────────────────────

export function listTasks(): Promise<Task[]> {
  return api.get("/tasks", z.array(TaskSchema));
}

export function createTask(body: TaskCreate): Promise<Task> {
  return api.post("/tasks", TaskSchema, body);
}

export function updateTask(id: string, body: TaskUpdate): Promise<Task> {
  return api.patch(`/tasks/${id}`, TaskSchema, body);
}

export function deleteTask(id: string): Promise<void> {
  return api.delete(`/tasks/${id}`, z.void());
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.list(),
    queryFn: listTasks,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TaskCreate) => createTask(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TaskUpdate }) => updateTask(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}
