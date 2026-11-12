export interface ApiConfig {
  registryBase: string;
  schedulerBase: string;
  registryDocs: string;
  schedulerDocs: string;
}

const storageKey = 'qagrid-api-config';
export const defaultConfig: ApiConfig = {
  registryBase: import.meta.env.VITE_REGISTRY_API_URL || '/registry',
  schedulerBase: import.meta.env.VITE_SCHEDULER_API_URL || '/scheduler',
  registryDocs: import.meta.env.VITE_REGISTRY_DOCS_URL || 'http://localhost:8001/docs',
  schedulerDocs: import.meta.env.VITE_SCHEDULER_DOCS_URL || 'http://localhost:8002/docs',
};

export function getApiConfig(): ApiConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}') as Partial<ApiConfig>;
    return { ...defaultConfig, ...saved };
  } catch {
    return defaultConfig;
  }
}

export function saveApiConfig(config: ApiConfig): void {
  localStorage.setItem(storageKey, JSON.stringify(config));
}

export function resetApiConfig(): void {
  localStorage.removeItem(storageKey);
}
