import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewPanel } from './ReviewPanel';
import { renderWithProviders } from '../../test/test-utils';
import { sampleClassification } from '../../test/fixtures';

describe('ReviewPanel', () => {
  it('submits modified fields when approving with corrections', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ReviewPanel proposed={sampleClassification} onSubmit={onSubmit} isSubmitting={false} />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Category'), 'ACCOUNT');
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      decision: 'APPROVED',
      classification: { category: 'ACCOUNT', priority: 'HIGH', department: 'FINANCE' },
    });
  });

  it('blocks rejection without a comment and shows an error', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ReviewPanel proposed={sampleClassification} onSubmit={onSubmit} isSubmitting={false} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText('A comment is required to reject a classification.'),
    ).toBeInTheDocument();
  });

  it('submits a rejection when a comment is provided', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ReviewPanel proposed={sampleClassification} onSubmit={onSubmit} isSubmitting={false} />,
    );

    await userEvent.type(screen.getByLabelText('Comment'), 'Wrong department.');
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));

    expect(onSubmit).toHaveBeenCalledWith({
      decision: 'REJECTED',
      comment: 'Wrong department.',
    });
  });
});
