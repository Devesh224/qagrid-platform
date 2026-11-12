import axios, { AxiosError } from 'axios';

export function apiClient(baseURL: string) {
  return axios.create({ baseURL: baseURL.replace(/\/$/, ''), timeout: 10000 });
}

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (!response) {
      return error.code === 'ECONNABORTED'
        ? 'The request timed out. Check the service and try again.'
        : 'Could not connect to the service. Check its address and health.';
    }
    const detail = response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const messages = detail.map((item) => item?.msg).filter(Boolean);
      if (messages.length) return messages.join('; ');
    }
    const code = response.status;
    if (code === 404) return 'The requested record was not found.';
    if (code === 409) return 'The request conflicts with the current state.';
    if (code === 422) return 'Please check the entered values.';
    if (code === 503) return 'A required service is unavailable.';
    if (code >= 500) return 'The service or local API proxy is unavailable. Check the backend and try again.';
    return 'The service returned an unexpected error.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

export function isHttpStatus(error: unknown, status: number): boolean {
  return error instanceof AxiosError && error.response?.status === status;
}
