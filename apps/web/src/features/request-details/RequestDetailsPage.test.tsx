import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { RequestDetailsDto, RequestStatus } from '@flow-review/contracts';
import { RequestDetailsPage } from './RequestDetailsPage';
import { renderWithProviders, jsonResponse } from '../../test/test-utils';
import { detailsWithStatus } from '../../test/fixtures';

function stubFetch(details: RequestDetailsDto) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/audit-log')) {
        return Promise.resolve(jsonResponse([]));
      }
      return Promise.resolve(jsonResponse(details));
    }),
  );
}

function renderDetails(status: RequestStatus) {
  stubFetch(detailsWithStatus(status));
  return renderWithProviders(<RequestDetailsPage />, {
    route: '/requests/req-1',
    path: '/requests/:requestId',
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RequestDetailsPage actions by status', () => {
  it('shows the Classify button for SUBMITTED requests', async () => {
    renderDetails('SUBMITTED');
    expect(await screen.findByRole('button', { name: 'Classify' })).toBeInTheDocument();
  });

  it('shows the Retry button for CLASSIFICATION_FAILED requests', async () => {
    renderDetails('CLASSIFICATION_FAILED');
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the retry classification button for REJECTED requests', async () => {
    renderDetails('REJECTED');
    expect(
      await screen.findByRole('button', { name: 'Retry classification' }),
    ).toBeInTheDocument();
  });

  it('shows the review panel for AWAITING_REVIEW requests', async () => {
    renderDetails('AWAITING_REVIEW');
    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('shows the approved banner for APPROVED requests', async () => {
    renderDetails('APPROVED');
    expect(await screen.findByText(/This request has been approved/)).toBeInTheDocument();
  });
});
