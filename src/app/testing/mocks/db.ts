import type { Task } from "@entities/task";

function clone<T>(value: T): T {
  return structuredClone(value);
}

// Fixed seed used by every test and by the demo/dev MSW worker. `db.reset()`
// restores this exact set, so tests never bleed state into one another.
const SEED_TASKS: Task[] = [
  {
    id: "task_1",
    title: "Прочитать README",
    status: "done",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "task_2",
    title: "Запустить pnpm dev",
    status: "in_progress",
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "task_3",
    title: "Написать первый тест",
    status: "todo",
    createdAt: "2026-01-03T10:00:00.000Z",
    updatedAt: "2026-01-03T10:00:00.000Z",
  },
];

/**
 * In-memory store shared by all MSW handlers. Mutations (POST/PATCH/DELETE)
 * write back here so subsequent GETs observe the change — this is what makes
 * the handlers behavioural rather than dumb static stubs.
 */
class MockDatabase {
  tasks: Task[] = [];
  private seq = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.tasks = clone(SEED_TASKS);
    this.seq = SEED_TASKS.length;
  }

  nextId(): string {
    this.seq += 1;
    return `task_${this.seq}`;
  }
}

export const db = new MockDatabase();
