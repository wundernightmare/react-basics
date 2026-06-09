import { describe, expect, it } from "vitest";

import { createTask, deleteTask, listTasks, updateTask } from "./tasks";

// These exercise the real API functions against the MSW handlers + in-memory
// db (see src/app/testing/mocks). `db.reset()` runs in afterEach (setup.ts), so
// each test starts from the same seeded fixtures.
describe("tasks API", () => {
  it("lists the seeded tasks", async () => {
    const tasks = await listTasks();
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => typeof t.id === "string")).toBe(true);
  });

  it("creates a task with status 'todo'", async () => {
    const before = await listTasks();
    const created = await createTask({ title: "Новая задача" });
    expect(created.title).toBe("Новая задача");
    expect(created.status).toBe("todo");

    const after = await listTasks();
    expect(after).toHaveLength(before.length + 1);
  });

  it("updates a task's status", async () => {
    const [first] = await listTasks();
    const updated = await updateTask(first!.id, { status: "done" });
    expect(updated.status).toBe("done");
    expect(updated.updatedAt).not.toBe("");
  });

  it("deletes a task", async () => {
    const before = await listTasks();
    await deleteTask(before[0]!.id);
    const after = await listTasks();
    expect(after).toHaveLength(before.length - 1);
  });

  it("rejects an update to a missing task with a 404 ApiError", async () => {
    await expect(updateTask("does-not-exist", { status: "done" })).rejects.toMatchObject({
      status: 404,
    });
  });
});
