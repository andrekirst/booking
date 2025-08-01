# Performance Testing Verbesserungsvorschläge

## 1. Advanced Load Testing Suite

### k6 Load Testing Implementation
```javascript
// tests/performance/booking-history-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom Performance Metrics
export let errorRate = new Rate('booking_history_errors');
export let historyLoadTime = new Trend('booking_history_load_time');
export let concurrentUserHandling = new Trend('concurrent_user_response');

export let options = {
  stages: [
    { duration: '2m', target: 10 },    // Warm up
    { duration: '5m', target: 50 },    // Normal load
    { duration: '10m', target: 100 },  // Peak hours simulation
    { duration: '5m', target: 200 },   // Stress test
    { duration: '3m', target: 0 },     // Cool down
  ],
  thresholds: {
    // Performance Budgets
    'http_req_duration': ['p(95)<1500', 'p(99)<3000'],
    'http_req_failed': ['rate<0.01'],
    'booking_history_load_time': ['p(95)<1000'],
    'concurrent_user_response': ['p(90)<2000'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:60402';

export function setup() {
  // Authenticate test users
  let authResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'load-test@family.com',
    password: 'LoadTest123!'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  let authToken = authResponse.json('token');
  return { authToken };
}

export default function(data) {
  let headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json',
  };

  // Test Booking History Load Performance
  let historyStart = Date.now();
  
  let historyResponse = http.get(`${BASE_URL}/api/bookings/history`, { 
    headers,
    params: {
      page: Math.floor(Math.random() * 10) + 1,
      pageSize: 20,
      sortBy: 'startDate',
      sortDirection: 'desc'
    }
  });
  
  let historyLoadSuccess = check(historyResponse, {
    'history loaded successfully': (r) => r.status === 200,
    'history contains data': (r) => r.json('items').length > 0,
    'response time acceptable': (r) => r.timings.duration < 2000,
  });

  if (historyLoadSuccess) {
    historyLoadTime.add(Date.now() - historyStart);
  } else {
    errorRate.add(1);
  }

  // Test Concurrent User Scenario
  let concurrentStart = Date.now();
  
  let promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      http.asyncRequest('GET', `${BASE_URL}/api/bookings/history`, null, { headers })
    );
  }
  
  let responses = http.batch(promises);
  let allSuccessful = responses.every(r => r.status === 200);
  
  if (allSuccessful) {
    concurrentUserHandling.add(Date.now() - concurrentStart);
  }

  sleep(Math.random() * 2 + 1); // 1-3 seconds between requests
}

export function teardown(data) {
  console.log('Load test completed - Performance metrics collected');
}
```

### Database Load Testing
```csharp
// Tests/Performance/DatabaseLoadTests.cs
public class DatabaseLoadTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;
    private readonly IServiceProvider _serviceProvider;

    public DatabaseLoadTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _serviceProvider = CreateServiceProvider();
    }

    [Fact]
    public async Task BookingHistory_DatabaseLoad_Should_HandleHighConcurrency()
    {
        // Simulate 50 concurrent database connections
        var tasks = new List<Task>();
        var stopwatch = Stopwatch.StartNew();
        
        for (int i = 0; i < 50; i++)
        {
            tasks.Add(SimulateUserHistoryQuery());
        }
        
        await Task.WhenAll(tasks);
        stopwatch.Stop();
        
        // Performance Assertions
        Assert.True(stopwatch.ElapsedMilliseconds < 5000, "Concurrent load should complete within 5 seconds");
        
        // Database Connection Pool Validation
        var connectionPoolSize = GetActiveConnectionCount();
        Assert.True(connectionPoolSize < 20, "Connection pool should not exceed 20 connections");
    }

    [Theory]
    [InlineData(1000)]   // 1K bookings
    [InlineData(5000)]   // 5K bookings
    [InlineData(10000)]  // 10K bookings
    public async Task BookingHistory_LargeDataSet_Should_MaintainPerformance(int bookingCount)
    {
        // Setup large dataset
        await SeedBookingHistory(bookingCount);
        
        var stopwatch = Stopwatch.StartNew();
        
        using var scope = _serviceProvider.CreateScope();
        var historyService = scope.ServiceProvider.GetRequiredService<IBookingHistoryService>();
        
        var result = await historyService.GetHistoryAsync(new GetHistoryQuery
        {
            UserId = TestUsers.FamilyMember1.Id,
            PageNumber = 1,
            PageSize = 20
        });
        
        stopwatch.Stop();
        
        // Performance Budgets based on dataset size
        var expectedMaxTime = bookingCount switch
        {
            <= 1000 => 200,   // 200ms for 1K records
            <= 5000 => 500,   // 500ms for 5K records
            <= 10000 => 1000, // 1s for 10K records
            _ => 2000
        };
        
        Assert.True(stopwatch.ElapsedMilliseconds < expectedMaxTime, 
            $"Query should complete within {expectedMaxTime}ms for {bookingCount} records");
        Assert.True(result.Items.Count == 20, "Should return exactly 20 items per page");
    }

    [Fact]
    public async Task BookingHistory_QueryPlan_Should_UseIndexes()
    {
        using var connection = _fixture.CreateConnection();
        await connection.OpenAsync();
        
        // Enable query plan analysis
        await connection.ExecuteAsync("SET auto_explain.log_min_duration = 0");
        await connection.ExecuteAsync("SET auto_explain.log_analyze = true");
        
        // Execute booking history query
        var query = @"
            SELECT b.id, b.start_date, b.end_date, b.guest_count, b.status
            FROM booking_read_models b
            WHERE b.user_id = @userId
            ORDER BY b.start_date DESC
            LIMIT 20 OFFSET 0";
            
        var stopwatch = Stopwatch.StartNew();
        var results = await connection.QueryAsync(query, new { userId = TestUsers.FamilyMember1.Id });
        stopwatch.Stop();
        
        // Performance Assertions
        Assert.True(stopwatch.ElapsedMilliseconds < 50, "Indexed query should complete within 50ms");
        Assert.True(results.Count() <= 20, "Should respect LIMIT clause");
        
        // Query Plan Validation (requires PostgreSQL log analysis)
        var queryPlan = await GetQueryExecutionPlan(query);
        Assert.Contains("Index Scan", queryPlan, "Query should use index scan, not sequential scan");
    }
}
```

## 2. Real User Monitoring (RUM) Implementation

### Production Performance Monitoring
```typescript
// utils/real-user-monitoring.ts
class RealUserMonitoring {
  private performanceObserver: PerformanceObserver | null = null;
  private metricsBuffer: PerformanceMetric[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor(private config: RUMConfig) {
    this.setupPerformanceObserver();
    this.setupPeriodicFlush();
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    // Observe all performance entry types
    this.performanceObserver.observe({ 
      entryTypes: ['navigation', 'resource', 'measure', 'paint', 'layout-shift'] 
    });
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    const metric: PerformanceMetric = {
      name: entry.name,
      type: entry.entryType,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
    };

    // Add specific metrics based on entry type
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      metric.additionalData = {
        domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
        loadComplete: navEntry.loadEventEnd - navEntry.navigationStart,
        firstByte: navEntry.responseStart - navEntry.requestStart,
        dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
      };
    }

    if (entry.entryType === 'layout-shift') {
      const layoutShiftEntry = entry as any; // CLS not fully typed yet
      metric.additionalData = {
        value: layoutShiftEntry.value,
        hadRecentInput: layoutShiftEntry.hadRecentInput,
      };
    }

    this.metricsBuffer.push(metric);

    // Check critical performance thresholds
    this.checkPerformanceThresholds(metric);

    // Flush buffer if full
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }
  }

  private checkPerformanceThresholds(metric: PerformanceMetric) {
    const thresholds = {
      pageLoad: 3000,     // 3 seconds
      historyLoad: 2000,  // 2 seconds  
      apiCall: 1000,      // 1 second
      cls: 0.1,           // Cumulative Layout Shift
    };

    // Alert on threshold violations
    if (metric.type === 'navigation' && metric.duration > thresholds.pageLoad) {
      this.reportPerformanceIssue('SLOW_PAGE_LOAD', metric);
    }

    if (metric.name.includes('booking-history') && metric.duration > thresholds.historyLoad) {
      this.reportPerformanceIssue('SLOW_HISTORY_LOAD', metric);
    }

    if (metric.type === 'layout-shift' && metric.additionalData?.value > thresholds.cls) {
      this.reportPerformanceIssue('HIGH_CLS', metric);
    }
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Send to analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          sessionId: this.getSessionId(),
          userId: this.getUserId(),
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      // Re-add to buffer for retry
      this.metricsBuffer.unshift(...metrics);
    }
  }

  private reportPerformanceIssue(type: string, metric: PerformanceMetric) {
    // Send immediate alert for critical performance issues
    fetch('/api/alerts/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        metric,
        severity: this.calculateSeverity(type, metric),
        timestamp: Date.now(),
        userContext: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId(),
        },
      }),
    }).catch(console.error);
  }

  public measureBookingHistoryPerformance(): Promise<PerformanceMeasurement> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const startMark = 'booking-history-start';
      const endMark = 'booking-history-end';
      
      performance.mark(startMark);
      
      // Return measurement function
      const endMeasurement = () => {
        performance.mark(endMark);
        performance.measure('booking-history-load', startMark, endMark);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const measurement: PerformanceMeasurement = {
          duration,
          startTime,
          endTime,
          memoryUsage: this.getMemoryUsage(),
          networkRequests: this.getNetworkRequestCount(),
        };
        
        resolve(measurement);
      };
      
      resolve({ endMeasurement } as any);
    });
  }

  private getMemoryUsage(): MemoryInfo | null {
    return (performance as any).memory || null;
  }

  private getNetworkRequestCount(): number {
    const resources = performance.getEntriesByType('resource');
    return resources.filter(r => r.startTime > this.lastFlushTime).length;
  }
}

// Usage in booking history component
export const useBookingHistoryPerformance = () => {
  const rumRef = useRef<RealUserMonitoring>();

  useEffect(() => {
    rumRef.current = new RealUserMonitoring({
      endpoint: '/api/analytics/performance',
      batchSize: 10,
      flushInterval: 30000,
    });

    return () => {
      rumRef.current?.destroy();
    };
  }, []);

  const measureHistoryLoad = useCallback(async () => {
    const measurement = await rumRef.current?.measureBookingHistoryPerformance();
    return measurement;
  }, []);

  return { measureHistoryLoad };
};
```

## 3. Performance Regression Detection

### Automated Performance Baseline Tracking
```typescript
// tests/performance/performance-baseline.ts
interface PerformanceBaseline {
  testName: string;
  baselineValue: number;
  threshold: number;
  unit: string;
  timestamp: number;
  gitCommit: string;
  environment: string;
}

class PerformanceRegressionDetector {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private readonly REGRESSION_THRESHOLD = 0.2; // 20% regression threshold

  async loadBaselines(): Promise<void> {
    try {
      const response = await fetch('/api/performance/baselines');
      const baselines = await response.json();
      
      baselines.forEach((baseline: PerformanceBaseline) => {
        this.baselines.set(baseline.testName, baseline);
      });
    } catch (error) {
      console.warn('Could not load performance baselines:', error);
    }
  }

  async checkRegression(testName: string, currentValue: number): Promise<RegressionResult> {
    const baseline = this.baselines.get(testName);
    
    if (!baseline) {
      // No baseline exists, establish new one
      await this.establishBaseline(testName, currentValue);
      return { 
        hasRegression: false, 
        message: 'Baseline established',
        improvement: null 
      };
    }

    const percentageChange = (currentValue - baseline.baselineValue) / baseline.baselineValue;
    const hasRegression = percentageChange > this.REGRESSION_THRESHOLD;
    const hasImprovement = percentageChange < -0.1; // 10% improvement

    if (hasRegression) {
      await this.reportRegression(testName, baseline, currentValue, percentageChange);
    }

    if (hasImprovement) {
      await this.updateBaseline(testName, currentValue);
    }

    return {
      hasRegression,
      hasImprovement,
      percentageChange,
      baseline: baseline.baselineValue,
      current: currentValue,
      message: this.formatRegressionMessage(percentageChange, baseline.unit),
    };
  }

  private async establishBaseline(testName: string, value: number): Promise<void> {
    const baseline: PerformanceBaseline = {
      testName,
      baselineValue: value,
      threshold: this.REGRESSION_THRESHOLD,
      unit: 'ms',
      timestamp: Date.now(),
      gitCommit: process.env.GITHUB_SHA || 'unknown',
      environment: process.env.NODE_ENV || 'test',
    };

    this.baselines.set(testName, baseline);
    
    await fetch('/api/performance/baselines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseline),
    }).catch(console.error);
  }

  private async reportRegression(
    testName: string, 
    baseline: PerformanceBaseline, 
    currentValue: number, 
    percentageChange: number
  ): Promise<void> {
    const regression = {
      testName,
      baseline: baseline.baselineValue,
      current: currentValue,
      percentageChange,
      gitCommit: process.env.GITHUB_SHA,
      timestamp: Date.now(),
      severity: percentageChange > 0.5 ? 'high' : 'medium',
    };

    // Send to monitoring system
    await fetch('/api/alerts/performance-regression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regression),
    }).catch(console.error);

    // Create GitHub issue for significant regressions
    if (percentageChange > 0.3) { // 30% regression
      await this.createRegressionIssue(regression);
    }
  }
}

// Playwright integration
export const checkPerformanceRegression = async (testName: string, duration: number) => {
  const detector = new PerformanceRegressionDetector();
  await detector.loadBaselines();
  
  const result = await detector.checkRegression(testName, duration);
  
  if (result.hasRegression) {
    throw new Error(`Performance regression detected: ${result.message}`);
  }
  
  if (result.hasImprovement) {
    console.log(`🚀 Performance improvement: ${result.message}`);
  }
  
  return result;
};
```

## 4. Advanced Performance Budgets

### Comprehensive Performance Budget Configuration
```typescript
// config/performance-budgets.ts
interface PerformanceBudget {
  name: string;
  metrics: {
    [key: string]: {
      budget: number;
      unit: string;
      severity: 'error' | 'warning' | 'info';
    };
  };
  environment: 'development' | 'staging' | 'production';
}

export const performanceBudgets: PerformanceBudget[] = [
  {
    name: 'booking-history-page',
    environment: 'production',
    metrics: {
      'initial-load': { budget: 3000, unit: 'ms', severity: 'error' },
      'history-fetch': { budget: 1500, unit: 'ms', severity: 'error' },
      'lcp': { budget: 2500, unit: 'ms', severity: 'error' },
      'fid': { budget: 100, unit: 'ms', severity: 'warning' },
      'cls': { budget: 0.1, unit: 'score', severity: 'warning' },
      'memory-usage': { budget: 50, unit: 'MB', severity: 'warning' },
      'bundle-size': { budget: 500, unit: 'KB', severity: 'error' },
    },
  },
  {
    name: 'api-endpoints',
    environment: 'production',
    metrics: {
      'booking-history-endpoint': { budget: 800, unit: 'ms', severity: 'error' },
      'concurrent-requests': { budget: 1200, unit: 'ms', severity: 'error' },
      'database-query': { budget: 200, unit: 'ms', severity: 'warning' },
      'memory-per-request': { budget: 10, unit: 'MB', severity: 'warning' },
    },
  },
  {
    name: 'infrastructure',
    environment: 'production',
    metrics: {
      'docker-startup': { budget: 45000, unit: 'ms', severity: 'warning' },
      'container-memory': { budget: 1024, unit: 'MB', severity: 'error' },
      'build-time': { budget: 300, unit: 's', severity: 'warning' },
    },
  },
];

// Performance Budget Validator
class PerformanceBudgetValidator {
  constructor(private budgets: PerformanceBudget[]) {}

  validateMetric(budgetName: string, metricName: string, value: number, environment: string): ValidationResult {
    const budget = this.budgets.find(b => b.name === budgetName && b.environment === environment);
    
    if (!budget) {
      return { passed: true, message: 'No budget defined for this metric' };
    }

    const metric = budget.metrics[metricName];
    if (!metric) {
      return { passed: true, message: 'Metric not in budget' };
    }

    const passed = value <= metric.budget;
    const percentageUsed = (value / metric.budget) * 100;

    return {
      passed,
      severity: metric.severity,
      message: passed 
        ? `✅ ${metricName}: ${value}${metric.unit} (${percentageUsed.toFixed(1)}% of budget)`
        : `❌ ${metricName}: ${value}${metric.unit} exceeds budget of ${metric.budget}${metric.unit} (${percentageUsed.toFixed(1)}%)`,
      value,
      budget: metric.budget,
      percentageUsed,
    };
  }

  generateBudgetReport(results: ValidationResult[]): BudgetReport {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const errors = results.filter(r => !r.passed && r.severity === 'error').length;
    const warnings = results.filter(r => !r.passed && r.severity === 'warning').length;

    return {
      totalTests: results.length,
      passed,
      failed,
      errors,
      warnings,
      passRate: (passed / results.length) * 100,
      results,
      summary: `${passed}/${results.length} performance budgets passed (${errors} errors, ${warnings} warnings)`,
    };
  }
}
```

Diese umfassenden Verbesserungen würden die bereits exzellente Performance-Test-Infrastruktur auf ein noch höheres enterprise-level anheben mit:

1. **Advanced Load Testing** mit k6 für realistic Traffic-Simulation
2. **Real User Monitoring** für Production Performance Insights  
3. **Performance Regression Detection** mit automatischen Baselines
4. **Comprehensive Performance Budgets** mit detailliertem Reporting

Die Implementierung würde das System zur Referenz für moderne Performance Testing machen.