import { test as base } from '@playwright/test';
import { ApiFactory } from '../../lib/api/factory';
import { MockApiClient } from '../../lib/api/mock-client';
import { BookingStatus } from '../../lib/types/api';

// Extend Playwright test with API client
export const test = base.extend<{
  apiClient: MockApiClient;
}>({
  apiClient: async ({}, use) => {
    // Create a fresh mock client for each test
    const mockClient = ApiFactory.createMockClient();
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
    userId: 1,
    userName: 'Test User',
    userEmail: 'test@example.com',
    startDate: '2025-01-15',
    endDate: '2025-01-17',
    status: BookingStatus.Pending,
    notes: 'E2E Test Booking',
    bookingItems: [
      {
        sleepingAccommodationId: 'accommodation-1',
        sleepingAccommodationName: 'Test Room',
        personCount: 2,
      }
    ],
    totalPersons: 2,
    numberOfNights: 2,
    createdAt: '2025-01-10T08:00:00Z',
    changedAt: '2025-01-10T08:00:00Z',
  });
}

// Helper function to simulate API errors
export async function simulateApiError(apiClient: MockApiClient) {
  apiClient.simulateError(true);
}