import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, type MemoryRouterProps } from "react-router";

// Activate ru with empty messages — the source strings (Russian) render as-is,
// so tests can assert on the literal text in the components.
i18n.loadAndActivate({ locale: "ru", messages: {} });

interface WrapperOptions {
  route?: string;
  routerProps?: MemoryRouterProps;
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper({ route = "/", routerProps }: WrapperOptions = {}) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider i18n={i18n}>
          <MemoryRouter initialEntries={[route]} {...routerProps}>
            {children}
          </MemoryRouter>
        </I18nProvider>
      </QueryClientProvider>
    );
  };
}

/**
 * Render a component wrapped with I18nProvider + QueryClientProvider +
 * MemoryRouter. Use instead of raw `render()` for anything that uses Lingui,
 * TanStack Query, or React Router.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & WrapperOptions,
): ReturnType<typeof render> {
  const { route, routerProps, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: createWrapper({ route, routerProps }),
    ...renderOptions,
  });
}
