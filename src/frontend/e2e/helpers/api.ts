import { test as base } from '@playwright/test';
import { ApiFactory } from '../../lib/api/factory';
import { MockApiClient } from '../../lib/api/mock-client';

// Extend Playwright test with API client
export const test = base.extend<{
  apiClient: MockApiClient;
}>({
  apiClient: async ({}, use) => {
    // Create a fresh mock client for each test
    const mockClient = ApiFactory.createClient('mock') as MockApiClient;
    await use(mockClient);
  },
});

export { expect } from '@playwright/test';

// Helper function to setup authenticated state
export async function setupAuthenticatedUser(apiClient: MockApiClient) {
  await apiClient.login({
    email: 'admin@booking.com',
    password: 'admin123',
  });
}

// Helper function to setup test data
export async function setupTestBookings(apiClient: MockApiClient) {
  // Mock client already has test bookings, but we can add more
  apiClient.addMockBooking({
    id: 'test-booking-1',
    createdAt: '2025-01-10T08:00:00Z',
    changedAt: '2025-01-10T08:00:00Z',
  });
}

// Helper function to simulate API errors
export async function simulateApiError(apiClient: MockApiClient) {
  apiClient.simulateError(true);
}