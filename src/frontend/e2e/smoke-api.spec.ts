import { test, expect } from './helpers/api';

test.describe('Smoke Tests - API Abstraction', () => {
  test('mock API client should be accessible', async ({ apiClient }) => {
    expect(apiClient).toBeDefined();
  });

  test('health check should return healthy status', async ({ apiClient }) => {
    const response = await apiClient.healthCheck();
    expect(response.status).toBe('healthy');
  });

  test('authentication should work with valid credentials', async ({ apiClient }) => {
    const response = await apiClient.login({
      email: 'admin@booking.com',
      password: 'admin123',
    });

    expect(response.token).toBeTruthy();
    expect(response.user).toBeDefined();
  });

  test('authentication should fail with invalid credentials', async ({ apiClient }) => {
    await expect(apiClient.login({
      email: 'invalid@example.com',
      password: 'wrongpassword',
    })).rejects.toThrow();
  });

  test('protected endpoints should require authentication', async ({ apiClient }) => {
    await expect(apiClient.getBookings()).rejects.toThrow('Unauthorized');
  });

  test('bookings endpoint should work when authenticated', async ({ apiClient }) => {
    // First authenticate
    await apiClient.login({
      email: 'admin@booking.com',
      password: 'admin123',
    });

    // Then fetch bookings
    const response = await apiClient.getBookings();
    expect(response.bookings).toBeInstanceOf(Array);
    expect(response.count).toBeGreaterThanOrEqual(0);
  });

  test('should handle multiple users', async ({ apiClient }) => {
    // Test admin user
    const adminResponse = await apiClient.login({
      email: 'admin@booking.com',
      password: 'admin123',
    });
    expect(adminResponse.user.role).toBe(1); // Administrator

    // Logout and test member user
    await apiClient.logout();
    
    const memberResponse = await apiClient.login({
      email: 'member@booking.com',
      password: 'member123',
    });
    expect(memberResponse.user.role).toBe(0); // Member
  });
});