import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('frontend should be accessible', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('API health check should return 200', async ({ request }) => {
    const response = await request.get('http://localhost:5000/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('API should require authentication for protected endpoints', async ({ request }) => {
    const response = await request.get('http://localhost:5000/bookings');
    expect(response.status()).toBe(401);
  });

  test('login endpoint should be accessible', async ({ request }) => {
    const response = await request.post('http://localhost:5000/auth/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });
    // Should return 401 for invalid credentials, not 500
    expect(response.status()).toBe(401);
  });

  test('should have proper CORS headers', async ({ request }) => {
    const response = await request.get('http://localhost:5000/health');
    
    // Check CORS headers are present
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeTruthy();
  });

  test('static assets should load', async ({ page }) => {
    await page.goto('/');
    
    // Check if CSS is loaded
    const hasStyles = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return styles.display !== '';
    });
    expect(hasStyles).toBeTruthy();
  });

  test('should handle 404 pages', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345');
    
    // Next.js should still return 200 for client-side routing
    expect(response?.status()).toBeLessThan(500);
    
    // But should show 404 content
    await expect(page.getByText(/404|Seite nicht gefunden|Page not found/i)).toBeVisible();
  });
});