import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateRequestForm } from './CreateRequestForm';
import { renderWithProviders } from '../../test/test-utils';

describe('CreateRequestForm', () => {
  it('renders all fields', () => {
    renderWithProviders(<CreateRequestForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(screen.getByLabelText('Requester name')).toBeInTheDocument();
    expect(screen.getByLabelText('Requester email')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('shows validation errors and does not submit when empty', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<CreateRequestForm onSubmit={onSubmit} isSubmitting={false} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create request' }));

    const errors = await screen.findAllByRole('alert');
    expect(errors.length).toBeGreaterThan(0);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits typed values when valid', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<CreateRequestForm onSubmit={onSubmit} isSubmitting={false} />);

    await userEvent.type(screen.getByLabelText('Requester name'), 'Grace Hopper');
    await userEvent.type(screen.getByLabelText('Requester email'), 'grace@example.com');
    await userEvent.type(screen.getByLabelText('Subject'), 'Billing issue');
    await userEvent.type(screen.getByLabelText('Description'), 'I cannot access the portal.');
    await userEvent.click(screen.getByRole('button', { name: 'Create request' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      {
        requesterName: 'Grace Hopper',
        requesterEmail: 'grace@example.com',
        subject: 'Billing issue',
        description: 'I cannot access the portal.',
      },
      expect.anything(),
    );
  });
});
