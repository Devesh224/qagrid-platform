import { describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import { apiErrorMessage } from './client';
import { registryApi } from './registry';
import type { Environment } from '../../types/api';

describe('API error messages', () => {
  it('preserves backend detail for conflicts', () => {
    const error = new AxiosError('conflict', 'ERR_BAD_RESPONSE', undefined, undefined,
      { status: 409, data: { detail: 'Time slot overlaps an existing reservation' } } as never);
    expect(apiErrorMessage(error)).toContain('Time slot overlaps');
  });
  it('explains network failures', () => {
    expect(apiErrorMessage(new AxiosError('Network Error'))).toContain('Could not connect');
  });
});

describe('Registry pagination', () => {
  it('loads every page before returning aggregate data', async () => {
    const item = { environment_id: 'id' } as Environment;
    const spy = vi.spyOn(registryApi, 'list')
      .mockResolvedValueOnce({ items: [item], total: 2, limit: 100, offset: 0 })
      .mockResolvedValueOnce({ items: [{ ...item, environment_id: 'id2' }], total: 2, limit: 100, offset: 1 });
    expect((await registryApi.all()).map((row) => row.environment_id)).toEqual(['id', 'id2']);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
