using System.Diagnostics;
using Xunit.Abstractions;

namespace Booking.Api.Tests.TestConfiguration;

/// <summary>
/// Quality Gates für Test-Performance und -Qualität
/// Stellt sicher, dass Tests Performance-Standards einhalten
/// </summary>
public static class TestQualityGates
{
    /// <summary>
    /// Performance-Thresholds für verschiedene Test-Arten
    /// </summary>
    public static class PerformanceThresholds
    {
        // Unit Tests sollten sehr schnell sein
        public const int UnitTestMaxMs = 100;
        
        // Query Handler Tests
        public const int QueryHandlerMaxMs = 500;
        
        // Integration Tests
        public const int IntegrationTestMaxMs = 5000;
        
        // API Endpoint Tests  
        public const int ApiEndpointMaxMs = 2000;
        
        // Database Tests
        public const int DatabaseTestMaxMs = 3000;
        
        // Memory Tests
        public const long MaxMemoryIncreaseBytes = 50 * 1024 * 1024; // 50MB
        
        // Concurrency Tests
        public const int ConcurrencyTestMaxMs = 10000;
    }

    /// <summary>
    /// Coverage-Thresholds
    /// </summary>
    public static class CoverageThresholds
    {
        public const double MinimumLineCoverage = 80.0;
        public const double MinimumBranchCoverage = 75.0;
        public const double TargetLineCoverage = 90.0;
        public const double TargetBranchCoverage = 85.0;
    }

    /// <summary>
    /// Test-Stabilität Requirements
    /// </summary>
    public static class StabilityRequirements
    {
        public const double MinSuccessRate = 0.95; // 95% Tests müssen erfolgreich sein
        public const int MaxFlakiness = 2; // Max 2% flaky tests
        public const int MaxRetries = 3;
    }
}

/// <summary>
/// Performance-Messung für Tests
/// </summary>
public class TestPerformanceMeasurement : IDisposable
{
    private readonly Stopwatch _stopwatch;
    private readonly string _testName;
    private readonly int _thresholdMs;
    private readonly ITestOutputHelper? _output;

    public TestPerformanceMeasurement(string testName, int thresholdMs, ITestOutputHelper? output = null)
    {
        _testName = testName;
        _thresholdMs = thresholdMs;
        _output = output;
        _stopwatch = Stopwatch.StartNew();
    }

    public void Dispose()
    {
        _stopwatch.Stop();
        var elapsedMs = _stopwatch.ElapsedMilliseconds;

        _output?.WriteLine($"Test '{_testName}' completed in {elapsedMs}ms (threshold: {_thresholdMs}ms)");

        if (elapsedMs > _thresholdMs)
        {
            var message = $"Test '{_testName}' exceeded performance threshold: {elapsedMs}ms > {_thresholdMs}ms";
            _output?.WriteLine($"⚠️  PERFORMANCE WARNING: {message}");
            
            // In CI/CD könnte hier ein Warning oder Failure ausgelöst werden
            #if DEBUG
            Debug.WriteLine($"Performance threshold exceeded: {message}");
            #endif
        }
        else
        {
            _output?.WriteLine($"✅ Performance OK: {_testName}");
        }
    }

    public long ElapsedMilliseconds => _stopwatch.ElapsedMilliseconds;
    public TimeSpan Elapsed => _stopwatch.Elapsed;
}

/// <summary>
/// Memory-Messung für Tests
/// </summary>
public class TestMemoryMeasurement : IDisposable
{
    private readonly long _initialMemory;
    private readonly string _testName;
    private readonly long _thresholdBytes;
    private readonly ITestOutputHelper? _output;

    public TestMemoryMeasurement(string testName, long thresholdBytes, ITestOutputHelper? output = null)
    {
        _testName = testName;
        _thresholdBytes = thresholdBytes;
        _output = output;
        
        // Force GC to get accurate baseline
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        
        _initialMemory = GC.GetTotalMemory(forceFullCollection: false);
    }

    public void Dispose()
    {
        var currentMemory = GC.GetTotalMemory(forceFullCollection: false);
        var memoryIncrease = currentMemory - _initialMemory;

        _output?.WriteLine($"Test '{_testName}' memory increase: {memoryIncrease / 1024 / 1024}MB (threshold: {_thresholdBytes / 1024 / 1024}MB)");

        if (memoryIncrease > _thresholdBytes)
        {
            var message = $"Test '{_testName}' exceeded memory threshold: {memoryIncrease / 1024 / 1024}MB > {_thresholdBytes / 1024 / 1024}MB";
            _output?.WriteLine($"⚠️  MEMORY WARNING: {message}");
            
            #if DEBUG
            Debug.WriteLine($"Memory threshold exceeded: {message}");
            #endif
        }
        else
        {
            _output?.WriteLine($"✅ Memory OK: {_testName}");
        }

        // Cleanup
        GC.Collect();
        GC.WaitForPendingFinalizers();
    }

    public long CurrentMemoryIncrease => GC.GetTotalMemory(false) - _initialMemory;
}

/// <summary>
/// Kombination aus Performance- und Memory-Messung
/// </summary>
public class TestQualityMeasurement : IDisposable
{
    private readonly TestPerformanceMeasurement _performance;
    private readonly TestMemoryMeasurement _memory;

    public TestQualityMeasurement(
        string testName, 
        int performanceThresholdMs, 
        long memoryThresholdBytes,
        ITestOutputHelper? output = null)
    {
        _performance = new TestPerformanceMeasurement(testName, performanceThresholdMs, output);
        _memory = new TestMemoryMeasurement(testName, memoryThresholdBytes, output);
    }

    public void Dispose()
    {
        _performance?.Dispose();
        _memory?.Dispose();
    }

    public long ElapsedMilliseconds => _performance.ElapsedMilliseconds;
    public long CurrentMemoryIncrease => _memory.CurrentMemoryIncrease;
}

/// <summary>
/// Extension Methods für einfache Verwendung in Tests
/// </summary>
public static class TestQualityExtensions
{
    public static TestPerformanceMeasurement MeasurePerformance(
        this ITestOutputHelper output, 
        string testName, 
        int thresholdMs)
    {
        return new TestPerformanceMeasurement(testName, thresholdMs, output);
    }

    public static TestMemoryMeasurement MeasureMemory(
        this ITestOutputHelper output, 
        string testName, 
        long thresholdBytes)
    {
        return new TestMemoryMeasurement(testName, thresholdBytes, output);
    }

    public static TestQualityMeasurement MeasureQuality(
        this ITestOutputHelper output, 
        string testName, 
        int performanceThresholdMs, 
        long memoryThresholdBytes)
    {
        return new TestQualityMeasurement(testName, performanceThresholdMs, memoryThresholdBytes, output);
    }
}

/// <summary>
/// Beispiel-Verwendung der Quality Gates
/// </summary>
public class ExampleQualityGateUsage
{
    private readonly ITestOutputHelper _output;

    public ExampleQualityGateUsage(ITestOutputHelper output)
    {
        _output = output;
    }

    /*
    [Fact]
    [Trait(TestTraits.Category.Name, TestCategories.Performance)]
    [Trait(TestTraits.Duration.Name, TestTraits.Duration.Fast)]
    public async Task ExampleTest_WithQualityGates()
    {
        // Verwende Quality Gates für Performance und Memory Monitoring
        using var qualityGate = _output.MeasureQuality(
            testName: nameof(ExampleTest_WithQualityGates),
            performanceThresholdMs: TestQualityGates.PerformanceThresholds.QueryHandlerMaxMs,
            memoryThresholdBytes: TestQualityGates.PerformanceThresholds.MaxMemoryIncreaseBytes
        );

        // Arrange
        // ... test setup

        // Act  
        // ... test execution

        // Assert
        // ... test verification
        
        // Quality Gates werden automatisch beim Dispose überprüft
    }
    */
}