import { apiClient } from './client';
import { getApiConfig } from './config';
import type { HealthCheck } from '../../types/api';

export async function checkService(which: 'registry' | 'scheduler', kind: 'live' | 'ready'): Promise<HealthCheck> {
  const config = getApiConfig();
  const base = which === 'registry' ? config.registryBase : config.schedulerBase;
  return (await apiClient(base).get<HealthCheck>('/health/' + kind, { timeout: 5000 })).data;
}
