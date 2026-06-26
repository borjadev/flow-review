import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { PaginatedRequestsDto } from '@flow-review/contracts';
import { RequestListPage } from './RequestListPage';
import { renderWithProviders, jsonResponse } from '../../test/test-utils';
import { sampleSummary } from '../../test/fixtures';

function renderPage() {
  return renderWithProviders(<RequestListPage />, { route: '/requests', path: '/requests' });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RequestListPage', () => {
  it('renders rows from mocked data', async () => {
    const payload: PaginatedRequestsDto = {
      items: [sampleSummary],
      page: 1,
      pageSize: 20,
      total: 1,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)));

    renderPage();

    expect(await screen.findByText('Cannot access billing portal')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('shows the empty state when there are no items', async () => {
    const payload: PaginatedRequestsDto = { items: [], page: 1, pageSize: 20, total: 0 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)));

    renderPage();

    expect(await screen.findByText('No requests found')).toBeInTheDocument();
  });

  it('shows the loading state while the request is in flight', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );

    renderPage();

    expect(screen.getByText('Loading requests…')).toBeInTheDocument();
  });

  it('shows the error state when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
          500,
        ),
      ),
    );

    renderPage();

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });
});
