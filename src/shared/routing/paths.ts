/**
 * Centralised route table. Pages and links reference these constants instead of
 * hard-coding string literals so a route rename is a single-line change.
 */
export const PATHS = {
  root: "/",
  tasks: "/tasks",
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];
