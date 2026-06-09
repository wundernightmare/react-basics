import { setupServer } from "msw/node";

import { tasksHandlers } from "./handlers/tasks";

/** MSW node server for jsdom-based unit tests. Same handlers as the worker. */
export const server = setupServer(...tasksHandlers);
