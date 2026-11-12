export type EnvironmentType = 'BROWSER' | 'MOBILE' | 'API';
export type EnvironmentStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
export type HealthStatus = 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN';
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Environment {
  environment_id: string;
  name: string;
  environment_type: EnvironmentType;
  platform: string | null;
  operating_system: string | null;
  browser: string | null;
  browser_version: string | null;
  status: EnvironmentStatus;
  health_status: HealthStatus;
  maintenance_reason: string | null;
  maintenance_started_at: string | null;
  maintenance_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentCreate {
  name: string;
  environment_type: EnvironmentType;
  platform?: string | null;
  operating_system?: string | null;
  browser?: string | null;
  browser_version?: string | null;
}
export type EnvironmentUpdate = Partial<EnvironmentCreate>;

export interface Reservation {
  reservation_id: string;
  environment_id: string;
  requester: string;
  purpose: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}
export interface ReservationCreate {
  environment_id: string;
  requester: string;
  purpose: string;
  start_time: string;
  end_time: string;
}
export interface Availability {
  environment_id: string;
  start_time: string;
  end_time: string;
  available: boolean;
}
export interface HealthCheck {
  status: 'ok' | 'ready';
}
