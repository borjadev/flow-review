import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import {
  DemoUserContext,
  type DemoUserContextValue,
} from '../shared/hooks/demo-user-context';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderWithProvidersOptions {
  /** Initial URL for the in-memory router. */
  route?: string;
  /** Route path pattern the rendered element is mounted at. */
  path?: string;
  /** Selected demo user id provided through context. */
  userId?: string | null;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult {
  const { route = '/', path = '*', userId = 'user-1', queryClient = createTestQueryClient() } =
    options;

  const demoUserValue: DemoUserContextValue = {
    selectedUserId: userId,
    setSelectedUserId: vi.fn(),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <DemoUserContext.Provider value={demoUserValue}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        </MemoryRouter>
      </DemoUserContext.Provider>
    </QueryClientProvider>,
  );
}

/** Builds a minimal Response-like object for stubbing global fetch in tests. */
export function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}
