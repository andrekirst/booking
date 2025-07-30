import { test, expect, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { BookingsPage } from './pages/BookingsPage';
import { AdminPage } from './pages/AdminPage';
import { AuthFixtures } from './fixtures/auth';

test.describe('Authentication Flows E2E', () => {
  let loginPage: LoginPage;
  let bookingsPage: BookingsPage;
  let adminPage: AdminPage;
  let authFixtures: AuthFixtures;

  test.beforeEach(async ({ page, context }) => {
    loginPage = new LoginPage(page);
    bookingsPage = new BookingsPage(page);
    adminPage = new AdminPage(page);
    authFixtures = new AuthFixtures(page, context);
    
    // Clear any existing auth state
    await authFixtures.clearAuthState();
  });

  test.describe('1. Unauthentifizierter Zugriff', () => {
    test('should redirect to login when accessing /bookings without auth', async ({ page }) => {
      await page.goto('/bookings');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fbookings');
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
    });

    test('should redirect to login when accessing /admin without auth', async ({ page }) => {
      await page.goto('/admin');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fadmin');
      await expect(loginPage.emailInput).toBeVisible();
    });

    test('should redirect to login when accessing /bookings/new without auth', async ({ page }) => {
      await page.goto('/bookings/new');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fbookings%2Fnew');
      await expect(loginPage.emailInput).toBeVisible();
    });

    test('should redirect to login when accessing /profile without auth', async ({ page }) => {
      await page.goto('/profile');
      
      // Should be redirected to login with redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2Fprofile');
      await expect(loginPage.emailInput).toBeVisible();
    });
  });

  test.describe('2. Login mit Redirect', () => {
    test('should redirect to original route after successful login from /bookings', async ({ page, context }) => {
      // Mock successful login
      await authFixtures.mockLoginSuccess();
      
      // Try to access protected route
      await page.goto('/bookings');
      await expect(page).toHaveURL('/login?redirect=%2Fbookings');
      
      // Login with valid credentials
      await loginPage.login('user@family.com', 'password123');
      
      // Should be redirected to original route
      await expect(page).toHaveURL('/bookings');
      await expect(bookingsPage.pageTitle).toBeVisible();
    });

    test('should redirect to admin after login from /admin redirect', async ({ page, context }) => {
      // Mock successful admin login
      await authFixtures.mockAdminLoginSuccess();
      
      // Try to access admin route
      await page.goto('/admin');
      await expect(page).toHaveURL('/login?redirect=%2Fadmin');
      
      // Login with admin credentials
      await loginPage.login('admin@booking.com', 'admin123');
      
      // Should be redirected to admin dashboard
      await expect(page).toHaveURL('/admin');
      await expect(adminPage.adminHeader).toBeVisible();
    });

    test('should redirect to /bookings/new after login from redirect', async ({ page, context }) => {
      // Mock successful login
      await authFixtures.mockLoginSuccess();
      
      // Try to access new booking route
      await page.goto('/bookings/new');
      await expect(page).toHaveURL('/login?redirect=%2Fbookings%2Fnew');
      
      // Login
      await loginPage.login('user@family.com', 'password123');
      
      // Should be redirected to new booking page
      await expect(page).toHaveURL('/bookings/new');
      await expect(page.getByText('Neue Buchung')).toBeVisible();
    });

    test('should handle complex redirect URLs with query parameters', async ({ page, context }) => {
      // Mock successful login
      await authFixtures.mockLoginSuccess();
      
      // Try to access route with query parameters
      await page.goto('/bookings?filter=upcoming&sort=date');
      await expect(page).toHaveURL('/login?redirect=%2Fbookings%3Ffilter%3Dupcoming%26sort%3Ddate');
      
      // Login
      await loginPage.login('user@family.com', 'password123');
      
      // Should preserve query parameters after redirect
      await expect(page).toHaveURL('/bookings?filter=upcoming&sort=date');
    });
  });

  test.describe('3. Öffentliche Routes', () => {
    test('should access homepage without authentication', async ({ page }) => {
      await page.goto('/');
      
      // Should not be redirected
      await expect(page).toHaveURL('/');
      
      // Should see public content
      await expect(page.getByText(/willkommen|buchungsplattform|family booking/i)).toBeVisible();
    });

    test('should access login page without authentication', async ({ page }) => {
      await page.goto('/login');
      
      // Should not be redirected
      await expect(page).toHaveURL('/login');
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
    });

    test('should access register page without authentication', async ({ page }) => {
      await page.goto('/register');
      
      // Should not be redirected
      await expect(page).toHaveURL('/register');
      await expect(page.getByText(/registrierung|anmeldung erstellen/i)).toBeVisible();
    });

    test('should access verify-email page without authentication', async ({ page }) => {
      await page.goto('/verify-email');
      
      // Should not be redirected
      await expect(page).toHaveURL('/verify-email');
      await expect(page.getByText(/e-mail verifizierung|email verification/i)).toBeVisible();
    });

    test('should access api-test page without authentication', async ({ page }) => {
      await page.goto('/api-test');
      
      // Should not be redirected
      await expect(page).toHaveURL('/api-test');
      await expect(page.getByText(/api test|api tester/i)).toBeVisible();
    });
  });

  test.describe('4. Bereits authentifizierte Benutzer', () => {
    test('should redirect authenticated user from /login to /bookings', async ({ page, context }) => {
      // Set up authenticated user
      await authFixtures.setAuthenticatedUser('user@family.com', 'Member');
      
      // Try to access login page
      await page.goto('/login');
      
      // Should be redirected to bookings
      await expect(page).toHaveURL('/bookings');
      await expect(bookingsPage.pageTitle).toBeVisible();
    });

    test('should redirect authenticated user from /register to /bookings', async ({ page, context }) => {
      // Set up authenticated user
      await authFixtures.setAuthenticatedUser('user@family.com', 'Member');
      
      // Try to access register page
      await page.goto('/register');
      
      // Should be redirected to bookings
      await expect(page).toHaveURL('/bookings');
      await expect(bookingsPage.pageTitle).toBeVisible();
    });

    test('should allow authenticated admin to access /login directly (edge case)', async ({ page, context }) => {
      // This tests the current behavior - might need adjustment based on requirements
      await authFixtures.setAuthenticatedUser('admin@booking.com', 'Administrator');
      
      await page.goto('/login');
      
      // Admin should also be redirected to bookings
      await expect(page).toHaveURL('/bookings');
    });
  });

  test.describe('5. Session Persistence', () => {
    test('should maintain authentication after page reload', async ({ page, context }) => {
      // Mock login and set auth token
      await authFixtures.mockLoginSuccess();
      await authFixtures.setAuthenticatedUser('user@family.com', 'Member');
      
      // Navigate to protected route
      await page.goto('/bookings');
      await expect(page).toHaveURL('/bookings');
      
      // Reload page
      await page.reload();
      
      // Should still be authenticated
      await expect(page).toHaveURL('/bookings');
      await expect(bookingsPage.pageTitle).toBeVisible();
    });

    test('should maintain authentication with localStorage token', async ({ page, context }) => {
      // Set token in localStorage
      await page.goto('/');
      await authFixtures.setTokenInLocalStorage('mock-jwt-token-user');
      
      // Navigate to protected route
      await page.goto('/bookings');
      
      // Should be authenticated
      await expect(page).toHaveURL('/bookings');
    });

    test('should maintain authentication with cookie token', async ({ page, context }) => {
      // Set auth cookie
      await authFixtures.setAuthCookie('mock-jwt-token-user');
      
      // Navigate to protected route
      await page.goto('/bookings');
      
      // Should be authenticated
      await expect(page).toHaveURL('/bookings');
    });

    test('should handle token expiration correctly', async ({ page, context }) => {
      // Set expired token
      await authFixtures.setExpiredToken();
      
      // Try to access protected route
      await page.goto('/bookings');
      
      // Should be redirected to login due to expired token
      await expect(page).toHaveURL('/login?redirect=%2Fbookings');
      await expect(loginPage.emailInput).toBeVisible();
    });

    test('should clear authentication on logout', async ({ page, context }) => {
      // Set up authenticated user
      await authFixtures.setAuthenticatedUser('user@family.com', 'Member');
      await page.goto('/bookings');
      
      // Perform logout
      await bookingsPage.logout();
      
      // Verify tokens and cookies are cleared
      const localStorage = await page.evaluate(() => window.localStorage.getItem('auth_token'));
      const cookies = await context.cookies();
      const authCookie = cookies.find(c => c.name === 'auth_token');
      
      expect(localStorage).toBeNull();
      expect(authCookie).toBeUndefined();
      
      // Should be redirected to login when accessing protected route
      await page.goto('/bookings');
      await expect(page).toHaveURL('/login?redirect=%2Fbookings');
    });
  });

  test.describe('6. Admin-Bereiche', () => {
    test('should allow admin user to access /admin', async ({ page, context }) => {
      // Set up admin user
      await authFixtures.setAuthenticatedUser('admin@booking.com', 'Administrator');
      
      // Navigate to admin route
      await page.goto('/admin');
      
      // Should have access
      await expect(page).toHaveURL('/admin');
      await expect(adminPage.adminHeader).toBeVisible();
    });

    test('should redirect regular user from /admin to /bookings', async ({ page, context }) => {
      // Set up regular user
      await authFixtures.setAuthenticatedUser('user@family.com', 'Member');
      
      // Try to access admin route
      await page.goto('/admin');
      
      // Should be redirected to bookings (access denied)
      await expect(page).toHaveURL(/\/bookings|\/access-denied/);
    });

    test('should handle admin route with sub-paths', async ({ page, context }) => {
      // Set up admin user
      await authFixtures.setAuthenticatedUser('admin@booking.com', 'Administrator');
      
      // Access admin sub-route
      await page.goto('/admin/users');
      
      // Should have access to admin sub-routes
      await expect(page).toHaveURL('/admin/users');
    });

    test('should redirect non-admin from admin sub-routes', async ({ page, context }) => {
      // Set up regular user
      await authFixtures.setAuthenticatedUser('user@family.com', 'Member');
      
      // Try to access admin sub-route
      await page.goto('/admin/users');
      
      // Should be denied access
      await expect(page).toHaveURL(/\/bookings|\/access-denied/);
    });
  });

  test.describe('7. Edge Cases & Error Handling', () => {
    test('should handle malformed redirect parameters', async ({ page, context }) => {
      await page.goto('/login?redirect=javascript:alert("xss")');
      
      // Should not execute malicious redirect
      await expect(page).toHaveURL('/login?redirect=javascript:alert("xss")');
      await expect(loginPage.emailInput).toBeVisible();
      
      // After login, should default to safe redirect
      await authFixtures.mockLoginSuccess();
      await loginPage.login('user@family.com', 'password123');
      
      // Should redirect to safe default route
      await expect(page).toHaveURL('/bookings');
    });

    test('should handle missing redirect parameter gracefully', async ({ page, context }) => {
      await page.goto('/login');
      
      await authFixtures.mockLoginSuccess();
      await loginPage.login('user@family.com', 'password123');
      
      // Should redirect to default route when no redirect parameter
      await expect(page).toHaveURL('/bookings');
    });

    test('should handle authentication API failures', async ({ page, context }) => {
      // Mock API failure
      await context.route('**/api/auth/**', route => {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
      });
      
      await page.goto('/login');
      await loginPage.login('user@family.com', 'password123');
      
      // Should show error message and stay on login page
      await expect(page.getByText(/fehler|error|server|nicht verfügbar/i)).toBeVisible();
      await expect(page).toHaveURL('/login');
    });

    test('should handle network timeouts gracefully', async ({ page, context }) => {
      // Mock network timeout
      await context.route('**/api/auth/login', route => {
        // Never respond to simulate timeout
        // Route will timeout based on playwright settings
      });
      
      await page.goto('/login');
      await loginPage.login('user@family.com', 'password123');
      
      // Should handle timeout gracefully
      await expect(page.getByText(/timeout|zeitüberschreitung|verbindung/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle concurrent authentication attempts', async ({ page, context }) => {
      await authFixtures.mockLoginSuccess();
      
      await page.goto('/login');
      
      // Simulate multiple rapid login attempts
      const loginPromises = [
        loginPage.login('user@family.com', 'password123'),
        loginPage.login('user@family.com', 'password123'),
        loginPage.login('user@family.com', 'password123')
      ];
      
      // Wait for all attempts to complete
      await Promise.allSettled(loginPromises);
      
      // Should end up authenticated
      await expect(page).toHaveURL('/bookings');
    });
  });

  test.describe('8. Cross-Browser Compatibility', () => {
    test('should work consistently across different browsers', async ({ page, browserName }) => {
      await authFixtures.setAuthenticatedUser('user@family.com', 'Member');
      
      // Test basic auth flow
      await page.goto('/bookings');
      await expect(page).toHaveURL('/bookings');
      
      // Clear auth and test redirect
      await authFixtures.clearAuthState();
      await page.goto('/bookings');
      await expect(page).toHaveURL('/login?redirect=%2Fbookings');
      
      // Test should work the same regardless of browser
      console.log(`✅ Authentication flow working correctly in ${browserName}`);
    });
  });

  test.describe('9. Performance & Load Testing', () => {
    test('should handle rapid navigation between auth states', async ({ page, context }) => {
      const startTime = Date.now();
      
      // Rapid navigation test
      for (let i = 0; i < 5; i++) {
        await page.goto('/bookings');
        await expect(page).toHaveURL('/login?redirect=%2Fbookings');
        
        await authFixtures.setAuthenticatedUser(`user${i}@family.com`, 'Member');
        await page.goto('/bookings');
        await expect(page).toHaveURL('/bookings');
        
        await authFixtures.clearAuthState();
      }
      
      const duration = Date.now() - startTime;
      console.log(`🚀 Rapid navigation completed in ${duration}ms`);
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    test('should handle authentication state changes efficiently', async ({ page, context }) => {
      const operations = [];
      
      // Measure auth operations
      operations.push(await measureOperation(async () => {
        await authFixtures.setAuthenticatedUser('user@family.com', 'Member');
      }, 'Set Auth Token'));
      
      operations.push(await measureOperation(async () => {
        await page.goto('/bookings');
      }, 'Navigate to Protected Route'));
      
      operations.push(await measureOperation(async () => {
        await authFixtures.clearAuthState();
      }, 'Clear Auth State'));
      
      operations.push(await measureOperation(async () => {
        await page.goto('/bookings');
      }, 'Navigate After Logout'));
      
      console.log('🔍 Performance Metrics:', operations);
      
      // All operations should be reasonably fast
      operations.forEach(op => {
        expect(op.duration).toBeLessThan(2000); // 2 seconds max per operation
      });
    });
  });
});

/**
 * Helper function to measure operation performance
 */
async function measureOperation(operation: () => Promise<void>, name: string): Promise<{name: string, duration: number}> {
  const start = Date.now();
  await operation();
  const duration = Date.now() - start;
  return { name, duration };
}