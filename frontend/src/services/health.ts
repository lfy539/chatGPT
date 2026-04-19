import api from './api';

export type HealthStatus = {
  status: string;
  timestamp: string;
  service: string;
};

export const checkHealth = async (): Promise<HealthStatus> => {
  const response = await api.get<HealthStatus>('/health');
  return response.data;
};
