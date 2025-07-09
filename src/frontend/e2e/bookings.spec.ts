import { test, expect } from '@playwright/test';

// Use authenticated state for these tests
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Bookings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bookings');
  });

  test('should display bookings page after login', async ({ page }) => {
    // Check if we're on the bookings page
    await expect(page).toHaveURL(/\/bookings/);
    
    // Check for page elements
    await expect(page.getByRole('heading', { name: /Buchungen|Bookings/i })).toBeVisible();
  });

  test('should show empty state when no bookings exist', async ({ page }) => {
    // Check for empty state message
    await expect(page.getByText(/Keine Buchungen vorhanden|No bookings found/i)).toBeVisible();
    
    // Check for "Create booking" button
    await expect(page.getByRole('button', { name: /Neue Buchung|Create booking/i })).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page, context }) => {
    // Intercept the bookings API call and return an error
    await context.route('**/bookings', route => {
      route.fulfill({ status: 500 });
    });
    
    // Reload page to trigger API call
    await page.reload();
    
    // Check for error message
    await expect(page.getByText(/Fehler beim Laden|Error loading/i)).toBeVisible();
  });

  test('should require authentication', async ({ page, context }) => {
    // Clear auth state
    await context.clearCookies();
    
    // Try to access bookings page
    await page.goto('/bookings');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should load bookings list when data exists', async ({ page, context }) => {
    // Mock API response with test data
    await context.route('**/bookings', async route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bookings: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              createdAt: '2025-01-09T10:00:00Z',
              changedAt: '2025-01-09T10:00:00Z'
            }
          ],
          count: 1
        })
      });
    });
    
    // Reload to get mocked data
    await page.reload();
    
    // Check that booking is displayed
    await expect(page.getByText('123e4567-e89b-12d3-a456-426614174000')).toBeVisible();
  });

  test('should handle network errors', async ({ page, context }) => {
    // Block network requests to API
    await context.route('**/bookings', route => route.abort());
    
    // Reload page
    await page.reload();
    
    // Check for network error message
    await expect(page.getByText(/Netzwerkfehler|Network error/i)).toBeVisible();
  });
});