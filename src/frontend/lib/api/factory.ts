import { ApiClient, HttpApiClient } from './client';
import { MockApiClient } from './mock-client';
export { ApiError } from './errors';

export type ApiEnvironment = 'development' | 'test' | 'production' | 'mock';

export class ApiFactory {
  private static instance: ApiClient | null = null;
  private static environment: ApiEnvironment = 'development';

  static createClient(environment?: ApiEnvironment): ApiClient {
    const env = environment || this.getEnvironment();
    
    switch (env) {
      case 'mock':
      case 'test':
        return new MockApiClient();
      case 'development':
      case 'production':
      default:
        return new HttpApiClient();
    }
  }

  static getInstance(environment?: ApiEnvironment): ApiClient {
    if (!this.instance || (environment && environment !== this.environment)) {
      this.environment = environment || this.getEnvironment();
      this.instance = this.createClient(this.environment);
    }
    return this.instance;
  }

  static setEnvironment(environment: ApiEnvironment): void {
    this.environment = environment;
    this.instance = null; // Force recreation on next getInstance call
  }

  private static getEnvironment(): ApiEnvironment {
    // Check for explicit environment variable
    const explicitEnv = process.env.NEXT_PUBLIC_API_ENVIRONMENT as ApiEnvironment;
    if (explicitEnv) {
      return explicitEnv;
    }

    // Check for test environment
    if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST) {
      return 'test';
    }

    // Check for production
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }

    // Default to development
    return 'development';
  }
}

// Default export for easy use
export const getApiClient = (environment?: ApiEnvironment): ApiClient => {
  return ApiFactory.getInstance(environment);
};

// Convenience exports
export const apiClient = getApiClient();
export const mockApiClient = ApiFactory.createClient('mock');