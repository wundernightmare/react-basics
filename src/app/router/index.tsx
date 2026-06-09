import { RouterProvider, createBrowserRouter } from "react-router";

import { NotFoundPage } from "@pages/not-found";
import { Shell } from "@widgets/app-shell";

import { RouteErrorFallback } from "./route-error-fallback";

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Each page is its own chunk. `lazy` returns `{ Component }` per the React
// Router v7 object-route API.

const lazyHome = async () => {
  const { HomePage } = await import("@pages/home");
  return { Component: HomePage };
};

const lazyTasks = async () => {
  const { TasksPage } = await import("@pages/tasks");
  return { Component: TasksPage };
};

const router = createBrowserRouter([
  {
    path: "/",
    Component: Shell,
    ErrorBoundary: RouteErrorFallback,
    children: [
      { index: true, lazy: lazyHome },
      { path: "tasks", lazy: lazyTasks },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
