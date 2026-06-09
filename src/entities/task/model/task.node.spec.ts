import { describe, expect, it } from "vitest";

import { TaskCreateSchema, TaskSchema, TaskUpdateSchema } from "./task";

const VALID_TASK = {
  id: "task_1",
  title: "Написать тест",
  status: "todo" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("TaskSchema", () => {
  it("parses a well-formed task", () => {
    expect(TaskSchema.parse(VALID_TASK)).toEqual(VALID_TASK);
  });

  it("rejects an unknown status", () => {
    expect(TaskSchema.safeParse({ ...VALID_TASK, status: "archived" }).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(TaskSchema.safeParse({ ...VALID_TASK, title: "" }).success).toBe(false);
  });
});

describe("TaskCreateSchema", () => {
  it("trims whitespace around the title", () => {
    expect(TaskCreateSchema.parse({ title: "  hello  " })).toEqual({ title: "hello" });
  });

  it("rejects a blank title", () => {
    expect(TaskCreateSchema.safeParse({ title: "   " }).success).toBe(false);
  });
});

describe("TaskUpdateSchema", () => {
  it("accepts a partial update with only a status", () => {
    expect(TaskUpdateSchema.parse({ status: "done" })).toEqual({ status: "done" });
  });

  it("accepts an empty object (no-op update)", () => {
    expect(TaskUpdateSchema.parse({})).toEqual({});
  });
});
