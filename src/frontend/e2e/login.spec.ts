import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.getByPlaceholder('E-Mail')).toBeVisible();
    await expect(page.getByPlaceholder('Passwort')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByPlaceholder('E-Mail').fill('invalid@example.com');
    await page.getByPlaceholder('Passwort').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Check for error message
    await expect(page.getByText(/Ungültige Anmeldedaten|Invalid credentials/i)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.getByPlaceholder('E-Mail').fill('test@example.com');
    await page.getByPlaceholder('Passwort').fill('Test123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Check if redirected to dashboard/bookings page
    await expect(page).toHaveURL(/\/bookings|\/dashboard/);
    
    // Check if user is logged in (e.g., logout button visible)
    await expect(page.getByRole('button', { name: /Abmelden|Logout/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Check for validation messages
    await expect(page.getByText(/E-Mail ist erforderlich|Email is required/i)).toBeVisible();
    await expect(page.getByText(/Passwort ist erforderlich|Password is required/i)).toBeVisible();
  });

  test('should handle server errors gracefully', async ({ page, context }) => {
    // Intercept the login request and return 500
    await context.route('**/auth/login', route => {
      route.fulfill({ status: 500 });
    });
    
    // Fill in credentials
    await page.getByPlaceholder('E-Mail').fill('test@example.com');
    await page.getByPlaceholder('Passwort').fill('Test123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Check for error message
    await expect(page.getByText(/Ein Fehler ist aufgetreten|An error occurred/i)).toBeVisible();
  });
});