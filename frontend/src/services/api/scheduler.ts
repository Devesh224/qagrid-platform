import { apiClient } from './client';
import { getApiConfig } from './config';
import type { Availability, Page, Reservation, ReservationCreate, ReservationStatus } from '../../types/api';

const path = '/api/v1/reservations';
const client = () => apiClient(getApiConfig().schedulerBase);

export interface ReservationFilters {
  requester?: string;
  environment_id?: string;
  status?: ReservationStatus | '';
  limit?: number;
  offset?: number;
}

export const schedulerApi = {
  async list(filters: ReservationFilters = {}): Promise<Page<Reservation>> {
    return (await client().get<Page<Reservation>>(path, { params: filters })).data;
  },
  async get(id: string): Promise<Reservation> {
    return (await client().get<Reservation>(path + '/' + id)).data;
  },
  async availability(environment_id: string, start_time: string, end_time: string): Promise<Availability> {
    return (await client().get<Availability>(path + '/availability', {
      params: { environment_id, start_time, end_time },
    })).data;
  },
  async create(input: ReservationCreate): Promise<Reservation> {
    return (await client().post<Reservation>(path, input)).data;
  },
  async cancel(id: string): Promise<Reservation> {
    return (await client().patch<Reservation>(path + '/' + id + '/cancel')).data;
  },
  async complete(id: string): Promise<Reservation> {
    return (await client().patch<Reservation>(path + '/' + id + '/complete')).data;
  },
  async all(): Promise<Reservation[]> {
    const first = await this.list({ limit: 100, offset: 0 });
    const items = [...first.items];
    while (items.length < first.total) {
      const page = await this.list({ limit: 100, offset: items.length });
      if (page.items.length === 0) throw new Error('Scheduler pagination ended before total records were fetched.');
      items.push(...page.items);
    }
    return items;
  },
};
