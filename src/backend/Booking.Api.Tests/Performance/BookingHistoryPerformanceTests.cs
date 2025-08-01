using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using System.Diagnostics;
using Xunit.Abstractions;

namespace Booking.Api.Tests.Performance;

/// <summary>
/// Performance Tests für Historie-Funktionalität
/// Überprüft Performance-Charakteristiken unter verschiedenen Last-Szenarien
/// </summary>
public class BookingHistoryPerformanceTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly IEventSerializer _eventSerializer;
    private readonly GetBookingHistoryQueryHandler _handler;
    private readonly ITestOutputHelper _output;

    public BookingHistoryPerformanceTests(ITestOutputHelper output)
    {
        _output = output;
        
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new BookingDbContext(options);
        _eventSerializer = Substitute.For<IEventSerializer>();
        _handler = new GetBookingHistoryQueryHandler(_context, _eventSerializer);
        
        SetupEventSerializerMocks();
    }

    [Fact]
    public async Task GetBookingHistory_With1000Events_ShouldCompleteUnder500ms()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateLargeEventHistory(bookingId, eventCount: 1000);
        
        var query = new GetBookingHistoryQuery(bookingId);
        var stopwatch = Stopwatch.StartNew();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);
        
        // Assert
        stopwatch.Stop();
        var executionTime = stopwatch.ElapsedMilliseconds;
        
        _output.WriteLine($"Execution time for 1000 events: {executionTime}ms");
        
        Assert.True(executionTime < 500, 
            $"Query took {executionTime}ms, expected < 500ms for 1000 events");
        Assert.Equal(bookingId, result.BookingId);
        Assert.True(result.History.Count > 0);
    }

    [Theory]
    [InlineData(100, 100)]   // 100ms für 100 Events
    [InlineData(500, 250)]   // 250ms für 500 Events  
    [InlineData(2000, 800)]  // 800ms für 2000 Events
    public async Task GetBookingHistory_PerformanceScaling_MeetsThresholds(
        int eventCount, int maxExecutionTimeMs)
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateLargeEventHistory(bookingId, eventCount);
        
        var query = new GetBookingHistoryQuery(bookingId);
        var stopwatch = Stopwatch.StartNew();

        // Act
        await _handler.Handle(query, CancellationToken.None);
        
        // Assert
        stopwatch.Stop();
        var executionTime = stopwatch.ElapsedMilliseconds;
        
        _output.WriteLine($"Execution time for {eventCount} events: {executionTime}ms (threshold: {maxExecutionTimeMs}ms)");
        
        Assert.True(executionTime < maxExecutionTimeMs, 
            $"Query took {executionTime}ms, expected < {maxExecutionTimeMs}ms for {eventCount} events");
    }

    [Fact]
    public async Task GetBookingHistory_PaginationPerformance_ConsistentAcrossPages()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateLargeEventHistory(bookingId, eventCount: 1000);
        
        var executionTimes = new List<long>();
        
        // Act - Test multiple pages
        for (var page = 1; page <= 10; page++)
        {
            var query = new GetBookingHistoryQuery(bookingId, Page: page, PageSize: 20);
            var stopwatch = Stopwatch.StartNew();
            
            await _handler.Handle(query, CancellationToken.None);
            
            stopwatch.Stop();
            executionTimes.Add(stopwatch.ElapsedMilliseconds);
            
            _output.WriteLine($"Page {page}: {stopwatch.ElapsedMilliseconds}ms");
        }

        // Assert - Performance should be consistent across pages
        var averageTime = executionTimes.Average();
        var maxTime = executionTimes.Max();
        var minTime = executionTimes.Min();
        
        _output.WriteLine($"Performance consistency - Min: {minTime}ms, Max: {maxTime}ms, Avg: {averageTime:F2}ms");
        
        // Max time should not be more than 3x the min time (performance consistency)
        Assert.True(maxTime <= minTime * 3, 
            $"Performance inconsistency detected: Max {maxTime}ms vs Min {minTime}ms");
        
        // All pages should complete under 200ms
        Assert.True(maxTime < 200, 
            $"Pagination performance issue: Max time {maxTime}ms exceeded 200ms threshold");
    }

    [Fact]
    public async Task GetBookingHistory_MemoryUsage_StaysWithinBounds()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateLargeEventHistory(bookingId, eventCount: 5000);
        
        var initialMemory = GC.GetTotalMemory(forceFullCollection: true);
        
        // Act
        var query = new GetBookingHistoryQuery(bookingId);
        await _handler.Handle(query, CancellationToken.None);
        
        var peakMemory = GC.GetTotalMemory(forceFullCollection: false);
        GC.Collect();
        GC.WaitForPendingFinalizers();
        var finalMemory = GC.GetTotalMemory(forceFullCollection: true);
        
        // Assert
        var memoryIncrease = peakMemory - initialMemory;
        var memoryLeaked = finalMemory - initialMemory;
        
        _output.WriteLine($"Memory usage - Initial: {initialMemory / 1024 / 1024}MB, " +
                         $"Peak: {peakMemory / 1024 / 1024}MB, " +
                         $"Final: {finalMemory / 1024 / 1024}MB");
        
        // Memory increase should be reasonable (< 50MB for 5000 events)
        Assert.True(memoryIncrease < 50 * 1024 * 1024, 
            $"Memory usage too high: {memoryIncrease / 1024 / 1024}MB increase");
        
        // Should not leak significant memory (< 5MB)
        Assert.True(memoryLeaked < 5 * 1024 * 1024, 
            $"Memory leak detected: {memoryLeaked / 1024 / 1024}MB not released");
    }

    [Fact]
    public async Task GetBookingHistory_ConcurrentAccess_MaintainsPerformance()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateLargeEventHistory(bookingId, eventCount: 500);
        
        const int concurrentRequests = 10;
        var tasks = new List<Task<(long ExecutionTime, bool Success)>>();
        
        // Act - Simulate concurrent requests
        for (var i = 0; i < concurrentRequests; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                try
                {
                    var query = new GetBookingHistoryQuery(bookingId);
                    var stopwatch = Stopwatch.StartNew();
                    
                    await _handler.Handle(query, CancellationToken.None);
                    
                    stopwatch.Stop();
                    return (stopwatch.ElapsedMilliseconds, Success: true);
                }
                catch
                {
                    return (0L, Success: false);
                }
            }));
        }
        
        var results = await Task.WhenAll(tasks);
        
        // Assert
        var successfulRequests = results.Where(r => r.Success).ToList();
        var averageTime = successfulRequests.Average(r => r.ExecutionTime);
        var maxTime = successfulRequests.Max(r => r.ExecutionTime);
        
        _output.WriteLine($"Concurrent access - Successful: {successfulRequests.Count}/{concurrentRequests}, " +
                         $"Avg time: {averageTime:F2}ms, Max time: {maxTime}ms");
        
        Assert.Equal(concurrentRequests, successfulRequests.Count);
        Assert.True(maxTime < 1000, $"Concurrent access performance degraded: {maxTime}ms > 1000ms");
        Assert.True(averageTime < 500, $"Average concurrent performance poor: {averageTime:F2}ms > 500ms");
    }

    private async Task CreateLargeEventHistory(Guid bookingId, int eventCount)
    {
        var events = new List<EventStoreEvent>();
        var eventTypes = new[] { "BookingCreated", "BookingUpdated", "BookingConfirmed", "BookingCancelled" };
        
        for (var i = 1; i <= eventCount; i++)
        {
            events.Add(new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = eventTypes[i % eventTypes.Length],
                EventData = $"{{\"BookingId\":\"{bookingId}\",\"Version\":{i}}}",
                Version = i,
                Timestamp = DateTime.UtcNow.AddMinutes(-eventCount + i)
            });
        }
        
        _context.EventStoreEvents.AddRange(events);
        await _context.SaveChangesAsync();
    }

    private void SetupEventSerializerMocks()
    {
        var mockEvent = new BookingCreatedEvent 
        { 
            BookingId = Guid.NewGuid(),
            Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
            BookingItems = []
        };
        
        _eventSerializer.DeserializeEvent(Arg.Any<string>(), Arg.Any<string>())
            .Returns(mockEvent);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}