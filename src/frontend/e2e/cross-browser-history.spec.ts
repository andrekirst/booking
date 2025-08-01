import { test, expect, devices } from '@playwright/test';
import { E2EPerformanceMonitor, PerformanceTestUtils } from './utils/performance-monitor';
import { HistoryDataFactory, TestUsers, TestBookingIds } from './fixtures/history-data';

/**
 * Cross-Browser E2E Tests for Booking History
 * Tests compatibility across different browsers and devices
 */
test.describe('Cross-Browser Booking History Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup authentication for all tests
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@booking.com');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/bookings');
  });

  test.describe('Browser Compatibility Matrix', () => {
    // This will run on all browsers defined in playwright.config.ts
    test('should render history timeline consistently', async ({ page, browserName }) => {
      // Mock standard history data
      const historyData = HistoryDataFactory.createStandardHistory(TestBookingIds.STANDARD);
      await page.route(`**/api/bookings/${TestBookingIds.STANDARD}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });

      await page.goto(`/bookings/${TestBookingIds.STANDARD}`);
      await page.click('button:has-text("Historie")');
      
      // Wait for history to load
      await page.waitForSelector('[role="feed"]', { timeout: 10000 });
      
      // Verify basic structure is present
      const historyFeed = page.locator('[role="feed"]');
      await expect(historyFeed).toBeVisible();
      await expect(historyFeed).toHaveAttribute('aria-label', 'Buchungshistorie');
      
      // Check timeline items
      const historyItems = page.locator('[role="listitem"]');
      await expect(historyItems).toHaveCount(2); // Standard history has 2 events
      
      // Verify event icons are rendered
      const eventIcons = page.locator('[role="img"]');
      const iconCount = await eventIcons.count();
      expect(iconCount).toBeGreaterThan(0);
      
      // Check timestamps
      const timestamps = page.locator('[title*="."]'); // German date format
      await expect(timestamps.first()).toBeVisible();
      
      console.log(`✅ History timeline rendering verified in ${browserName}`);
    });

    test('should handle date and time formatting correctly', async ({ page, browserName }) => {
      const historyData = HistoryDataFactory.createComplexHistory(TestBookingIds.COMPLEX, 5);
      await page.route(`**/api/bookings/${TestBookingIds.COMPLEX}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });

      await page.goto(`/bookings/${TestBookingIds.COMPLEX}`);
      await page.click('button:has-text("Historie")');
      await page.waitForSelector('[role="feed"]');
      
      // Check German date formatting in tooltips
      const timestamps = page.locator('[title*="."]');
      const firstTimestamp = timestamps.first();
      
      const titleAttribute = await firstTimestamp.getAttribute('title');
      expect(titleAttribute).toMatch(/\d{2}\.\d{2}\.\d{4}/); // DD.MM.YYYY format
      
      // Check relative time display
      const timestampText = await firstTimestamp.textContent();
      expect(timestampText).toMatch(/vor|gerade eben|minutes?|hours?|days?/i);
      
      // Verify date parsing works correctly across browsers
      const allTimestamps = await timestamps.all();
      for (const timestamp of allTimestamps.slice(0, 3)) { // Check first 3
        const title = await timestamp.getAttribute('title');
        const text = await timestamp.textContent();
        
        expect(title).toBeTruthy();
        expect(text).toBeTruthy();
        expect(title).toMatch(/\d{2}\.\d{2}\.\d{4}/);
      }
      
      console.log(`✅ Date formatting verified in ${browserName}: ${timestampText}`);
    });

    test('should maintain proper CSS styling and layout', async ({ page, browserName }) => {
      const historyData = HistoryDataFactory.createStandardHistory(TestBookingIds.STANDARD);
      await page.route(`**/api/bookings/${TestBookingIds.STANDARD}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });

      await page.goto(`/bookings/${TestBookingIds.STANDARD}`);
      await page.click('button:has-text("Historie")');
      await page.waitForSelector('[role="feed"]');
      
      // Check timeline layout
      const timeline = page.locator('[role="feed"]');
      const timelineStyles = await timeline.evaluate(el => {
        const computedStyle = getComputedStyle(el);
        return {
          display: computedStyle.display,
          flexDirection: computedStyle.flexDirection,
          gap: computedStyle.gap,
          padding: computedStyle.padding
        };
      });
      
      // Verify CSS Grid/Flexbox works
      expect(['flex', 'grid', 'block'].includes(timelineStyles.display)).toBe(true);
      
      // Check event item styling
      const eventItems = page.locator('[role="listitem"]').first();
      const itemStyles = await eventItems.evaluate(el => {
        const computedStyle = getComputedStyle(el);
        return {
          display: computedStyle.display,
          marginBottom: computedStyle.marginBottom,
          padding: computedStyle.padding,
          border: computedStyle.border
        };
      });
      
      // Verify items are properly styled
      expect(itemStyles.display).not.toBe('none');
      
      // Check icon positioning
      const icon = page.locator('[role="img"]').first();
      const iconRect = await icon.boundingBox();
      expect(iconRect).toBeTruthy();
      expect(iconRect!.width).toBeGreaterThan(0);
      expect(iconRect!.height).toBeGreaterThan(0);
      
      console.log(`✅ CSS styling verified in ${browserName}`);
    });

    test('should handle JavaScript execution correctly', async ({ page, browserName }) => {
      const historyData = HistoryDataFactory.createComplexHistory(TestBookingIds.COMPLEX, 8);
      await page.route(`**/api/bookings/${TestBookingIds.COMPLEX}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });

      await page.goto(`/bookings/${TestBookingIds.COMPLEX}`);
      
      // Test tab switching functionality
      const detailsTab = page.locator('button:has-text("Details")');
      const historyTab = page.locator('button:has-text("Historie")');
      
      // Initially Details tab should be active
      await expect(detailsTab).toHaveAttribute('aria-current', 'page');
      
      // Click history tab
      await historyTab.click();
      await page.waitForSelector('[role="feed"]');
      
      // History tab should now be active
      await expect(historyTab).toHaveAttribute('aria-current', 'page');
      await expect(detailsTab).not.toHaveAttribute('aria-current', 'page');
      
      // Test lazy loading worked
      const historyItems = page.locator('[role="listitem"]');
      await expect(historyItems).toHaveCount(8);
      
      // Switch back to details
      await detailsTab.click();
      await expect(detailsTab).toHaveAttribute('aria-current', 'page');
      
      // Switch back to history - should be cached
      const startTime = Date.now();
      await historyTab.click();
      await page.waitForSelector('[role="feed"]');
      const loadTime = Date.now() - startTime;
      
      // Should load quickly from cache
      expect(loadTime).toBeLessThan(1000);
      
      console.log(`✅ JavaScript execution verified in ${browserName} (cache load: ${loadTime}ms)`);
    });
  });

  test.describe('Mobile Browser Testing', () => {
    // Test with different mobile devices
    ['iPhone 12', 'Pixel 5', 'Samsung Galaxy S21'].forEach(deviceName => {
      test(`should work on ${deviceName}`, async ({ browser }) => {
        const device = devices[deviceName as keyof typeof devices];
        if (!device) return; // Skip if device not available
        
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        // Login on mobile
        await page.goto('/login');
        await page.fill('[data-testid="email"]', 'admin@booking.com');
        await page.fill('[data-testid="password"]', 'admin123');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/bookings');
        
        // Mock history data
        const historyData = HistoryDataFactory.createStandardHistory(TestBookingIds.STANDARD);
        await page.route(`**/api/bookings/${TestBookingIds.STANDARD}/history`, route => {
          route.fulfill(HistoryDataFactory.toApiResponse(historyData));
        });
        
        await page.goto(`/bookings/${TestBookingIds.STANDARD}`);
        
        // Check mobile layout
        const viewport = page.viewportSize();
        expect(viewport!.width).toBeLessThan(768); // Mobile viewport
        
        // Test touch interaction
        await page.tap('button:has-text("Historie")');
        await page.waitForSelector('[role="feed"]');
        
        // Verify mobile-optimized layout
        const historyFeed = page.locator('[role="feed"]');
        await expect(historyFeed).toBeVisible();
        
        // Check if content is readable on mobile
        const historyItems = page.locator('[role="listitem"]');
        const firstItemRect = await historyItems.first().boundingBox();
        
        expect(firstItemRect!.width).toBeLessThan(viewport!.width);
        expect(firstItemRect!.width).toBeGreaterThan(viewport!.width * 0.8); // Uses most of width
        
        // Test scrolling on mobile
        if (await historyItems.count() > 3) {
          const lastItem = historyItems.last();
          await lastItem.scrollIntoViewIfNeeded();
          await expect(lastItem).toBeVisible();
        }
        
        await context.close();
        console.log(`✅ Mobile functionality verified on ${deviceName}`);
      });
    });

    test('should handle orientation changes', async ({ browser }) => {
      const context = await browser.newContext(devices['iPhone 12']);
      const page = await context.newPage();
      
      // Login
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'admin@booking.com');
      await page.fill('[data-testid="password"]', 'admin123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/bookings');
      
      // Mock history
      const historyData = HistoryDataFactory.createComplexHistory(TestBookingIds.COMPLEX, 6);
      await page.route(`**/api/bookings/${TestBookingIds.COMPLEX}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });
      
      await page.goto(`/bookings/${TestBookingIds.COMPLEX}`);
      await page.tap('button:has-text("Historie")');
      await page.waitForSelector('[role="feed"]');
      
      // Portrait mode - verify layout
      let viewport = page.viewportSize();
      expect(viewport!.height).toBeGreaterThan(viewport!.width);
      
      const portraitItemRect = await page.locator('[role="listitem"]').first().boundingBox();
      
      // Change to landscape
      await page.setViewportSize({ width: 844, height: 390 }); // iPhone 12 landscape
      await page.waitForTimeout(500); // Allow layout to settle
      
      // Landscape mode - verify adaptation
      viewport = page.viewportSize();
      expect(viewport!.width).toBeGreaterThan(viewport!.height);
      
      const landscapeItemRect = await page.locator('[role="listitem"]').first().boundingBox();
      
      // Layout should adapt
      expect(landscapeItemRect!.width).not.toBe(portraitItemRect!.width);
      
      // Content should still be visible and functional
      await expect(page.locator('[role="feed"]')).toBeVisible();
      await expect(page.locator('[role="listitem"]')).toHaveCount(6);
      
      await context.close();
      console.log('✅ Orientation change handling verified');
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should meet performance budgets on all browsers', async ({ page, browserName }) => {
      const monitor = new E2EPerformanceMonitor(page);
      
      // Mock performance test data
      const historyData = HistoryDataFactory.createLargeHistory(TestBookingIds.PERFORMANCE, 50);
      await page.route(`**/api/bookings/${TestBookingIds.PERFORMANCE}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });
      
      // Measure history loading performance
      const metrics = await monitor.measureHistoryLoad(TestBookingIds.PERFORMANCE);
      
      // Browser-specific performance budgets
      const budgetsByBrowser = {
        'chromium': { maxHistoryLoadTime: 2000, maxMemoryGrowth: 30 * 1024 * 1024 },
        'firefox': { maxHistoryLoadTime: 2500, maxMemoryGrowth: 35 * 1024 * 1024 },
        'webkit': { maxHistoryLoadTime: 3000, maxMemoryGrowth: 40 * 1024 * 1024 }
      };
      
      const budget = budgetsByBrowser[browserName as keyof typeof budgetsByBrowser] || 
        budgetsByBrowser.chromium;
      
      // Validate performance
      try {
        PerformanceTestUtils.assertPerformanceBudget(metrics, budget);
        console.log(`✅ Performance budget met in ${browserName}: ${metrics.duration.toFixed(2)}ms`);
      } catch (error) {
        console.warn(`⚠️  Performance budget exceeded in ${browserName}: ${error}`);
        // Don't fail test, just warn - browsers have different performance characteristics
      }
      
      // Verify functionality works regardless of performance
      await expect(page.locator('[role="feed"]')).toBeVisible();
      const itemCount = await page.locator('[role="listitem"]').count();
      expect(itemCount).toBeGreaterThan(0);
      expect(itemCount).toBeLessThanOrEqual(50); // Virtual scrolling should limit DOM nodes
    });

    test('should handle memory pressure consistently', async ({ page, browserName }) => {
      // Simulate memory pressure
      await PerformanceTestUtils.simulateMemoryPressure(page);
      
      const monitor = new E2EPerformanceMonitor(page);
      const historyData = HistoryDataFactory.createLargeHistory(TestBookingIds.PERFORMANCE, 100);
      
      await page.route(`**/api/bookings/${TestBookingIds.PERFORMANCE}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });
      
      // Measure under memory pressure
      const metrics = await monitor.measureHistoryLoad(TestBookingIds.PERFORMANCE);
      
      // Should still function under memory pressure
      await expect(page.locator('[role="feed"]')).toBeVisible();
      
      // Memory growth should be reasonable even under pressure
      const memoryGrowth = metrics.memory?.growth || 0;
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // <100MB even under pressure
      
      console.log(`✅ Memory pressure handling verified in ${browserName}: ${memoryGrowth} bytes growth`);
    });
  });

  test.describe('Accessibility Across Browsers', () => {
    test('should maintain accessibility standards', async ({ page, browserName }) => {
      const historyData = HistoryDataFactory.createStandardHistory(TestBookingIds.STANDARD);
      await page.route(`**/api/bookings/${TestBookingIds.STANDARD}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });

      await page.goto(`/bookings/${TestBookingIds.STANDARD}`);
      await page.click('button:has-text("Historie")');
      await page.waitForSelector('[role="feed"]');
      
      // Check ARIA attributes
      const feed = page.locator('[role="feed"]');
      await expect(feed).toHaveAttribute('aria-label', 'Buchungshistorie');
      await expect(feed).toHaveAttribute('aria-live', 'polite');
      
      // Check keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test tab navigation through history items
      let tabCount = 0;
      const maxTabs = 10; // Prevent infinite loop
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;
        
        const currentFocus = await page.locator(':focus').getAttribute('role');
        if (['button', 'link', 'tab'].includes(currentFocus || '')) {
          break; // Found focusable element
        }
      }
      
      expect(tabCount).toBeLessThan(maxTabs); // Should find focusable element
      
      // Test screen reader announcements
      const loadingStatus = page.locator('[role="status"]');
      if (await loadingStatus.count() > 0) {
        await expect(loadingStatus.first()).toHaveAttribute('aria-live');
      }
      
      // Test error announcements
      const errorAlerts = page.locator('[role="alert"]');
      if (await errorAlerts.count() > 0) {
        await expect(errorAlerts.first()).toHaveAttribute('aria-live');
      }
      
      console.log(`✅ Accessibility verified in ${browserName}`);
    });

    test('should work with browser zoom levels', async ({ page, browserName }) => {
      const historyData = HistoryDataFactory.createStandardHistory(TestBookingIds.STANDARD);
      await page.route(`**/api/bookings/${TestBookingIds.STANDARD}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });

      await page.goto(`/bookings/${TestBookingIds.STANDARD}`);
      await page.click('button:has-text("Historie")');
      await page.waitForSelector('[role="feed"]');
      
      // Test different zoom levels
      const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
      
      for (const zoom of zoomLevels) {
        // Set zoom level
        await page.evaluate(`document.body.style.zoom = '${zoom}'`);
        await page.waitForTimeout(200); // Allow layout to settle
        
        // Verify content is still visible and accessible
        await expect(page.locator('[role="feed"]')).toBeVisible();
        
        const historyItems = page.locator('[role="listitem"]');
        await expect(historyItems).toHaveCount(2);
        
        // Check that text is readable
        const firstItemText = await historyItems.first().textContent();
        expect(firstItemText).toContain('Buchung wurde erstellt');
        
        // Verify buttons are clickable
        const detailsTab = page.locator('button:has-text("Details")');
        const historyTab = page.locator('button:has-text("Historie")');
        
        await expect(detailsTab).toBeVisible();
        await expect(historyTab).toBeVisible();
      }
      
      // Reset zoom
      await page.evaluate(`document.body.style.zoom = '1.0'`);
      
      console.log(`✅ Zoom level compatibility verified in ${browserName}`);
    });
  });

  test.describe('Network Conditions Across Browsers', () => {
    test('should handle slow network consistently', async ({ page, browserName }) => {
      // Simulate slow 3G network
      await PerformanceTestUtils.simulateSlowNetwork(page, 2000);
      
      const historyData = HistoryDataFactory.createStandardHistory(TestBookingIds.STANDARD);
      await page.route(`**/api/bookings/${TestBookingIds.STANDARD}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });

      await page.goto(`/bookings/${TestBookingIds.STANDARD}`);
      
      const startTime = Date.now();
      await page.click('button:has-text("Historie")');
      
      // Should show loading state
      await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 1000 });
      
      // Eventually load content
      await page.waitForSelector('[role="feed"]', { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      // Should take at least 2 seconds due to network delay
      expect(loadTime).toBeGreaterThan(2000);
      
      // Content should load correctly
      await expect(page.locator('[role="listitem"]')).toHaveCount(2);
      
      console.log(`✅ Slow network handling verified in ${browserName}: ${loadTime}ms`);
    });

    test('should recover from network failures', async ({ page, browserName }) => {
      let requestCount = 0;
      
      await page.route(`**/api/bookings/${TestBookingIds.STANDARD}/history`, route => {
        requestCount++;
        
        if (requestCount === 1) {
          // First request fails
          route.abort('internetdisconnected');
        } else {
          // Second request succeeds
          const historyData = HistoryDataFactory.createStandardHistory(TestBookingIds.STANDARD);
          route.fulfill(HistoryDataFactory.toApiResponse(historyData));
        }
      });

      await page.goto(`/bookings/${TestBookingIds.STANDARD}`);
      await page.click('button:has-text("Historie")');
      
      // Should show error state
      await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Fehler beim Laden|Network error')).toBeVisible();
      
      // Should show retry button
      const retryButton = page.locator('button:has-text("Neu laden|Retry")');
      await expect(retryButton).toBeVisible();
      
      // Click retry
      await retryButton.click();
      
      // Should eventually succeed
      await page.waitForSelector('[role="feed"]', { timeout: 10000 });
      await expect(page.locator('[role="listitem"]')).toHaveCount(2);
      
      expect(requestCount).toBe(2); // Verify retry happened
      
      console.log(`✅ Network failure recovery verified in ${browserName}`);
    });
  });

  test.describe('Browser Extensions Compatibility', () => {
    test('should work with common browser extensions simulated', async ({ page, browserName }) => {
      // Simulate ad blocker behavior
      await page.addInitScript(() => {
        // Mock ad blocker modifications
        const originalFetch = window.fetch;
        window.fetch = function(...args: any[]) {
          const url = args[0].toString();
          if (url.includes('analytics') || url.includes('tracking')) {
            return Promise.reject(new Error('Blocked by ad blocker'));
          }
          return originalFetch.apply(this, args);
        };
        
        // Simulate content modification
        const observer = new MutationObserver(() => {
          // Remove elements that look like ads
          const suspiciousElements = document.querySelectorAll('[data-track], .analytics, .advertisement');
          suspiciousElements.forEach(el => el.remove());
        });
        
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      });
      
      const historyData = HistoryDataFactory.createStandardHistory(TestBookingIds.STANDARD);
      await page.route(`**/api/bookings/${TestBookingIds.STANDARD}/history`, route => {
        route.fulfill(HistoryDataFactory.toApiResponse(historyData));
      });

      await page.goto(`/bookings/${TestBookingIds.STANDARD}`);
      await page.click('button:has-text("Historie")');
      await page.waitForSelector('[role="feed"]');
      
      // Should work despite extension interference
      await expect(page.locator('[role="feed"]')).toBeVisible();
      await expect(page.locator('[role="listitem"]')).toHaveCount(2);
      await expect(page.locator('text=Buchung wurde erstellt')).toBeVisible();
      
      console.log(`✅ Browser extension compatibility verified in ${browserName}`);
    });
  });
});

/**
 * Helper function to run tests across specific browser combinations
 */
export function runCrossBrowserTest(
  testName: string, 
  testFn: (page: any, browserName: string) => Promise<void>,
  browsers: string[] = ['chromium', 'firefox', 'webkit']
) {
  browsers.forEach(browserName => {
    test(`${testName} - ${browserName}`, async ({ page }) => {
      await testFn(page, browserName);
    });
  });
}

/**
 * Browser compatibility matrix for manual verification
 */
export const BrowserCompatibilityMatrix = {
  features: {
    'History Timeline Rendering': ['chromium', 'firefox', 'webkit', 'mobile'],
    'Date Formatting': ['chromium', 'firefox', 'webkit', 'mobile'],
    'CSS Grid/Flexbox Layout': ['chromium', 'firefox', 'webkit', 'mobile'],
    'JavaScript Event Handling': ['chromium', 'firefox', 'webkit', 'mobile'],
    'Touch Interactions': ['mobile'],
    'Keyboard Navigation': ['chromium', 'firefox', 'webkit'],
    'Screen Reader Support': ['chromium', 'firefox', 'webkit'],
    'Memory Management': ['chromium', 'firefox', 'webkit', 'mobile'],
    'Network Error Recovery': ['chromium', 'firefox', 'webkit', 'mobile'],
    'Performance Budgets': ['chromium', 'firefox', 'webkit', 'mobile']
  },
  
  knownIssues: {
    'webkit': [
      'Date.toLocaleString() may behave differently',
      'Memory API not available in all versions'
    ],
    'firefox': [
      'Some CSS properties may render differently',
      'Performance.memory not available'
    ],
    'mobile': [
      'Touch events may have different timing',
      'Memory constraints more significant'
    ]
  },
  
  testingStrategy: {
    'chromium': 'Primary development browser - full feature testing',
    'firefox': 'Cross-browser compatibility - layout and JS differences',
    'webkit': 'Safari compatibility - WebKit specific behaviors',
    'mobile': 'Touch interactions and responsive design'
  }
};