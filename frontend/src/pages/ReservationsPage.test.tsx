import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { ReservationsPage } from './ReservationsPage';
import { registryApi } from '../services/api/registry';
import { schedulerApi } from '../services/api/scheduler';
import type { Environment, Reservation } from '../types/api';

vi.mock('../services/api/registry', () => ({
  registryApi: { all: vi.fn(), allAvailable: vi.fn() },
}));
vi.mock('../services/api/scheduler', () => ({
  schedulerApi: { list: vi.fn(), availability: vi.fn(), create: vi.fn(), cancel: vi.fn(), complete: vi.fn() },
}));
const environment: Environment = {
  environment_id: 'e1', name: 'Chrome Windows', environment_type: 'BROWSER',
  platform: 'Desktop', operating_system: 'Windows', browser: 'Chrome', browser_version: null,
  status: 'ACTIVE', health_status: 'HEALTHY', maintenance_reason: null,
  maintenance_started_at: null, maintenance_ends_at: null,
  created_at: '2026-11-10T10:00:00Z', updated_at: '2026-11-10T10:00:00Z',
};
const reservation: Reservation = {
  reservation_id: 'r1', environment_id: 'e1', requester: 'qa@example.com', purpose: 'Regression',
  start_time: '2099-01-01T10:00:00Z', end_time: '2099-01-01T11:00:00Z',
  status: 'CONFIRMED', created_at: '2026-11-10T10:00:00Z', updated_at: '2026-11-10T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(schedulerApi.list).mockResolvedValue({ items: [reservation], total: 1, limit: 10, offset: 0 });
  vi.mocked(registryApi.all).mockResolvedValue([environment]);
  vi.mocked(registryApi.allAvailable).mockResolvedValue([environment]);
});

async function fillBooking() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'New reservation' }));
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('combobox', { name: 'Environment' }));
  await user.click(await screen.findByRole('option', { name: /Chrome Windows/ }));
  await user.type(within(dialog).getByRole('textbox', { name: /Requester/ }), 'qa@example.com');
  await user.type(within(dialog).getByRole('textbox', { name: /Purpose/ }), 'Regression');
  return { user, dialog };
}

describe('Reservations', () => {
  it('renders live Scheduler rows', async () => {
    render(<ReservationsPage />);
    expect(await screen.findByText('qa@example.com')).toBeInTheDocument();
    expect(screen.getByText('Chrome Windows')).toBeInTheDocument();
  });

  it('rejects a past start time before calling Scheduler', async () => {
    render(<ReservationsPage />);
    const { user, dialog } = await fillBooking();
    fireEvent.change(within(dialog).getByLabelText(/Start time/), { target: { value: '2020-01-01T10:00' } });
    fireEvent.change(within(dialog).getByLabelText(/End time/), { target: { value: '2020-01-01T11:00' } });
    await user.click(within(dialog).getByRole('button', { name: 'Create reservation' }));
    expect(await within(dialog).findByText('Start must be in the future')).toBeInTheDocument();
    expect(schedulerApi.create).not.toHaveBeenCalled();
  });

  it('shows the backend overlap message on a 409', async () => {
    const response = { status: 409, data: { detail: 'Time slot overlaps an existing reservation' } } as never;
    vi.mocked(schedulerApi.create).mockRejectedValue(new AxiosError('conflict', 'ERR_BAD_RESPONSE', undefined, undefined, response));
    render(<ReservationsPage />);
    const { user, dialog } = await fillBooking();
    await user.click(within(dialog).getByRole('button', { name: 'Create reservation' }));
    expect(await within(dialog).findByText('Time slot overlaps an existing reservation')).toBeInTheDocument();
  });

  it('asks for confirmation before cancellation', async () => {
    vi.mocked(schedulerApi.cancel).mockResolvedValue({ ...reservation, status: 'CANCELLED' });
    render(<ReservationsPage />);
    const cancel = await screen.findByRole('button', { name: 'Cancel' });
    await userEvent.setup().click(cancel);
    expect(schedulerApi.cancel).not.toHaveBeenCalled();
    await userEvent.setup().click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel reservation' }));
    await waitFor(() => expect(schedulerApi.cancel).toHaveBeenCalledWith('r1'));
  });
});
