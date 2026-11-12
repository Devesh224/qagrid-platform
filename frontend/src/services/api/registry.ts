import { apiClient } from './client';
import { getApiConfig } from './config';
import type { Environment, EnvironmentCreate, EnvironmentStatus, EnvironmentType, EnvironmentUpdate, HealthStatus, Page } from '../../types/api';

const path = '/api/v1/environments';
const client = () => apiClient(getApiConfig().registryBase);

export interface EnvironmentFilters {
  name?: string;
  environment_type?: EnvironmentType | '';
  operating_system?: string;
  browser?: string;
  status?: EnvironmentStatus | '';
  health_status?: HealthStatus | '';
  limit?: number;
  offset?: number;
}

export const registryApi = {
  async list(filters: EnvironmentFilters = {}): Promise<Page<Environment>> {
    return (await client().get<Page<Environment>>(path, { params: filters })).data;
  },
  async available(limit = 100, offset = 0): Promise<Page<Environment>> {
    return (await client().get<Page<Environment>>(path + '/available', { params: { limit, offset } })).data;
  },
  async get(id: string): Promise<Environment> {
    return (await client().get<Environment>(path + '/' + id)).data;
  },
  async create(input: EnvironmentCreate): Promise<Environment> {
    return (await client().post<Environment>(path, input)).data;
  },
  async update(id: string, input: EnvironmentUpdate): Promise<Environment> {
    return (await client().patch<Environment>(path + '/' + id, input)).data;
  },
  async changeStatus(id: string, status: EnvironmentStatus, maintenance_reason?: string): Promise<Environment> {
    return (await client().patch<Environment>(path + '/' + id + '/status', { status, maintenance_reason })).data;
  },
  async changeHealth(id: string, health_status: HealthStatus): Promise<Environment> {
    return (await client().patch<Environment>(path + '/' + id + '/health', { health_status })).data;
  },
  async all(): Promise<Environment[]> {
    const first = await this.list({ limit: 100, offset: 0 });
    const items = [...first.items];
    while (items.length < first.total) {
      const page = await this.list({ limit: 100, offset: items.length });
      if (page.items.length === 0) throw new Error('Registry pagination ended before total records were fetched.');
      items.push(...page.items);
    }
    return items;
  },
  async allAvailable(): Promise<Environment[]> {
    const first = await this.available(100, 0);
    const items = [...first.items];
    while (items.length < first.total) {
      const page = await this.available(100, items.length);
      if (page.items.length === 0) throw new Error('Registry available pagination ended early.');
      items.push(...page.items);
    }
    return items;
  },
};
