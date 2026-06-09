import { describe, expect, it } from "vitest";

import { createTask, deleteTask, listTasks, updateTask } from "@/api/tasks";

// Integration test (node env, no DOM): exercises the full task lifecycle
// through the real API client → the MSW handlers → the in-memory db, asserting
// state carries across operations. The MSW server + db reset are wired up by
// src/app/testing/setup.node.ts. Run via `pnpm test:run` or `pnpm test:node`.

describe("tasks lifecycle (client ↔ MSW ↔ db)", () => {
  it("creates, updates and deletes a task end to end", async () => {
    const initial = await listTasks();
    const startCount = initial.length;
    expect(startCount).toBeGreaterThan(0);

    // create → appears in the list with status "todo"
    const created = await createTask({ title: "Интеграционная задача" });
    expect(created.status).toBe("todo");
    expect(await listTasks()).toHaveLength(startCount + 1);

    // update → status persists on the next fetch, updatedAt moves forward
    const done = await updateTask(created.id, { status: "done" });
    expect(done.status).toBe("done");
    expect(Date.parse(done.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.updatedAt));
    const refetched = (await listTasks()).find((t) => t.id === created.id);
    expect(refetched?.status).toBe("done");

    // delete → gone, count back to the start
    await deleteTask(created.id);
    expect(await listTasks()).toHaveLength(startCount);
  });

  it("surfaces a 404 ApiError for an unknown id", async () => {
    await expect(updateTask("missing", { status: "done" })).rejects.toMatchObject({ status: 404 });
  });

  it("resets db state between tests (no bleed from the previous case)", async () => {
    // If the lifecycle test above leaked, this count would drift.
    const tasks = await listTasks();
    expect(tasks.some((t) => t.title === "Интеграционная задача")).toBe(false);
  });
});
