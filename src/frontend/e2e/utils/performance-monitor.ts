/**
 * Performance Monitoring Utilities for E2E Tests
 * Provides comprehensive performance measurement and monitoring capabilities
 */

import { Page } from '@playwright/test';

export interface PerformanceMetrics {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  memory?: {
    initial: number;
    final: number;
    peak: number;
    growth: number;
  };
  networkRequests?: NetworkMetric[];
  webVitals?: WebVitalsMetrics;
}

export interface NetworkMetric {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  size: number;
}

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Advanced Performance Monitor for E2E Tests
 */
export class E2EPerformanceMonitor {
  private page: Page;
  private measurements: Map<string, PerformanceMetrics> = new Map();
  private networkRequests: NetworkMetric[] = [];
  private isMonitoring: boolean = false;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start monitoring performance for a specific operation
   */
  async startMeasurement(name: string): Promise<void> {
    const startTime = performance.now();
    const initialMemory = await this.getMemoryUsage();
    
    // Reset network tracking
    this.networkRequests = [];
    
    // Start network monitoring if not already active
    if (!this.isMonitoring) {
      this.setupNetworkMonitoring();
      this.isMonitoring = true;
    }

    const metrics: PerformanceMetrics = {
      name,
      duration: 0,
      startTime,
      endTime: 0,
      memory: {
        initial: initialMemory.usedJSHeapSize,
        final: 0,
        peak: initialMemory.usedJSHeapSize,
        growth: 0
      },
      networkRequests: [],
      webVitals: {}
    };

    this.measurements.set(name, metrics);
  }

  /**
   * End measurement and calculate final metrics
   */
  async endMeasurement(name: string): Promise<PerformanceMetrics> {
    const metrics = this.measurements.get(name);
    if (!metrics) {
      throw new Error(`No measurement started for: ${name}`);
    }

    const endTime = performance.now();
    const finalMemory = await this.getMemoryUsage();
    const webVitals = await this.collectWebVitals();

    metrics.endTime = endTime;
    metrics.duration = endTime - metrics.startTime;
    metrics.memory!.final = finalMemory.usedJSHeapSize;
    metrics.memory!.growth = finalMemory.usedJSHeapSize - metrics.memory!.initial;
    metrics.networkRequests = [...this.networkRequests];
    metrics.webVitals = webVitals;

    return metrics;
  }

  /**
   * Get current memory usage
   */
  private async getMemoryUsage(): Promise<MemoryInfo> {
    return await this.page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      }
      // Fallback for browsers without memory API
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      };
    });
  }

  /**
   * Setup network request monitoring
   */
  private setupNetworkMonitoring(): void {
    this.page.on('response', (response) => {
      const request = response.request();
      const timing = response.timing();
      
      this.networkRequests.push({
        url: request.url(),
        method: request.method(),
        status: response.status(),
        responseTime: timing.responseEnd - timing.requestStart,
        size: response.headers()['content-length'] ? 
          parseInt(response.headers()['content-length']) : 0
      });
    });
  }

  /**
   * Collect Web Vitals metrics
   */
  private async collectWebVitals(): Promise<WebVitalsMetrics> {
    return await this.page.evaluate(() => {
      return new Promise<WebVitalsMetrics>((resolve) => {
        const vitals: WebVitalsMetrics = {};
        let collectedCount = 0;
        const expectedCount = 3; // LCP, FCP, CLS
        
        const checkComplete = () => {
          collectedCount++;
          if (collectedCount >= expectedCount) {
            setTimeout(() => resolve(vitals), 100);
          }
        };

        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            vitals.lcp = entries[entries.length - 1].startTime;
          }
          checkComplete();
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Contentful Paint
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            vitals.fcp = entries[0].startTime;
          }
          checkComplete();
        }).observe({ entryTypes: ['paint'] });

        // Cumulative Layout Shift
        new PerformanceObserver((entryList) => {
          let cls = 0;
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          vitals.cls = cls;
          checkComplete();
        }).observe({ entryTypes: ['layout-shift'] });

        // Fallback timeout
        setTimeout(() => {
          resolve(vitals);
        }, 3000);
      });
    });
  }

  /**
   * Monitor page load performance
   */
  async measurePageLoad(url: string): Promise<PerformanceMetrics> {
    await this.startMeasurement('page_load');
    
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    
    return await this.endMeasurement('page_load');
  }

  /**
   * Monitor history loading performance specifically
   */
  async measureHistoryLoad(bookingId: string): Promise<PerformanceMetrics> {
    await this.startMeasurement('history_load');
    
    // Navigate to booking detail page
    await this.page.goto(`/bookings/${bookingId}`);
    await this.page.waitForLoadState('networkidle');
    
    // Click history tab and wait for loading
    await this.page.click('button:has-text("Historie")');
    await this.page.waitForSelector('[data-testid="history-timeline"], [role="feed"]', {
      timeout: 10000
    });
    
    return await this.endMeasurement('history_load');
  }

  /**
   * Measure operation with automatic start/end
   */
  async measureOperation<T>(
    name: string, 
    operation: () => Promise<T>
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    await this.startMeasurement(name);
    
    try {
      const result = await operation();
      const metrics = await this.endMeasurement(name);
      return { result, metrics };
    } catch (error) {
      await this.endMeasurement(name);
      throw error;
    }
  }

  /**
   * Get all measurements
   */
  getAllMeasurements(): PerformanceMetrics[] {
    return Array.from(this.measurements.values());
  }

  /**
   * Get measurement by name
   */
  getMeasurement(name: string): PerformanceMetrics | undefined {
    return this.measurements.get(name);
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const measurements = this.getAllMeasurements();
    
    return {
      totalMeasurements: measurements.length,
      averageDuration: measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length,
      slowestOperation: measurements.reduce((prev, current) => 
        prev.duration > current.duration ? prev : current
      ),
      fastestOperation: measurements.reduce((prev, current) => 
        prev.duration < current.duration ? prev : current
      ),
      totalMemoryGrowth: measurements.reduce((sum, m) => sum + (m.memory?.growth || 0), 0),
      totalNetworkRequests: measurements.reduce((sum, m) => sum + (m.networkRequests?.length || 0), 0),
      measurements: measurements.map(m => ({
        name: m.name,
        duration: m.duration,
        memoryGrowth: m.memory?.growth || 0,
        networkRequests: m.networkRequests?.length || 0,
        webVitals: m.webVitals
      }))
    };
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
    this.networkRequests = [];
  }

  /**
   * Set performance budget thresholds
   */
  static getPerformanceBudget(): PerformanceBudget {
    return {
      maxPageLoadTime: 3000,      // 3 seconds
      maxHistoryLoadTime: 2000,   // 2 seconds
      maxMemoryGrowth: 50 * 1024 * 1024, // 50MB
      maxNetworkRequests: 10,
      webVitals: {
        maxLCP: 2500,             // 2.5 seconds
        maxFID: 100,              // 100ms
        maxCLS: 0.1               // 0.1
      }
    };
  }

  /**
   * Validate performance against budget
   */
  validatePerformance(metrics: PerformanceMetrics, budget?: PerformanceBudget): PerformanceValidation {
    const actualBudget = budget || E2EPerformanceMonitor.getPerformanceBudget();
    const violations: string[] = [];

    if (metrics.duration > actualBudget.maxPageLoadTime) {
      violations.push(`Duration exceeded: ${metrics.duration}ms > ${actualBudget.maxPageLoadTime}ms`);
    }

    if (metrics.memory?.growth && metrics.memory.growth > actualBudget.maxMemoryGrowth) {
      violations.push(`Memory growth exceeded: ${metrics.memory.growth} bytes > ${actualBudget.maxMemoryGrowth} bytes`);
    }

    if (metrics.networkRequests && metrics.networkRequests.length > actualBudget.maxNetworkRequests) {
      violations.push(`Network requests exceeded: ${metrics.networkRequests.length} > ${actualBudget.maxNetworkRequests}`);
    }

    if (metrics.webVitals?.lcp && metrics.webVitals.lcp > actualBudget.webVitals.maxLCP) {
      violations.push(`LCP exceeded: ${metrics.webVitals.lcp}ms > ${actualBudget.webVitals.maxLCP}ms`);
    }

    if (metrics.webVitals?.fid && metrics.webVitals.fid > actualBudget.webVitals.maxFID) {
      violations.push(`FID exceeded: ${metrics.webVitals.fid}ms > ${actualBudget.webVitals.maxFID}ms`);
    }

    if (metrics.webVitals?.cls && metrics.webVitals.cls > actualBudget.webVitals.maxCLS) {
      violations.push(`CLS exceeded: ${metrics.webVitals.cls} > ${actualBudget.webVitals.maxCLS}`);
    }

    return {
      passed: violations.length === 0,
      violations,
      metrics,
      budget: actualBudget
    };
  }

  /**
   * Monitor continuously during test execution
   */
  async monitorContinuously(durationMs: number, sampleIntervalMs: number = 1000): Promise<ContinuousMetrics> {
    const samples: MemoryInfo[] = [];
    const startTime = Date.now();
    
    while (Date.now() - startTime < durationMs) {
      const memory = await this.getMemoryUsage();
      samples.push(memory);
      await new Promise(resolve => setTimeout(resolve, sampleIntervalMs));
    }

    return {
      duration: durationMs,
      sampleCount: samples.length,
      memoryUsage: {
        initial: samples[0]?.usedJSHeapSize || 0,
        final: samples[samples.length - 1]?.usedJSHeapSize || 0,
        peak: Math.max(...samples.map(s => s.usedJSHeapSize)),
        average: samples.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / samples.length
      },
      samples
    };
  }
}

/**
 * Performance budget interface
 */
export interface PerformanceBudget {
  maxPageLoadTime: number;
  maxHistoryLoadTime: number;
  maxMemoryGrowth: number;
  maxNetworkRequests: number;
  webVitals: {
    maxLCP: number;
    maxFID: number;
    maxCLS: number;
  };
}

/**
 * Performance validation result
 */
export interface PerformanceValidation {
  passed: boolean;
  violations: string[];
  metrics: PerformanceMetrics;
  budget: PerformanceBudget;
}

/**
 * Performance report interface
 */
export interface PerformanceReport {
  totalMeasurements: number;
  averageDuration: number;
  slowestOperation: PerformanceMetrics;
  fastestOperation: PerformanceMetrics;
  totalMemoryGrowth: number;
  totalNetworkRequests: number;
  measurements: Array<{
    name: string;
    duration: number;
    memoryGrowth: number;
    networkRequests: number;
    webVitals?: WebVitalsMetrics;
  }>;
}

/**
 * Continuous monitoring metrics
 */
export interface ContinuousMetrics {
  duration: number;
  sampleCount: number;
  memoryUsage: {
    initial: number;
    final: number;
    peak: number;
    average: number;
  };
  samples: MemoryInfo[];
}

/**
 * Performance test utilities
 */
export class PerformanceTestUtils {
  /**
   * Simulate slow network conditions
   */
  static async simulateSlowNetwork(page: Page, delayMs: number = 2000): Promise<void> {
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      route.continue();
    });
  }

  /**
   * Simulate memory pressure
   */
  static async simulateMemoryPressure(page: Page): Promise<void> {
    await page.addInitScript(() => {
      // Mock low memory conditions
      Object.defineProperty(navigator, 'deviceMemory', {
        writable: false,
        value: 1 // 1GB device memory (low-end device)
      });

      // Mock memory pressure
      (window as any).performance.memory = {
        usedJSHeapSize: 90 * 1024 * 1024, // 90MB used
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 120 * 1024 * 1024
      };
    });
  }

  /**
   * Generate performance test data
   */
  static generateLargeTestData(sizeKB: number = 100): any {
    const data = {
      id: 'performance-test',
      timestamp: new Date().toISOString(),
      largeText: 'x'.repeat(sizeKB * 1024), // Generate string of specified size
      arrayData: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
        data: 'test'.repeat(10)
      }))
    };
    
    return data;
  }

  /**
   * Measure function execution time
   */
  static async measureFunction<T>(
    fn: () => Promise<T> | T,
    name: string = 'function'
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    console.log(`⏱️  ${name} took ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  }

  /**
   * Assert performance budget
   */
  static assertPerformanceBudget(
    metrics: PerformanceMetrics,
    budget: Partial<PerformanceBudget> = {}
  ): void {
    const fullBudget = { ...E2EPerformanceMonitor.getPerformanceBudget(), ...budget };
    const monitor = new E2EPerformanceMonitor({} as Page); // Temporary instance for validation
    const validation = monitor.validatePerformance(metrics, fullBudget);
    
    if (!validation.passed) {
      throw new Error(`Performance budget violations:\n${validation.violations.join('\n')}`);
    }
    
    console.log(`✅ Performance budget passed for ${metrics.name}`);
  }

  /**
   * Create performance test summary
   */
  static createTestSummary(measurements: PerformanceMetrics[]): string {
    if (measurements.length === 0) {
      return 'No performance measurements recorded';
    }

    const totalDuration = measurements.reduce((sum, m) => sum + m.duration, 0);
    const avgDuration = totalDuration / measurements.length;
    const slowest = measurements.reduce((prev, current) => 
      prev.duration > current.duration ? prev : current
    );
    const fastest = measurements.reduce((prev, current) => 
      prev.duration < current.duration ? prev : current
    );

    return `
📊 Performance Test Summary
==========================
Total measurements: ${measurements.length}
Average duration: ${avgDuration.toFixed(2)}ms
Fastest operation: ${fastest.name} (${fastest.duration.toFixed(2)}ms)
Slowest operation: ${slowest.name} (${slowest.duration.toFixed(2)}ms)
Total memory growth: ${measurements.reduce((sum, m) => sum + (m.memory?.growth || 0), 0)} bytes
Total network requests: ${measurements.reduce((sum, m) => sum + (m.networkRequests?.length || 0), 0)}
`;
  }
}

/**
 * Performance test decorator for easy integration
 */
export function measurePerformance(budgetOverrides?: Partial<PerformanceBudget>) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const monitor = new E2EPerformanceMonitor(this.page);
      const operationName = `${target.constructor.name}.${propertyName}`;
      
      await monitor.startMeasurement(operationName);
      
      try {
        const result = await method.apply(this, args);
        const metrics = await monitor.endMeasurement(operationName);
        
        // Validate against budget if provided
        if (budgetOverrides) {
          PerformanceTestUtils.assertPerformanceBudget(metrics, budgetOverrides);
        }
        
        console.log(`📈 ${operationName}: ${metrics.duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        await monitor.endMeasurement(operationName);
        throw error;
      }
    };
  };
}