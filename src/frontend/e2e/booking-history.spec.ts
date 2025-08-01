import { test, expect, Page } from '@playwright/test';

// Helper functions for booking history tests
class BookingHistoryPage {
  constructor(private page: Page) {}

  async navigateToBookingDetail(bookingId: string) {
    await this.page.goto(`/bookings/${bookingId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async clickHistoryTab() {
    await this.page.click('button:has-text("Historie")');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForHistoryToLoad() {
    await this.page.waitForSelector('[data-testid="history-timeline"], [data-testid="history-loading"]', {
      timeout: 10000
    });
  }

  async getHistoryEntries() {
    return this.page.locator('[role="listitem"]').all();
  }

  async getHistoryFeed() {
    return this.page.locator('[role="feed"]');
  }

  async getLoadingState() {
    return this.page.locator('[role="status"][aria-label*="Historie wird geladen"]');
  }

  async getErrorState() {
    return this.page.locator('[role="alert"]');
  }

  async getEmptyState() {
    return this.page.locator('text=Keine Historie verfügbar');
  }

  async clickReloadButton() {
    await this.page.click('button:has-text("Neu laden")');
  }

  async isTabActive(tabName: string) {
    const tab = this.page.locator(`button:has-text("${tabName}")`);
    return await tab.getAttribute('aria-current') === 'page';
  }

  async getEventIcon(eventType: string) {
    return this.page.locator(`[role="img"][aria-label="${eventType} Event"]`);
  }

  async getEventDetails(description: string) {
    return this.page.locator(`text=${description}`).locator('..').locator('..');
  }

  async getStatusBadges() {
    return this.page.locator('.px-2.py-1.rounded.text-xs.font-medium');
  }

  async getTimestamps() {
    return this.page.locator('[title*="."]'); // Elements with date in title
  }
}

test.describe('Booking History E2E Tests', () => {
  let historyPage: BookingHistoryPage;

  test.beforeEach(async ({ page }) => {
    historyPage = new BookingHistoryPage(page);
    
    // Setup authentication
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@booking.com');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/bookings');
  });

  test.describe('Basic History Functionality', () => {
    test('should display booking details by default', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Details tab should be active
      expect(await historyPage.isTabActive('Details')).toBe(true);
      expect(await historyPage.isTabActive('Historie')).toBe(false);
      
      // Should show booking overview
      await expect(page.locator('text=Admin User')).toBeVisible();
      await expect(page.locator('text=admin@booking.com')).toBeVisible();
      await expect(page.locator('text=Main Bedroom')).toBeVisible();
    });

    test('should lazy load history when Historie tab is clicked', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // History should not be loaded initially
      await expect(historyPage.getHistoryFeed()).not.toBeVisible();
      
      // Click Historie tab
      await historyPage.clickHistoryTab();
      
      // Should show loading state briefly
      await expect(historyPage.getLoadingState()).toBeVisible({ timeout: 1000 });
      
      // Wait for history to load
      await historyPage.waitForHistoryToLoad();
      
      // History tab should be active
      expect(await historyPage.isTabActive('Historie')).toBe(true);
      
      // Should show history timeline
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      await expect(page.locator('text=Änderungsverlauf')).toBeVisible();
    });

    test('should display history entries with correct information', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      const entries = await historyPage.getHistoryEntries();
      expect(entries.length).toBeGreaterThan(0);
      
      // Should show creation event
      await expect(page.locator('text=Buchung wurde erstellt')).toBeVisible();
      
      // Should show user information
      await expect(page.locator('text=Admin User')).toBeVisible();
      await expect(page.locator('text=admin@booking.com')).toBeVisible();
      
      // Should show status change
      await expect(page.locator('text=Ausstehend')).toBeVisible();
      await expect(page.locator('text=Bestätigt')).toBeVisible();
    });

    test('should show event icons for different event types', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Should have event icons
      await expect(historyPage.getEventIcon('Created')).toBeVisible();
      await expect(historyPage.getEventIcon('StatusChanged')).toBeVisible();
    });

    test('should display timestamps with hover details', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      const timestamps = await historyPage.getTimestamps();
      const firstTimestamp = timestamps[0];
      
      // Should have title attribute with full date
      const title = await firstTimestamp.getAttribute('title');
      expect(title).toMatch(/\d{2}\.\d{2}\.\d{4}/);
      
      // Should show relative time
      await expect(firstTimestamp).toHaveText(/vor|gerade eben/i);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle booking not found', async ({ page }) => {
      await historyPage.navigateToBookingDetail('non-existent-booking');
      
      // Should show error page
      await expect(page.locator('text=Buchung nicht gefunden')).toBeVisible();
      await expect(page.locator('button:has-text("Zurück zur Übersicht")')).toBeVisible();
      
      // Click back button
      await page.click('button:has-text("Zurück zur Übersicht")');
      await page.waitForURL('/bookings');
    });

    test('should handle history API errors gracefully', async ({ page }) => {
      // Mock API to return error for this specific booking
      await page.route('**/api/bookings/error-booking/history', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await historyPage.navigateToBookingDetail('error-booking');
      await historyPage.clickHistoryTab();
      
      // Should show error state
      await expect(historyPage.getErrorState()).toBeVisible();
      await expect(page.locator('text=Fehler beim Laden der Historie')).toBeVisible();
      await expect(page.locator('button:has-text("Neu laden")')).toBeVisible();
    });

    test('should allow retry after error', async ({ page }) => {
      let requestCount = 0;
      
      // Mock API to fail first time, succeed second time
      await page.route('**/api/bookings/flaky-booking/history', route => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Temporary error' })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: 'retry-1',
                eventType: 'Created',
                timestamp: new Date().toISOString(),
                user: { id: '1', name: 'Test User', email: 'test@example.com' },
                description: 'Buchung wurde erstellt',
                details: {}
              }
            ])
          });
        }
      });

      await historyPage.navigateToBookingDetail('flaky-booking');
      await historyPage.clickHistoryTab();
      
      // Should show error first
      await expect(historyPage.getErrorState()).toBeVisible();
      
      // Click retry
      await historyPage.clickReloadButton();
      
      // Should load successfully
      await historyPage.waitForHistoryToLoad();
      await expect(page.locator('text=Buchung wurde erstellt')).toBeVisible();
    });

    test('should handle empty history', async ({ page }) => {
      // Mock API to return empty history
      await page.route('**/api/bookings/empty-booking/history', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await historyPage.navigateToBookingDetail('empty-booking');
      await historyPage.clickHistoryTab();
      
      // Should show empty state
      await expect(historyPage.getEmptyState()).toBeVisible();
      await expect(page.locator('text=Für diese Buchung wurden noch keine Änderungen aufgezeichnet')).toBeVisible();
    });
  });

  test.describe('Performance and Caching', () => {
    test('should not reload history when switching between tabs', async ({ page }) => {
      let historyRequestCount = 0;
      
      // Count history API requests
      await page.route('**/api/bookings/*/history', route => {
        historyRequestCount++;
        route.continue();
      });

      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Load history first time
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      expect(historyRequestCount).toBe(1);
      
      // Switch to Details
      await page.click('button:has-text("Details")');
      await expect(page.locator('text=Admin User')).toBeVisible();
      
      // Switch back to Historie
      await historyPage.clickHistoryTab();
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      
      // Should not make another API request
      expect(historyRequestCount).toBe(1);
    });

    test('should load history quickly', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      const startTime = Date.now();
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      const endTime = Date.now();
      
      // Should load within reasonable time (adjust based on your API performance)
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Tab to Historie button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Assuming it's the second tab
      
      // Should be focused
      await expect(page.locator('button:has-text("Historie"):focus')).toBeVisible();
      
      // Activate with Enter
      await page.keyboard.press('Enter');
      await historyPage.waitForHistoryToLoad();
      
      // Should show history
      await expect(historyPage.getHistoryFeed()).toBeVisible();
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Feed should have proper attributes
      const feed = historyPage.getHistoryFeed();
      await expect(feed).toHaveAttribute('role', 'feed');
      await expect(feed).toHaveAttribute('aria-label', 'Buchungshistorie');
      await expect(feed).toHaveAttribute('aria-live', 'polite');
      
      // Tabs should have proper attributes
      const historyTab = page.locator('button:has-text("Historie")');
      await expect(historyTab).toHaveAttribute('aria-current', 'page');
    });

    test('should announce loading state to screen readers', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Click history tab and immediately check for loading announcement
      await historyPage.clickHistoryTab();
      
      // Loading state should be announced
      const loadingStatus = historyPage.getLoadingState();
      await expect(loadingStatus).toHaveAttribute('aria-label', 'Historie wird geladen');
    });

    test('should announce errors to screen readers', async ({ page }) => {
      // Mock API error
      await page.route('**/api/bookings/error-test/history', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Test error' })
        });
      });

      await historyPage.navigateToBookingDetail('error-test');
      await historyPage.clickHistoryTab();
      
      // Error should be announced
      const errorAlert = historyPage.getErrorState();
      await expect(errorAlert).toHaveAttribute('role', 'alert');
      await expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should work on mobile devices', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Tabs should be visible and clickable on mobile
      await expect(page.locator('button:has-text("Details")')).toBeVisible();
      await expect(page.locator('button:has-text("Historie")')).toBeVisible();
      
      // Click history tab
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // History should be visible
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      
      // Content should be readable on mobile
      await expect(page.locator('text=Änderungsverlauf')).toBeVisible();
      
      // User info should be stacked on mobile
      const userInfo = page.locator('text=Admin User').locator('..');
      await expect(userInfo).toBeVisible();
    });

    test('should handle touch interactions', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Tap history tab
      await page.tap('button:has-text("Historie")');
      await historyPage.waitForHistoryToLoad();
      
      // Should show history
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      
      // Tap details tab
      await page.tap('button:has-text("Details")');
      await expect(page.locator('text=Admin User')).toBeVisible();
    });
  });

  test.describe('Complex User Journeys', () => {
    test('should support complete booking management workflow', async ({ page }) => {
      await historyPage.navigateToBookingDetail('987fcdeb-51d2-43a1-b321-654987321098');
      
      // Start with pending booking
      await expect(page.locator('text=Ausstehend')).toBeVisible();
      
      // View history
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      await expect(page.locator('text=Buchung wurde erstellt')).toBeVisible();
      
      // Go back to details and accept booking
      await page.click('button:has-text("Details")');
      await page.click('button:has-text("Annehmen")');
      
      // Wait for page to update
      await page.waitForLoadState('networkidle');
      
      // Check updated status
      await expect(page.locator('text=Angenommen')).toBeVisible();
      
      // History should reflect the change
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Should show acceptance event (this would require the backend to add the event)
      const entries = await historyPage.getHistoryEntries();
      expect(entries.length).toBeGreaterThan(1);
    });

    test('should handle booking with rich history', async ({ page }) => {
      // Mock a booking with complex history
      await page.route('**/api/bookings/rich-history/history', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'rich-1',
              eventType: 'Created',
              timestamp: '2025-07-01T10:00:00Z',
              user: { id: '1', name: 'Customer', email: 'customer@example.com' },
              description: 'Buchung wurde erstellt',
              details: {
                startDate: '2025-08-01',
                endDate: '2025-08-03',
                totalPersons: 4,
                accommodations: ['Main Room', 'Guest Room']
              }
            },
            {
              id: 'rich-2',
              eventType: 'NotesUpdated',
              timestamp: '2025-07-01T10:30:00Z',
              user: { id: '1', name: 'Customer', email: 'customer@example.com' },
              description: 'Notizen wurden hinzugefügt',
              details: { notes: 'Bitte vegetarisches Essen bereitstellen' }
            },
            {
              id: 'rich-3',
              eventType: 'StatusChanged',
              timestamp: '2025-07-01T11:00:00Z',
              user: { id: '2', name: 'Admin', email: 'admin@example.com' },
              description: 'Status geändert',
              details: { reason: 'Manuelle Überprüfung abgeschlossen' },
              previousValue: 0, // Pending
              newValue: 1 // Confirmed
            },
            {
              id: 'rich-4',
              eventType: 'AccommodationsChanged',
              timestamp: '2025-07-01T12:00:00Z',
              user: { id: '2', name: 'Admin', email: 'admin@example.com' },
              description: 'Schlafplätze wurden angepasst',
              details: {
                reason: 'Upgrade auf Premium-Suite',
                previousAccommodations: ['Main Room', 'Guest Room'],
                newAccommodations: ['Premium Suite']
              }
            }
          ])
        });
      });

      await historyPage.navigateToBookingDetail('rich-history');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Should show all event types
      await expect(page.locator('text=Buchung wurde erstellt')).toBeVisible();
      await expect(page.locator('text=Notizen wurden hinzugefügt')).toBeVisible();
      await expect(page.locator('text=Status geändert')).toBeVisible();
      await expect(page.locator('text=Schlafplätze wurden angepasst')).toBeVisible();
      
      // Should show detailed information
      await expect(page.locator('text=vegetarisches Essen')).toBeVisible();
      await expect(page.locator('text=Premium-Suite')).toBeVisible();
      await expect(page.locator('text=Upgrade auf Premium-Suite')).toBeVisible();
      
      // Should show status transition
      await expect(page.locator('text=Ausstehend')).toBeVisible();
      await expect(page.locator('text=Bestätigt')).toBeVisible();
      
      // Should be in chronological order (newest first)
      const entries = await historyPage.getHistoryEntries();
      expect(entries.length).toBe(4);
    });
  });

  test.describe('Real-world Scenarios', () => {
    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/bookings/*/history', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        route.continue();
      });

      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      const startTime = Date.now();
      await historyPage.clickHistoryTab();
      
      // Should show loading state
      await expect(historyPage.getLoadingState()).toBeVisible();
      
      // Wait for history to load
      await historyPage.waitForHistoryToLoad();
      const endTime = Date.now();
      
      // Should eventually load
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      
      // Should take at least 2 seconds due to our delay
      expect(endTime - startTime).toBeGreaterThan(2000);
    });

    test('should work with browser back/forward buttons', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Load history
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Navigate to different page
      await page.goto('/bookings');
      await expect(page.locator('h1:has-text("Buchungen")')).toBeVisible();
      
      // Use browser back button
      await page.goBack();
      
      // Should return to booking detail with history still loaded
      await expect(page.locator('text=Buchungsdetails')).toBeVisible();
      expect(await historyPage.isTabActive('Historie')).toBe(true);
      await expect(historyPage.getHistoryFeed()).toBeVisible();
    });
  });
});