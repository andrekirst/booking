export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export const apiConfig: Record<string, ApiConfig> = {
  development: {
    baseUrl: 'http://localhost:5000',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  test: {
    baseUrl: 'http://localhost:5000',
    timeout: 5000,
    retryAttempts: 1,
    retryDelay: 500,
  },
  production: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.booking.com',
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  mock: {
    baseUrl: 'http://localhost:3000', // Not used for mock client
    timeout: 1000,
    retryAttempts: 1,
    retryDelay: 100,
  },
};

export const getApiConfig = (environment: string = 'development'): ApiConfig => {
  return apiConfig[environment] || apiConfig.development;
};