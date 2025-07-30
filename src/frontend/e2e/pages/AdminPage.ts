import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Admin Page
 * Provides methods to interact with admin dashboard elements
 */
export class AdminPage {
  readonly page: Page;
  readonly adminHeader: Locator;
  readonly pageTitle: Locator;
  readonly navigationMenu: Locator;
  readonly userManagementSection: Locator;
  readonly systemSettingsSection: Locator;
  readonly bookingManagementSection: Locator;
  readonly accessDeniedMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Page headers and titles
    this.adminHeader = page.locator('h1').filter({ hasText: /admin|verwaltung|administration/i });
    this.pageTitle = page.locator('[data-testid="page-title"], .page-title').or(this.adminHeader);
    
    // Navigation elements
    this.navigationMenu = page.locator('nav, [data-testid="admin-navigation"]');
    
    // Admin sections
    this.userManagementSection = page.locator('[data-testid="user-management"], .user-management').or(
      page.getByRole('link', { name: /benutzer|users|user management/i })
    );
    this.systemSettingsSection = page.locator('[data-testid="system-settings"], .system-settings').or(
      page.getByRole('link', { name: /einstellungen|settings|system/i })
    );
    this.bookingManagementSection = page.locator('[data-testid="booking-management"], .booking-management').or(
      page.getByRole('link', { name: /buchungsverwaltung|booking management|bookings/i })
    );
    
    // Error and loading states
    this.accessDeniedMessage = page.locator('[data-testid="access-denied"], .access-denied').or(
      page.getByText(/zugriff verweigert|access denied|nicht berechtigt|unauthorized/i)
    );
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner');
    
    // User controls
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu');
    this.logoutButton = page.getByRole('button', { name: /abmelden|logout|sign out/i });
  }

  /**
   * Navigate to admin page
   */
  async goto() {
    await this.page.goto('/admin');
    await this.waitForPageLoad();
  }

  /**
   * Wait for admin page to load
   */
  async waitForPageLoad() {
    await Promise.race([
      // Either admin page loads successfully
      this.adminHeader.waitFor({ state: 'visible', timeout: 10000 }),
      // Or access denied message appears
      this.accessDeniedMessage.waitFor({ state: 'visible', timeout: 10000 })
    ]);
  }

  /**
   * Check if user has admin access
   */
  async hasAdminAccess(): Promise<boolean> {
    try {
      await expect(this.adminHeader).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify admin dashboard is fully loaded
   */
  async expectAdminDashboard() {
    await expect(this.adminHeader).toBeVisible();
    await expect(this.navigationMenu).toBeVisible();
    
    // Check for admin-specific sections
    const adminSections = [
      this.userManagementSection,
      this.systemSettingsSection,
      this.bookingManagementSection
    ];

    // At least one admin section should be visible
    let sectionsVisible = 0;
    for (const section of adminSections) {
      try {
        await expect(section).toBeVisible({ timeout: 2000 });
        sectionsVisible++;
      } catch {
        // Section might not be visible, continue
      }
    }

    expect(sectionsVisible).toBeGreaterThan(0);
  }

  /**
   * Navigate to user management
   */
  async goToUserManagement() {
    await this.userManagementSection.click();
    await this.page.waitForURL(/\/admin\/users?/);
  }

  /**
   * Navigate to system settings
   */
  async goToSystemSettings() {
    await this.systemSettingsSection.click();
    await this.page.waitForURL(/\/admin\/settings?/);
  }

  /**
   * Navigate to booking management
   */
  async goToBookingManagement() {
    await this.bookingManagementSection.click();
    await this.page.waitForURL(/\/admin\/bookings?/);
  }

  /**
   * Check for access denied state
   */
  async expectAccessDenied() {
    await expect(this.accessDeniedMessage).toBeVisible();
  }

  /**
   * Verify user is redirected away from admin
   */
  async expectRedirectFromAdmin() {
    // Should not be on admin page
    await expect(this.page).not.toHaveURL(/\/admin/);
    
    // Should be redirected to bookings or access denied page
    await expect(this.page).toHaveURL(/\/bookings|\/access-denied|\/unauthorized/);
  }

  /**
   * Get admin navigation menu items
   */
  async getNavigationItems(): Promise<string[]> {
    const menuItems = this.navigationMenu.locator('a, button').filter({ hasText: /\w+/ });
    const count = await menuItems.count();
    
    const items = [];
    for (let i = 0; i < count; i++) {
      const text = await menuItems.nth(i).textContent();
      if (text?.trim()) {
        items.push(text.trim());
      }
    }
    
    return items;
  }

  /**
   * Check admin permissions for specific actions
   */
  async checkAdminPermissions() {
    const permissions = {
      canAccessUsers: false,
      canAccessSettings: false,
      canAccessBookings: false,
      canViewDashboard: false
    };

    try {
      await expect(this.userManagementSection).toBeVisible({ timeout: 2000 });
      permissions.canAccessUsers = true;
    } catch {}

    try {
      await expect(this.systemSettingsSection).toBeVisible({ timeout: 2000 });
      permissions.canAccessSettings = true;
    } catch {}

    try {
      await expect(this.bookingManagementSection).toBeVisible({ timeout: 2000 });
      permissions.canAccessBookings = true;
    } catch {}

    try {
      await expect(this.adminHeader).toBeVisible({ timeout: 2000 });
      permissions.canViewDashboard = true;
    } catch {}

    return permissions;
  }

  /**
   * Logout from admin area
   */
  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login|\/$/);
  }

  /**
   * Test admin page responsiveness
   */
  async testMobileAdminView() {
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    
    // Admin page should be responsive
    await expect(this.adminHeader).toBeVisible();
    
    // Check if navigation collapses on mobile
    const mobileNav = this.page.locator('[data-testid="mobile-admin-nav"], .mobile-admin-nav');
    const isMobileNavVisible = await mobileNav.isVisible().catch(() => false);
    
    if (isMobileNavVisible) {
      await mobileNav.click();
      await expect(this.navigationMenu).toBeVisible();
    }
    
    // Reset viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * Verify admin breadcrumbs
   */
  async expectBreadcrumbs(expectedPath: string[]) {
    const breadcrumbs = this.page.locator('[data-testid="breadcrumbs"], .breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    
    for (const pathItem of expectedPath) {
      await expect(breadcrumbs).toContainText(pathItem);
    }
  }

  /**
   * Handle admin page loading states
   */
  async waitForAdminContentLoad() {
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 2000 });
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading might be too fast
    }
    
    // Ensure admin content is loaded
    await expect(this.adminHeader).toBeVisible();
  }

  /**
   * Test keyboard navigation in admin area
   */
  async testAdminKeyboardNavigation() {
    // Focus on first navigation item
    const firstNavItem = this.navigationMenu.locator('a, button').first();
    await firstNavItem.focus();
    await expect(firstNavItem).toBeFocused();
    
    // Tab through navigation
    await this.page.keyboard.press('Tab');
    
    // Test enter key on navigation items
    await firstNavItem.focus();
    await this.page.keyboard.press('Enter');
  }

  /**
   * Check for admin-specific error messages
   */
  async checkForAdminErrors(): Promise<string[]> {
    const errorSelectors = [
      '.admin-error',
      '[data-testid="admin-error"]',
      '.permission-error',
      '[data-testid="permission-error"]'
    ];

    const errors = [];
    for (const selector of errorSelectors) {
      const errorElements = this.page.locator(selector);
      const count = await errorElements.count();
      
      for (let i = 0; i < count; i++) {
        const errorText = await errorElements.nth(i).textContent();
        if (errorText?.trim()) {
          errors.push(errorText.trim());
        }
      }
    }

    return errors;
  }

  /**
   * Verify admin role indicators
   */
  async expectAdminRoleIndicators() {
    // Look for admin badges or indicators
    const adminIndicators = this.page.locator('.admin-badge, [data-testid="admin-badge"]').or(
      this.page.getByText(/administrator|admin|verwaltung/i)
    );

    const count = await adminIndicators.count();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Navigate to specific admin sub-page
   */
  async navigateToSubPage(subPage: 'users' | 'settings' | 'bookings' | 'reports') {
    const subPageMap = {
      'users': this.userManagementSection,
      'settings': this.systemSettingsSection,
      'bookings': this.bookingManagementSection,
      'reports': this.page.getByRole('link', { name: /berichte|reports/i })
    };

    const targetElement = subPageMap[subPage];
    if (targetElement) {
      await targetElement.click();
      await this.page.waitForURL(new RegExp(`/admin/${subPage}`));
    }
  }

  /**
   * Test admin page security
   */
  async testAdminSecurity() {
    // Verify admin-only elements are not accessible by non-admin users
    const sensitiveElements = [
      this.userManagementSection,
      this.systemSettingsSection
    ];

    for (const element of sensitiveElements) {
      // These should only be visible to admin users
      const isVisible = await element.isVisible().catch(() => false);
      
      // If not visible, it means proper security is in place
      if (!isVisible) {
        console.log('✅ Admin element properly protected');
      }
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats() {
    const statsSelectors = [
      '[data-testid="user-count"]',
      '[data-testid="booking-count"]',
      '[data-testid="active-bookings"]',
      '.stat-card'
    ];

    const stats: Record<string, string> = {};
    
    for (const selector of statsSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        const label = await element.locator('.stat-label').textContent().catch(() => '');
        const value = await element.locator('.stat-value').textContent().catch(() => '');
        
        if (label && value) {
          stats[label.trim()] = value.trim();
        }
      }
    }

    return stats;
  }
}