import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Login Page
 * Provides methods to interact with login page elements
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly pageTitle: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form elements
    this.emailInput = page.getByPlaceholder(/e-mail|email/i);
    this.passwordInput = page.getByPlaceholder(/passwort|password/i);
    this.loginButton = page.getByRole('button', { name: /anmelden|login|sign in/i });
    
    // Messages and feedback
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message').or(
      page.getByText(/fehler|error|ungültig|invalid|nicht gefunden|not found/i)
    );
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner');
    this.validationErrors = page.locator('.validation-error, [data-testid="validation-error"]');
    
    // Navigation elements
    this.forgotPasswordLink = page.getByRole('link', { name: /passwort vergessen|forgot password/i });
    this.registerLink = page.getByRole('link', { name: /registrieren|register|sign up/i });
    
    // Page elements
    this.pageTitle = page.locator('h1, [data-testid="page-title"]').filter({ 
      hasText: /anmelden|login|einloggen/i 
    });
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    
    // Wait for either success (redirect) or error message
    await Promise.race([
      this.page.waitForURL(/\/bookings|\/admin|\/dashboard/, { timeout: 5000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 })
    ]).catch(() => {
      // Ignore timeout - test will verify the expected state
    });
  }

  /**
   * Attempt login and wait for completion
   */
  async loginAndWait(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    // Click login and wait for loading to complete
    await this.loginButton.click();
    
    // Wait for loading spinner to appear and disappear
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 1000 });
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading spinner might not appear for fast responses
    }
  }

  /**
   * Submit empty form to trigger validation
   */
  async submitEmptyForm() {
    await this.loginButton.click();
    await expect(this.validationErrors.first()).toBeVisible({ timeout: 3000 });
  }

  /**
   * Clear form fields
   */
  async clearForm() {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Check if login form is visible and ready
   */
  async isLoginFormReady() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.loginButton).toBeEnabled();
  }

  /**
   * Wait for and verify error message
   */
  async expectErrorMessage(expectedMessage?: string | RegExp) {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
    
    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Verify validation errors for specific fields
   */
  async expectValidationErrors(fields: string[]) {
    for (const field of fields) {
      const fieldError = this.page.getByText(new RegExp(`${field}.*erforderlich|${field}.*required|${field}.*must`, 'i'));
      await expect(fieldError).toBeVisible();
    }
  }

  /**
   * Navigate to register page
   */
  async goToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/\/register/);
  }

  /**
   * Navigate to forgot password
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/\/forgot-password|\/reset-password/);
  }

  /**
   * Check current URL for redirect parameter
   */
  async getRedirectParameter(): Promise<string | null> {
    const url = new URL(this.page.url());
    return url.searchParams.get('redirect');
  }

  /**
   * Verify redirect parameter matches expected value
   */
  async expectRedirectParameter(expectedRedirect: string) {
    const redirectParam = await this.getRedirectParameter();
    expect(redirectParam).toBe(expectedRedirect);
  }

  /**
   * Login with specific user type (helper method)
   */
  async loginAsUser(userType: 'admin' | 'member' | 'guest' = 'member') {
    const credentials = {
      admin: { email: 'admin@booking.com', password: 'admin123' },
      member: { email: 'user@family.com', password: 'password123' },
      guest: { email: 'guest@family.com', password: 'guest123' }
    };

    const cred = credentials[userType];
    await this.login(cred.email, cred.password);
  }

  /**
   * Verify login button state
   */
  async expectLoginButtonEnabled(enabled: boolean = true) {
    if (enabled) {
      await expect(this.loginButton).toBeEnabled();
    } else {
      await expect(this.loginButton).toBeDisabled();
    }
  }

  /**
   * Check for loading state during login
   */
  async expectLoadingState() {
    await expect(this.loadingSpinner).toBeVisible();
    await expect(this.loginButton).toBeDisabled();
  }

  /**
   * Verify successful login redirect
   */
  async expectSuccessfulLogin(expectedUrl: string | RegExp = /\/bookings/) {
    await expect(this.page).toHaveURL(expectedUrl, { timeout: 10000 });
  }

  /**
   * Helper method to check if we're on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    try {
      await expect(this.page).toHaveURL(/\/login/);
      await expect(this.emailInput).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current form validation state
   */
  async getFormValidationState() {
    const emailValue = await this.emailInput.inputValue();
    const passwordValue = await this.passwordInput.inputValue();
    const isButtonEnabled = await this.loginButton.isEnabled();
    const hasErrors = await this.validationErrors.count() > 0;

    return {
      email: emailValue,
      password: passwordValue,
      isButtonEnabled,
      hasValidationErrors: hasErrors,
      isEmpty: !emailValue && !passwordValue
    };
  }

  /**
   * Simulate keyboard navigation through form
   */
  async navigateFormWithKeyboard() {
    await this.emailInput.focus();
    await this.page.keyboard.press('Tab');
    await expect(this.passwordInput).toBeFocused();
    await this.page.keyboard.press('Tab');
    await expect(this.loginButton).toBeFocused();
  }

  /**
   * Test accessibility features
   */
  async testAccessibility() {
    // Check ARIA labels and attributes
    await expect(this.emailInput).toHaveAttribute('aria-label', /email|e-mail/i);
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
    
    // Check required attributes
    await expect(this.emailInput).toHaveAttribute('required');
    await expect(this.passwordInput).toHaveAttribute('required');
    
    // Test keyboard navigation
    await this.navigateFormWithKeyboard();
  }
}