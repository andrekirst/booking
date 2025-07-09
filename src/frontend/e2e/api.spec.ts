import { test, expect, setupAuthenticatedUser, setupTestBookings, simulateApiError } from './helpers/api';

test.describe('API Client Tests', () => {
  test('should authenticate successfully with valid credentials', async ({ apiClient }) => {
    const response = await apiClient.login({
      email: 'admin@booking.com',
      password: 'admin123',
    });

    expect(response.token).toBeTruthy();
    expect(response.user.email).toBe('admin@booking.com');
    expect(response.user.role).toBe(1); // Administrator
  });

  test('should reject authentication with invalid credentials', async ({ apiClient }) => {
    await expect(apiClient.login({
      email: 'invalid@example.com',
      password: 'wrongpassword',
    })).rejects.toThrow('Invalid credentials');
  });

  test('should return health check status', async ({ apiClient }) => {
    const response = await apiClient.healthCheck();
    expect(response.status).toBe('healthy');
  });

  test('should require authentication for protected endpoints', async ({ apiClient }) => {
    await expect(apiClient.getBookings()).rejects.toThrow('Unauthorized');
  });

  test('should fetch bookings when authenticated', async ({ apiClient }) => {
    await setupAuthenticatedUser(apiClient);
    
    const response = await apiClient.getBookings();
    expect(response.bookings).toBeInstanceOf(Array);
    expect(response.count).toBeGreaterThanOrEqual(0);
  });

  test('should handle API errors gracefully', async ({ apiClient }) => {
    await setupAuthenticatedUser(apiClient);
    simulateApiError(apiClient);

    await expect(apiClient.getBookings()).rejects.toThrow('Simulated server error');
  });

  test('should support logout', async ({ apiClient }) => {
    await setupAuthenticatedUser(apiClient);
    
    // Should not throw
    await apiClient.logout();
    
    // Should be unauthorized after logout
    await expect(apiClient.getBookings()).rejects.toThrow('Unauthorized');
  });
});