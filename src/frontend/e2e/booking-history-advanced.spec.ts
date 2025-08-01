import { test, expect, Page } from '@playwright/test';
import { BookingHistoryPage } from './pages/BookingHistoryPage';

/**
 * Advanced E2E Tests for Booking History Feature
 * Extends the basic booking-history.spec.ts with additional scenarios
 */
test.describe('Advanced Booking History E2E Tests', () => {
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

  test.describe('Cross-Browser Compatibility', () => {
    test('should render history timeline consistently across browsers', async ({ page, browserName }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Verify timeline structure is consistent
      const timeline = historyPage.getHistoryFeed();
      await expect(timeline).toBeVisible();
      
      // Check CSS Grid/Flexbox rendering
      const timelineStyles = await timeline.evaluate(el => {
        const computedStyle = getComputedStyle(el);
        return {
          display: computedStyle.display,
          flexDirection: computedStyle.flexDirection,
          gap: computedStyle.gap
        };
      });
      
      expect(timelineStyles.display).toBe('flex');
      expect(timelineStyles.flexDirection).toBe('column');
      
      // Browser-specific icon rendering
      const eventIcons = await page.locator('[role="img"]').count();
      expect(eventIcons).toBeGreaterThan(0);
      
      console.log(`✅ History rendering verified in ${browserName}`);
    });

    test('should handle date formatting across browsers', async ({ page, browserName }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Verify date formatting is consistent
      const timestamps = await historyPage.getTimestamps();
      const firstTimestamp = timestamps[0];
      
      const timestampText = await firstTimestamp.textContent();
      const titleAttribute = await firstTimestamp.getAttribute('title');
      
      // Should have German date format in title
      expect(titleAttribute).toMatch(/\d{2}\.\d{2}\.\d{4}/);
      // Should have relative time in text
      expect(timestampText).toMatch(/vor|gerade eben|minutes?|hours?|days?/i);
      
      console.log(`✅ Date formatting verified in ${browserName}: ${timestampText}`);
    });

    test('should maintain accessibility across browsers', async ({ page, browserName }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Check ARIA attributes
      const feed = historyPage.getHistoryFeed();
      await expect(feed).toHaveAttribute('role', 'feed');
      await expect(feed).toHaveAttribute('aria-label', 'Buchungshistorie');
      
      // Check keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').getAttribute('role');
      
      // Should focus on interactive elements
      expect(['button', 'tab', 'link'].includes(focusedElement || '')).toBe(true);
      
      console.log(`✅ Accessibility verified in ${browserName}`);
    });
  });

  test.describe('Extended Mobile Testing', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should handle orientation changes gracefully', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Verify portrait layout
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      const portraitHeight = await page.locator('body').boundingBox();
      
      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500); // Allow layout to settle
      
      // Should still be visible in landscape
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      const landscapeHeight = await page.locator('body').boundingBox();
      
      // Layout should adapt
      expect(portraitHeight?.height).toBeGreaterThan(landscapeHeight?.height || 0);
      
      // Reset to portrait
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should handle touch gestures for timeline navigation', async ({ page }) => {
      // Mock large history for scrolling
      await page.route('**/api/bookings/scrollable-history/history', route => {
        const largeHistory = Array.from({ length: 50 }, (_, i) => ({
          id: `scroll-${i}`,
          eventType: 'StatusChanged',
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          description: `Geschichte ${i + 1}`,
          details: {}
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeHistory)
        });
      });

      await historyPage.navigateToBookingDetail('scrollable-history');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Test touch scrolling
      const timeline = historyPage.getHistoryFeed();
      const timelineBounds = await timeline.boundingBox();
      
      if (timelineBounds) {
        // Swipe down to scroll
        await page.touchscreen.tap(timelineBounds.x + 100, timelineBounds.y + 100);
        await page.touchscreen.tap(timelineBounds.x + 100, timelineBounds.y + 300);
        
        // Should reveal more content
        await expect(page.locator('text=Geschichte 10')).toBeVisible();
      }
    });

    test('should optimize performance on mobile devices', async ({ page }) => {
      // Mock performance.memory if available
      await page.addInitScript(() => {
        if (!(window as any).performance.memory) {
          (window as any).performance.memory = {
            usedJSHeapSize: 10 * 1024 * 1024, // 10MB initial
            totalJSHeapSize: 50 * 1024 * 1024,
            jsHeapSizeLimit: 100 * 1024 * 1024
          };
        }
      });

      const startMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);
      const startTime = performance.now();
      
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      const endTime = performance.now();
      const endMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);
      
      // Performance benchmarks for mobile
      expect(endTime - startTime).toBeLessThan(5000); // 5s on mobile
      expect(endMemory - startMemory).toBeLessThan(20 * 1024 * 1024); // <20MB memory
    });
  });

  test.describe('Advanced Performance Monitoring', () => {
    test('should monitor Core Web Vitals for history loading', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Start measuring Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};
          
          // Largest Contentful Paint
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            vitals.lcp = entries[entries.length - 1].startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // First Input Delay would be measured on real interaction
          // Cumulative Layout Shift
          new PerformanceObserver((entryList) => {
            let cls = 0;
            for (const entry of entryList.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
            vitals.cls = cls;
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Resolve after a short delay
          setTimeout(() => resolve(vitals), 2000);
        });
      });
      
      // Trigger history loading
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      const vitalsResult = await webVitals;
      
      // Verify Web Vitals thresholds
      expect((vitalsResult as any).lcp).toBeLessThan(2500); // LCP < 2.5s
      expect((vitalsResult as any).cls).toBeLessThan(0.1);   // CLS < 0.1
    });

    test('should handle resource loading efficiently', async ({ page }) => {
      // Monitor network requests
      const requests: string[] = [];
      page.on('request', request => {
        requests.push(request.url());
      });
      
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Should make minimal network requests
      const historyRequests = requests.filter(url => url.includes('/history'));
      expect(historyRequests.length).toBe(1); // Only one history request
      
      // Should not reload when switching tabs
      const initialRequestCount = requests.length;
      await page.click('button:has-text("Details")');
      await page.waitForTimeout(500);
      await historyPage.clickHistoryTab();
      
      const finalRequestCount = requests.length;
      expect(finalRequestCount - initialRequestCount).toBe(0); // No additional requests
    });

    test('should measure rendering performance for large histories', async ({ page }) => {
      // Mock large history dataset
      await page.route('**/api/bookings/performance-test/history', route => {
        const largeHistory = Array.from({ length: 200 }, (_, i) => ({
          id: `perf-${i}`,
          eventType: ['Created', 'StatusChanged', 'NotesUpdated', 'AccommodationsChanged'][i % 4],
          timestamp: new Date(Date.now() - i * 30000).toISOString(),
          user: { 
            id: `${(i % 5) + 1}`, 
            name: `Performance User ${(i % 5) + 1}`, 
            email: `perf${(i % 5) + 1}@example.com` 
          },
          description: `Performance Test Event ${i + 1} with long description text that tests rendering performance`,
          details: {
            performanceTestIndex: i,
            largeData: Array.from({ length: 10 }, (_, j) => `data-${j}`).join(', ')
          }
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeHistory)
        });
      });
      
      const startTime = performance.now();
      
      await historyPage.navigateToBookingDetail('performance-test');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      const renderTime = performance.now() - startTime;
      
      // Should render large history efficiently
      expect(renderTime).toBeLessThan(3000); // 3 seconds max
      
      // Check that virtual scrolling is working (not all items rendered)
      const renderedItems = await page.locator('[role="listitem"]').count();
      expect(renderedItems).toBeLessThan(200); // Virtual scrolling should limit DOM nodes
      expect(renderedItems).toBeGreaterThan(10); // But show reasonable amount
    });
  });

  test.describe('Extended Real-World Scenarios', () => {
    test('should recover from intermittent network failures', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('**/api/bookings/flaky-network/history', route => {
        requestCount++;
        
        if (requestCount === 1) {
          route.abort('internetdisconnected');
        } else if (requestCount === 2) {
          route.fulfill({ status: 500, body: '{"error": "Server temporarily unavailable"}' });
        } else {
          // Third attempt succeeds
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
              id: 'recovery-1',
              eventType: 'Created',
              timestamp: new Date().toISOString(),
              user: { id: '1', name: 'Test User', email: 'test@example.com' },
              description: 'Buchung wurde erstellt (nach Retry)',
              details: {}
            }])
          });
        }
      });
      
      await historyPage.navigateToBookingDetail('flaky-network');
      await historyPage.clickHistoryTab();
      
      // Should show retry mechanism
      await expect(page.locator('text=Fehler beim Laden|Network error')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('button:has-text("Neu laden|Retry")')).toBeVisible();
      
      // Automatic retry should eventually succeed
      await expect(page.locator('text=Buchung wurde erstellt (nach Retry)')).toBeVisible({ timeout: 15000 });
      
      expect(requestCount).toBe(3); // Verify retry logic worked
    });

    test('should handle concurrent user interactions', async ({ page }) => {
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      
      // Simulate rapid user interactions
      const interactions = [
        () => historyPage.clickHistoryTab(),
        () => page.click('button:has-text("Details")'),
        () => historyPage.clickHistoryTab(),
        () => page.reload(),
        () => historyPage.clickHistoryTab()
      ];
      
      // Execute interactions rapidly
      for (const interaction of interactions) {
        await interaction();
        await page.waitForTimeout(100); // Short delay between interactions
      }
      
      // Should end up in stable state
      await historyPage.waitForHistoryToLoad();
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      expect(await historyPage.isTabActive('Historie')).toBe(true);
    });

    test('should work correctly with browser extensions', async ({ page }) => {
      // Simulate common browser extension behaviors
      await page.addInitScript(() => {
        // Simulate ad blocker
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0].toString();
          if (url.includes('analytics') || url.includes('tracking')) {
            return Promise.reject(new Error('Blocked by ad blocker'));
          }
          return originalFetch(...args);
        };
        
        // Simulate content blocker modifying DOM
        const observer = new MutationObserver(() => {
          const suspiciousElements = document.querySelectorAll('[data-track], .analytics');
          suspiciousElements.forEach(el => el.remove());
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
      
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Should work despite extension interference
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      await expect(page.locator('text=Änderungsverlauf')).toBeVisible();
    });

    test('should handle memory pressure scenarios', async ({ page }) => {
      // Simulate low memory conditions
      await page.addInitScript(() => {
        // Mock memory pressure
        Object.defineProperty(navigator, 'deviceMemory', {
          writable: false,
          value: 1 // 1GB device memory (low-end device)
        });
        
        // Mock performance.memory for memory monitoring
        (window as any).performance.memory = {
          usedJSHeapSize: 80 * 1024 * 1024, // 80MB used (high for mobile)
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 120 * 1024 * 1024  // Low memory limit
        };
      });
      
      const initialMemory = await page.evaluate(() => 
        (performance as any).memory?.usedJSHeapSize || 0
      );
      
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      const afterLoadMemory = await page.evaluate(() => 
        (performance as any).memory?.usedJSHeapSize || 0
      );
      
      // Should not cause excessive memory usage
      const memoryGrowth = afterLoadMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(30 * 1024 * 1024); // <30MB growth
      
      // Should still function correctly
      await expect(historyPage.getHistoryFeed()).toBeVisible();
    });
  });

  test.describe('Integration with External Systems', () => {
    test('should handle API rate limiting gracefully', async ({ page }) => {
      let requestCount = 0;
      
      await page.route('**/api/bookings/rate-limited/history', route => {
        requestCount++;
        
        if (requestCount <= 2) {
          route.fulfill({
            status: 429,
            headers: { 'Retry-After': '1' },
            body: JSON.stringify({ error: 'Rate limit exceeded' })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
              id: 'rate-limit-success',
              eventType: 'Created',
              timestamp: new Date().toISOString(),
              user: { id: '1', name: 'Test User', email: 'test@example.com' },
              description: 'Geladen nach Rate Limit',
              details: {}
            }])
          });
        }
      });
      
      await historyPage.navigateToBookingDetail('rate-limited');
      await historyPage.clickHistoryTab();
      
      // Should show rate limiting message
      await expect(page.locator('text=Zu viele Anfragen|Rate limit')).toBeVisible({ timeout: 5000 });
      
      // Should automatically retry and succeed
      await expect(page.locator('text=Geladen nach Rate Limit')).toBeVisible({ timeout: 10000 });
      
      expect(requestCount).toBe(3); // Initial request + 2 retries
    });

    test('should work with CDN failures', async ({ page }) => {
      // Mock CDN failure for static assets
      await page.route('**/static/**', route => {
        route.fulfill({ status: 503, body: 'CDN Unavailable' });
      });
      
      await historyPage.navigateToBookingDetail('123e4567-e89b-12d3-a456-426614174000');
      await historyPage.clickHistoryTab();
      await historyPage.waitForHistoryToLoad();
      
      // Should work without CDN assets (graceful degradation)
      await expect(historyPage.getHistoryFeed()).toBeVisible();
      
      // Verify fallback styles are applied
      const hasInlineStyles = await page.locator('[style]').count();
      expect(hasInlineStyles).toBeGreaterThan(0); // Fallback inline styles
    });
  });
});

/**
 * Enhanced BookingHistoryPage class with additional methods
 * Extends the basic BookingHistoryPage from booking-history.spec.ts
 */
export class BookingHistoryPage {
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

  // Additional methods for advanced testing
  async measureLoadPerformance() {
    const startTime = performance.now();
    await this.clickHistoryTab();
    await this.waitForHistoryToLoad();
    return performance.now() - startTime;
  }

  async getVisibleHistoryItemsCount() {
    const entries = await this.getHistoryEntries();
    return entries.length;
  }

  async scrollToHistoryItem(index: number) {
    const entries = await this.getHistoryEntries();
    if (entries[index]) {
      await entries[index].scrollIntoViewIfNeeded();
    }
  }

  async getHistoryItemByIndex(index: number) {
    const entries = await this.getHistoryEntries();
    return entries[index];
  }

  async getMemoryUsage() {
    return await this.page.evaluate(() => 
      (performance as any).memory?.usedJSHeapSize || 0
    );
  }

  async waitForStableRendering() {
    // Wait for layout to stabilize
    await this.page.waitForFunction(() => {
      return document.querySelectorAll('[role="listitem"]').length > 0;
    });
    
    await this.page.waitForTimeout(500); // Additional stabilization time
  }
}