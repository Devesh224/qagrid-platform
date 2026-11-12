import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthPage } from './HealthPage';
import { checkService } from '../services/api/health';

vi.mock('../services/api/health', () => ({ checkService: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

describe('System Health', () => {
  it('reports both services when their endpoints respond', async () => {
    vi.mocked(checkService).mockImplementation(async (_, kind) => ({ status: kind === 'live' ? 'ok' : 'ready' }));
    render(<HealthPage />);
    expect((await screen.findAllByText('Available')).length).toBe(2);
    expect(screen.getAllByText('Ready').length).toBe(2);
  });
  it('shows an unavailable service and its error without crashing', async () => {
    vi.mocked(checkService).mockImplementation(async (service, kind) => {
      if (service === 'scheduler') throw new Error('Scheduler offline');
      return { status: kind === 'live' ? 'ok' : 'ready' };
    });
    render(<HealthPage />);
    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Scheduler offline/)).toBeInTheDocument();
  });
});
