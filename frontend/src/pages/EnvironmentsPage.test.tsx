import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnvironmentsPage } from './EnvironmentsPage';
import { registryApi } from '../services/api/registry';
import type { Environment } from '../types/api';

vi.mock('../services/api/registry', () => ({
  registryApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), changeStatus: vi.fn(), changeHealth: vi.fn() },
}));
const environment: Environment = {
  environment_id: 'e1', name: 'Chrome Windows', environment_type: 'BROWSER',
  platform: 'Desktop', operating_system: 'Windows 11', browser: 'Chrome', browser_version: null,
  status: 'ACTIVE', health_status: 'HEALTHY', maintenance_reason: null,
  maintenance_started_at: null, maintenance_ends_at: null,
  created_at: '2026-11-10T10:00:00Z', updated_at: '2026-11-10T10:00:00Z',
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(registryApi.list).mockResolvedValue({ items: [environment], total: 1, limit: 10, offset: 0 });
});
describe('Environments', () => {
  it('renders the Registry response', async () => {
    render(<EnvironmentsPage />);
    expect(await screen.findByText('Chrome Windows')).toBeInTheDocument();
    expect(screen.getByText('Windows 11')).toBeInTheDocument();
  });
  it('registers with the backend contract', async () => {
    vi.mocked(registryApi.create).mockResolvedValue(environment);
    const user = userEvent.setup();
    render(<EnvironmentsPage />);
    await user.click(screen.getByRole('button', { name: 'Register environment' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: /Environment name/ }), 'Firefox Linux');
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    await waitFor(() => expect(registryApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Firefox Linux', environment_type: 'BROWSER' }),
    ));
  });
  it('shows a Registry failure', async () => {
    vi.mocked(registryApi.list).mockRejectedValue(new Error('Registry offline'));
    render(<EnvironmentsPage />);
    expect(await screen.findByText('Registry offline')).toBeInTheDocument();
  });
});

