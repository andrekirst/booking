import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AuthFixtures } from './fixtures/auth';

test.describe('Login Flow (Legacy Tests - Updated)', () => {
  let loginPage: LoginPage;
  let authFixtures: AuthFixtures;

  test.beforeEach(async ({ page, context }) => {
    loginPage = new LoginPage(page);
    authFixtures = new AuthFixtures(page, context);
    
    // Clear any existing auth state
    await authFixtures.clearAuthState();
    await page.goto('/login');
  });

  test('should display login form with Page Object Model', async ({ page }) => {
    // Use Page Object Model methods instead of direct locators
    await loginPage.isLoginFormReady();
    await expect(loginPage.pageTitle).toBeVisible();
  });

  test('should show error on invalid credentials with mocked API', async ({ page, context }) => {
    // Mock login failure
    await authFixtures.mockLoginFailure('Ungültige Anmeldedaten');
    
    // Use Page Object Model for login attempt
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Check for error message using Page Object Model
    await loginPage.expectErrorMessage(/ungültige anmeldedaten|invalid credentials/i);
  });

  test('should login successfully with mocked valid credentials', async ({ page, context }) => {
    // Mock successful login
    await authFixtures.mockLoginSuccess('admin@booking.com', 'Administrator');
    
    // Use Page Object Model for login
    await loginPage.loginAndWait('admin@booking.com', 'admin123');
    
    // Check successful redirect using Page Object Model
    await loginPage.expectSuccessfulLogin(/\/bookings/);
  });

  test('should show validation errors for empty fields using Page Object Model', async ({ page }) => {
    // Use Page Object Model to submit empty form
    await loginPage.submitEmptyForm();
    
    // Check for validation errors using Page Object Model
    await loginPage.expectValidationErrors(['E-Mail', 'Passwort']);
  });

  test('should handle server errors gracefully with mocked error', async ({ page, context }) => {
    // Mock server error using AuthFixtures
    await authFixtures.mockServerError(500);
    
    // Use Page Object Model for login attempt
    await loginPage.loginAndWait('admin@booking.com', 'admin123');
    
    // Check for error message using Page Object Model
    await loginPage.expectErrorMessage(/ein fehler ist aufgetreten|an error occurred|server error/i);
  });

  test('should handle network timeout gracefully', async ({ page, context }) => {
    // Mock network timeout using AuthFixtures
    await authFixtures.mockNetworkTimeout();
    
    // Use Page Object Model for login attempt
    await loginPage.loginAndWait('admin@booking.com', 'admin123');
    
    // Check for timeout error message
    await loginPage.expectErrorMessage(/timeout|zeitüberschreitung|verbindung/i);
  });

  test('should test keyboard navigation and accessibility', async ({ page }) => {
    // Test accessibility features using Page Object Model
    await loginPage.testAccessibility();
  });
});