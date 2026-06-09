/**
 * Centralised TanStack Query keys. Keeping them in one place avoids typos and
 * makes targeted cache invalidation (`queryClient.invalidateQueries`) explicit.
 */
export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
    list: () => [...queryKeys.tasks.all, "list"] as const,
  },
};
