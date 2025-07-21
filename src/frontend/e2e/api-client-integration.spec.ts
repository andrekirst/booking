import { test, expect } from '@playwright/test';
import { ApiClient, HttpApiClient } from '../lib/api/client';

// Test configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7000/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123',
};
const ADMIN_USER = {
  email: 'admin@booking.com',
  password: 'admin123',
};

test.describe('API Client Integration E2E Tests', () => {
  let apiClient: ApiClient;

  test.beforeEach(async ({ page }) => {
    // Create a new API client for each test
    apiClient = new HttpApiClient(API_URL);
    
    // Clear any existing auth state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Authentication Flow', () => {
    test('should login and persist token across page reloads', async ({ page }) => {
      // Navigate to login page
      await page.goto('/login');
      
      // Fill login form
      await page.fill('input[name="email"]', ADMIN_USER.email);
      await page.fill('input[name="password"]', ADMIN_USER.password);
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('/bookings');
      
      // Check token is stored
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token).toBeTruthy();
      
      // Reload page and verify still authenticated
      await page.reload();
      await expect(page).toHaveURL('/bookings');
    });

    test('should redirect to login on 401 error', async ({ page }) => {
      // Set invalid token
      await page.goto('/');
      await page.evaluate(() => localStorage.setItem('auth_token', 'invalid-token'));
      
      // Try to access protected page
      await page.goto('/bookings');
      
      // Should be redirected to login
      await page.waitForURL('/login');
    });

    test('should logout and clear authentication', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', ADMIN_USER.email);
      await page.fill('input[name="password"]', ADMIN_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/bookings');
      
      // Find and click logout button
      await page.click('button:has-text("Abmelden")');
      
      // Should redirect to login
      await page.waitForURL('/login');
      
      // Token should be cleared
      const token = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token).toBeNull();
    });
  });

  test.describe('API Error Handling', () => {
    test('should display network error message', async ({ page, context }) => {
      // Block API requests to simulate network error
      await context.route('**/api/**', route => route.abort());
      
      // Try to login
      await page.goto('/login');
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Netzwerkfehler')).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page, context }) => {
      // Mock 500 error
      await context.route('**/api/auth/login', route => 
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      );
      
      // Try to login
      await page.goto('/login');
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('.text-red-700')).toBeVisible();
    });
  });

  test.describe('API Test Page', () => {
    test('should test all API endpoints', async ({ page }) => {
      await page.goto('/api-test');
      
      // Test health check
      await page.click('button:has-text("Test"):near(h3:has-text("Health Check"))');
      await expect(page.locator('text=Success!')).toBeVisible({ timeout: 10000 });
      
      // Test bookings (should fail without auth)
      await page.click('button:has-text("Test"):near(h3:has-text("Get Bookings"))');
      await expect(page.locator('text=Error')).toBeVisible();
      await expect(page.locator('text=401')).toBeVisible();
    });

    test('should show API configuration', async ({ page }) => {
      await page.goto('/api-test');
      
      // Check API URL is displayed
      await expect(page.locator(`text=${API_URL}`)).toBeVisible();
    });
  });

  test.describe('Real API Workflows', () => {
    test('should complete booking workflow', async ({ page, context }) => {
      // Mock successful login
      await context.route('**/api/auth/login', route => 
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              id: '1',
              email: ADMIN_USER.email,
              firstName: 'Admin',
              lastName: 'User',
              role: 1,
              isActive: true,
              createdAt: '2025-01-01T00:00:00Z',
            },
          }),
        })
      );

      // Mock bookings response
      await context.route('**/api/bookings', route => 
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            bookings: [
              {
                id: '1',
                userId: 1,
                userName: 'Test User',
                userEmail: 'test@example.com',
                startDate: '2025-02-01',
                endDate: '2025-02-03',
                status: 1,
                bookingItems: [],
                totalPersons: 2,
                numberOfNights: 2,
                createdAt: '2025-01-11T10:00:00Z',
              },
            ],
            count: 1,
          }),
        })
      );

      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', ADMIN_USER.email);
      await page.fill('input[name="password"]', ADMIN_USER.password);
      await page.click('button[type="submit"]');
      
      // Should redirect to bookings page
      await page.waitForURL('/bookings');
      
      // Should display booking
      await expect(page.locator('text=Test User')).toBeVisible();
      await expect(page.locator('text=01.02.2025')).toBeVisible();
    });

    test('should handle admin accommodation management', async ({ page, context }) => {
      // Setup admin authentication
      await context.route('**/api/auth/login', route => 
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'admin-token',
            user: {
              id: '1',
              email: ADMIN_USER.email,
              role: 1, // Administrator
              isActive: true,
            },
          }),
        })
      );

      // Mock accommodations response
      await context.route('**/api/sleeping-accommodations*', route => 
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: '1',
              name: 'Master Bedroom',
              type: 0,
              maxCapacity: 4,
              isActive: true,
              createdAt: '2025-01-01T00:00:00Z',
            },
            {
              id: '2',
              name: 'Guest Room',
              type: 0,
              maxCapacity: 2,
              isActive: false,
              createdAt: '2025-01-01T00:00:00Z',
            },
          ]),
        })
      );

      // Login as admin
      await page.goto('/login');
      await page.fill('input[name="email"]', ADMIN_USER.email);
      await page.fill('input[name="password"]', ADMIN_USER.password);
      await page.click('button[type="submit"]');
      
      // Navigate to admin area
      await page.goto('/admin/sleeping-accommodations');
      
      // Should see accommodations
      await expect(page.locator('text=Master Bedroom')).toBeVisible();
      
      // Toggle inactive filter
      await page.check('input[type="checkbox"]:near(text=Inaktive anzeigen)');
      
      // Should now see inactive accommodation
      await expect(page.locator('text=Guest Room')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('should handle rapid API calls', async ({ page, context }) => {
      let callCount = 0;
      
      // Count API calls
      await context.route('**/api/health', route => {
        callCount++;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'healthy' }),
        });
      });

      await page.goto('/api-test');
      
      // Click test button multiple times rapidly
      const testButton = page.locator('button:has-text("Test"):near(h3:has-text("Health Check"))');
      
      for (let i = 0; i < 5; i++) {
        await testButton.click();
        await page.waitForTimeout(100);
      }
      
      // All calls should complete
      expect(callCount).toBeGreaterThanOrEqual(5);
    });

    test('should handle large response payloads', async ({ page, context }) => {
      // Create large bookings array
      const largeBookingsArray = Array.from({ length: 100 }, (_, i) => ({
        id: `booking-${i}`,
        userId: 1,
        userName: `User ${i}`,
        userEmail: `user${i}@example.com`,
        startDate: '2025-02-01',
        endDate: '2025-02-03',
        status: 1,
        bookingItems: [],
        totalPersons: 2,
        numberOfNights: 2,
        createdAt: '2025-01-11T10:00:00Z',
      }));

      await context.route('**/api/bookings', route => 
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            bookings: largeBookingsArray,
            count: largeBookingsArray.length,
          }),
        })
      );

      // Set auth token
      await page.goto('/');
      await page.evaluate(() => 
        localStorage.setItem('auth_token', 'test-token')
      );

      // Navigate to bookings
      await page.goto('/bookings');
      
      // Page should load without errors
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});

test.describe('API Client Console Logging', () => {
  test('should log API requests in development', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('[API]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/api-test');
    
    // Trigger API call
    await page.click('button:has-text("Test"):near(h3:has-text("Health Check"))');
    await page.waitForTimeout(1000);
    
    // Should have logged the request
    expect(consoleLogs.some(log => log.includes('[API] GET'))).toBeTruthy();
  });
});