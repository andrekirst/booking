import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Bookings Page
 * Provides methods to interact with bookings page elements
 */
export class BookingsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newBookingButton: Locator;
  readonly bookingsList: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly userAvatar: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;
  readonly filterControls: Locator;
  readonly searchInput: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Page elements
    this.pageTitle = page.locator('h1').filter({ hasText: /buchungen|bookings|meine buchungen/i });
    this.newBookingButton = page.getByRole('button', { name: /neue buchung|new booking|buchung erstellen/i })
      .or(page.getByRole('link', { name: /neue buchung|new booking/i }));
    
    // Content elements
    this.bookingsList = page.locator('[data-testid="bookings-list"], .bookings-list, .booking-items');
    this.emptyState = page.locator('[data-testid="empty-bookings"], .empty-state').or(
      page.getByText(/keine buchungen|no bookings|noch keine/i)
    );
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner');
    
    // Filter and search
    this.filterControls = page.locator('[data-testid="filter-controls"], .filter-controls');
    this.searchInput = page.getByPlaceholder(/suchen|search/i);
    
    // Navigation elements
    this.navigationMenu = page.locator('nav, [data-testid="navigation"]');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu');
    this.userAvatar = page.locator('[data-testid="user-avatar"], .user-avatar').or(
      page.locator('button').filter({ hasText: /profil|profile|benutzer|user/i })
    );
    this.logoutButton = page.getByRole('button', { name: /abmelden|logout|sign out/i })
      .or(page.getByRole('menuitem', { name: /abmelden|logout/i }));
  }

  /**
   * Navigate to bookings page
   */
  async goto() {
    await this.page.goto('/bookings');
    await this.waitForPageLoad();
  }

  /**
   * Wait for bookings page to fully load
   */
  async waitForPageLoad() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    
    // Wait for either bookings list or empty state
    await Promise.race([
      this.bookingsList.waitFor({ state: 'visible', timeout: 5000 }),
      this.emptyState.waitFor({ state: 'visible', timeout: 5000 })
    ]).catch(() => {
      // One of them should be visible, continue with test
    });
  }

  /**
   * Create a new booking
   */
  async createNewBooking() {
    await this.newBookingButton.click();
    await this.page.waitForURL(/\/bookings\/new/);
  }

  /**
   * Logout from the application
   */
  async logout() {
    try {
      // Try to open user menu first
      await this.userAvatar.click({ timeout: 3000 });
      await this.logoutButton.click({ timeout: 3000 });
    } catch {
      // Direct logout button might be visible
      await this.logoutButton.click();
    }
    
    // Wait for redirect to login or home page
    await this.page.waitForURL(/\/login|\/$/);
  }

  /**
   * Check if user is authenticated on this page
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await expect(this.pageTitle).toBeVisible({ timeout: 3000 });
      await expect(this.userAvatar.or(this.logoutButton)).toBeVisible({ timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of visible bookings
   */
  async getVisibleBookings() {
    await this.waitForPageLoad();
    
    const bookingItems = this.bookingsList.locator('.booking-item, [data-testid="booking-item"]');
    const count = await bookingItems.count();
    
    const bookings = [];
    for (let i = 0; i < count; i++) {
      const item = bookingItems.nth(i);
      const title = await item.locator('.booking-title, [data-testid="booking-title"]').textContent();
      const dates = await item.locator('.booking-dates, [data-testid="booking-dates"]').textContent();
      const status = await item.locator('.booking-status, [data-testid="booking-status"]').textContent();
      
      bookings.push({
        title: title?.trim(),
        dates: dates?.trim(),
        status: status?.trim()
      });
    }
    
    return bookings;
  }

  /**
   * Search for bookings
   */
  async searchBookings(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    
    // Wait for search results
    await this.page.waitForTimeout(1000);
  }

  /**
   * Apply filters to bookings
   */
  async applyFilter(filterType: 'upcoming' | 'past' | 'confirmed' | 'pending' | 'cancelled') {
    const filterButton = this.filterControls.getByRole('button', { name: new RegExp(filterType, 'i') });
    await filterButton.click();
    
    // Wait for filter to apply
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to specific booking details
   */
  async viewBookingDetails(bookingIndex: number = 0) {
    const bookingItems = this.bookingsList.locator('.booking-item, [data-testid="booking-item"]');
    const bookingItem = bookingItems.nth(bookingIndex);
    
    await bookingItem.click();
    
    // Wait for navigation to booking details
    await this.page.waitForURL(/\/bookings\/[^\/]+$/);
  }

  /**
   * Check for empty bookings state
   */
  async expectEmptyState(message?: string | RegExp) {
    await expect(this.emptyState).toBeVisible();
    
    if (message) {
      await expect(this.emptyState).toContainText(message);
    }
  }

  /**
   * Verify page has expected bookings count
   */
  async expectBookingsCount(expectedCount: number) {
    if (expectedCount === 0) {
      await this.expectEmptyState();
    } else {
      const bookingItems = this.bookingsList.locator('.booking-item, [data-testid="booking-item"]');
      await expect(bookingItems).toHaveCount(expectedCount);
    }
  }

  /**
   * Check user information display
   */
  async getUserInfo() {
    // Try to get user info from avatar or menu
    await this.userAvatar.click();
    
    const userInfo = {
      name: '',
      email: '',
      role: ''
    };

    try {
      const userNameElement = this.page.locator('[data-testid="user-name"], .user-name');
      const userEmailElement = this.page.locator('[data-testid="user-email"], .user-email');
      const userRoleElement = this.page.locator('[data-testid="user-role"], .user-role');

      userInfo.name = await userNameElement.textContent() || '';
      userInfo.email = await userEmailElement.textContent() || '';
      userInfo.role = await userRoleElement.textContent() || '';
    } catch {
      // User info might not be visible
    }

    // Close menu
    await this.page.keyboard.press('Escape');
    
    return userInfo;
  }

  /**
   * Navigate to user profile
   */
  async goToProfile() {
    await this.userAvatar.click();
    const profileLink = this.page.getByRole('menuitem', { name: /profil|profile/i });
    await profileLink.click();
    
    await this.page.waitForURL(/\/profile/);
  }

  /**
   * Navigate to admin panel (if available)
   */
  async goToAdmin() {
    await this.userAvatar.click();
    const adminLink = this.page.getByRole('menuitem', { name: /admin|verwaltung/i });
    await adminLink.click();
    
    await this.page.waitForURL(/\/admin/);
  }

  /**
   * Check if admin menu is available
   */
  async hasAdminAccess(): Promise<boolean> {
    try {
      await this.userAvatar.click();
      const adminLink = this.page.getByRole('menuitem', { name: /admin|verwaltung/i });
      const isVisible = await adminLink.isVisible();
      
      // Close menu
      await this.page.keyboard.press('Escape');
      
      return isVisible;
    } catch {
      return false;
    }
  }

  /**
   * Verify navigation menu structure
   */
  async expectNavigationMenu() {
    await expect(this.navigationMenu).toBeVisible();
    
    // Check for common navigation items
    const menuItems = [
      /übersicht|dashboard|home/i,
      /buchungen|bookings/i,
      /neue buchung|new booking/i
    ];

    for (const item of menuItems) {
      const menuItem = this.navigationMenu.getByRole('link', { name: item })
        .or(this.navigationMenu.getByRole('button', { name: item }));
      await expect(menuItem).toBeVisible();
    }
  }

  /**
   * Test responsive behavior
   */
  async testMobileView() {
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile menu is present
    const mobileMenuButton = this.page.locator('[data-testid="mobile-menu"], .mobile-menu-button');
    await expect(mobileMenuButton).toBeVisible();
    
    // Test mobile menu functionality
    await mobileMenuButton.click();
    await expect(this.navigationMenu).toBeVisible();
    
    // Reset viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * Handle loading states
   */
  async waitForLoadingToComplete() {
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 2000 });
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading might be too fast to catch
    }
  }

  /**
   * Verify URL and page state after navigation
   */
  async expectToBeOnBookingsPage() {
    await expect(this.page).toHaveURL(/\/bookings(?:\?.*)?$/);
    await expect(this.pageTitle).toBeVisible();
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    // Focus on first interactive element
    await this.newBookingButton.focus();
    await expect(this.newBookingButton).toBeFocused();
    
    // Tab through page elements
    await this.page.keyboard.press('Tab');
    
    // Test escape key functionality
    await this.page.keyboard.press('Escape');
    
    // Test enter key on buttons
    await this.newBookingButton.focus();
    await this.page.keyboard.press('Enter');
  }

  /**
   * Check for error states
   */
  async checkForErrors() {
    const errorElements = this.page.locator('.error, [data-testid="error"], .alert-error');
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      const errors = [];
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        errors.push(errorText?.trim());
      }
      return errors;
    }
    
    return [];
  }
}