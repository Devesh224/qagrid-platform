import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OverviewPage } from './OverviewPage';
import { registryApi } from '../services/api/registry';
import { schedulerApi } from '../services/api/scheduler';
import { checkService } from '../services/api/health';
import type { Environment, Reservation } from '../types/api';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Cell: () => null, Tooltip: () => null, Legend: () => null,
}));
vi.mock('../services/api/registry', () => ({ registryApi: { all: vi.fn() } }));
vi.mock('../services/api/scheduler', () => ({ schedulerApi: { all: vi.fn() } }));
vi.mock('../services/api/health', () => ({ checkService: vi.fn() }));

const environment: Environment = {
  environment_id: 'e1', name: 'Chrome Windows', environment_type: 'BROWSER',
  platform: 'Desktop', operating_system: 'Windows', browser: 'Chrome', browser_version: null,
  status: 'ACTIVE', health_status: 'HEALTHY', maintenance_reason: null,
  maintenance_started_at: null, maintenance_ends_at: null,
  created_at: '2026-11-10T10:00:00Z', updated_at: '2026-11-10T10:00:00Z',
};
const reservation: Reservation = {
  reservation_id: 'r1', environment_id: 'e1', requester: 'qa@example.com',
  purpose: 'Regression', start_time: '2099-01-01T10:00:00Z', end_time: '2099-01-01T11:00:00Z',
  status: 'CONFIRMED', created_at: '2026-11-10T10:00:00Z', updated_at: '2026-11-10T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkService).mockResolvedValue({ status: 'ready' });
});

describe('Overview', () => {
  it('renders counts and lists from API data', async () => {
    vi.mocked(registryApi.all).mockResolvedValue([environment]);
    vi.mocked(schedulerApi.all).mockResolvedValue([reservation]);
    render(<OverviewPage />);
    expect(await screen.findByText('Chrome Windows')).toBeInTheDocument();
    expect(screen.getByText('qa@example.com')).toBeInTheDocument();
    const total = screen.getByText('Total registered').parentElement;
    expect(total).toHaveTextContent('1');
  });

  it('shows unavailable instead of a made-up metric when Registry fails', async () => {
    vi.mocked(registryApi.all).mockRejectedValue(new Error('Registry offline'));
    vi.mocked(schedulerApi.all).mockResolvedValue([]);
    render(<OverviewPage />);
    await waitFor(() => expect(screen.getByText(/Environment data: Registry offline/)).toBeInTheDocument());
    expect(screen.getByText('Total registered').parentElement).toHaveTextContent('Unavailable');
  });
});
