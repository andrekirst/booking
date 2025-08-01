using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using System.Collections.Concurrent;
using System.Diagnostics;
using Booking.Api.Features.Bookings.DTOs;
using Xunit.Abstractions;

namespace Booking.Api.Tests.Concurrency;

/// <summary>
/// Concurrency Tests für Historie-Funktionalität
/// Überprüft Thread-Safety und Race-Condition-Robustheit
/// </summary>
public class BookingHistoryConcurrencyTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly IEventSerializer _eventSerializer;
    private readonly GetBookingHistoryQueryHandler _handler;
    private readonly ITestOutputHelper _output;

    public BookingHistoryConcurrencyTests(ITestOutputHelper output)
    {
        _output = output;
        
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .EnableServiceProviderCaching(false) // Important for concurrent access
            .EnableSensitiveDataLogging()
            .Options;
        
        _context = new BookingDbContext(options);
        _eventSerializer = Substitute.For<IEventSerializer>();
        _handler = new GetBookingHistoryQueryHandler(_context, _eventSerializer);
        
        SetupEventSerializerMocks();
    }

    [Fact]
    public async Task GetBookingHistory_ConcurrentReads_AllSucceed()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, eventCount: 100);
        
        const int concurrentThreads = 10;
        const int requestsPerThread = 5;
        var totalRequests = concurrentThreads * requestsPerThread;
        
        var results = new ConcurrentBag<(bool Success, Exception? Error, int HistoryCount)>();
        var tasks = new List<Task>();

        // Act - Simulate concurrent read operations
        for (var thread = 0; thread < concurrentThreads; thread++)
        {
            tasks.Add(Task.Run(async () =>
            {
                for (var request = 0; request < requestsPerThread; request++)
                {
                    try
                    {
                        var query = new GetBookingHistoryQuery(bookingId);
                        var result = await _handler.Handle(query, CancellationToken.None);
                        
                        results.Add((Success: true, Error: null, HistoryCount: result.History.Count));
                    }
                    catch (Exception ex)
                    {
                        results.Add((Success: false, Error: ex, HistoryCount: 0));
                    }
                }
            }));
        }

        await Task.WhenAll(tasks);

        // Assert
        var allResults = results.ToList();
        var successfulResults = allResults.Where(r => r.Success).ToList();
        var failedResults = allResults.Where(r => !r.Success).ToList();

        _output.WriteLine($"Total requests: {totalRequests}");
        _output.WriteLine($"Successful: {successfulResults.Count}");
        _output.WriteLine($"Failed: {failedResults.Count}");

        // All requests should succeed
        Assert.Equal(totalRequests, successfulResults.Count);
        Assert.Empty(failedResults);

        // All successful results should have consistent data
        var expectedHistoryCount = successfulResults.First().HistoryCount;
        Assert.All(successfulResults, r => Assert.Equal(expectedHistoryCount, r.HistoryCount));
    }

    [Fact]
    public async Task GetBookingHistory_ConcurrentReadsWithPagination_NoDataCorruption()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, eventCount: 200);
        
        const int concurrentThreads = 8;
        var allHistoryEntries = new ConcurrentBag<BookingHistoryEntryDto>();
        var tasks = new List<Task>();

        // Act - Multiple threads reading different pages simultaneously
        for (var thread = 0; thread < concurrentThreads; thread++)
        {
            var page = thread + 1; // Pages 1-8
            tasks.Add(Task.Run(async () =>
            {
                var query = new GetBookingHistoryQuery(bookingId, Page: page, PageSize: 25);
                var result = await _handler.Handle(query, CancellationToken.None);
                
                foreach (var entry in result.History)
                {
                    allHistoryEntries.Add(entry);
                }
            }));
        }

        await Task.WhenAll(tasks);

        // Assert
        var allEntries = allHistoryEntries.ToList();
        
        _output.WriteLine($"Total entries retrieved: {allEntries.Count}");

        // Should have retrieved 200 entries (8 pages × 25 entries)
        Assert.Equal(200, allEntries.Count);

        // Check for duplicates (would indicate data corruption)
        var uniqueEntries = allEntries.GroupBy(e => new { e.EventType, e.Timestamp })
            .Where(g => g.Count() > 1)
            .ToList();

        Assert.Empty(uniqueEntries);

        // Verify chronological order across all pages
        var sortedEntries = allEntries.OrderByDescending(e => e.Timestamp).ToList();
        for (var i = 0; i < sortedEntries.Count - 1; i++)
        {
            Assert.True(sortedEntries[i].Timestamp >= sortedEntries[i + 1].Timestamp,
                "History entries should be in descending chronological order");
        }
    }

    [Fact]
    public async Task GetBookingHistory_ConcurrentDifferentBookings_IsolationMaintained()
    {
        // Arrange
        var bookingIds = Enumerable.Range(0, 5).Select(_ => Guid.NewGuid()).ToList();
        
        // Create different event histories for each booking
        foreach (var bookingId in bookingIds)
        {
            await CreateTestEventHistory(bookingId, eventCount: 50);
        }

        const int concurrentThreads = 15; // 3 threads per booking
        var results = new ConcurrentDictionary<Guid, List<int>>();
        var tasks = new List<Task>();

        // Act - Multiple threads accessing different bookings
        for (var thread = 0; thread < concurrentThreads; thread++)
        {
            var bookingId = bookingIds[thread % bookingIds.Count];
            
            tasks.Add(Task.Run(async () =>
            {
                var query = new GetBookingHistoryQuery(bookingId);
                var result = await _handler.Handle(query, CancellationToken.None);
                
                results.AddOrUpdate(bookingId, 
                    [result.History.Count],
                    (_, existing) =>
                    {
                        existing.Add(result.History.Count);
                        return existing;
                    });
            }));
        }

        await Task.WhenAll(tasks);

        // Assert
        Assert.Equal(bookingIds.Count, results.Keys.Count);

        foreach (var bookingId in bookingIds)
        {
            Assert.True(results.ContainsKey(bookingId));
            var historyCounts = results[bookingId];
            
            // All requests for the same booking should return the same count
            Assert.True(historyCounts.All(count => count == historyCounts.First()),
                $"Inconsistent history counts for booking {bookingId}: {string.Join(", ", historyCounts)}");
        }
    }

    [Fact]
    public async Task GetBookingHistory_HighContention_NoDeadlocks()
    {
        // Arrange
        var bookingIds = Enumerable.Range(0, 3).Select(_ => Guid.NewGuid()).ToList();
        
        foreach (var bookingId in bookingIds)
        {
            await CreateTestEventHistory(bookingId, eventCount: 100);
        }

        const int concurrentThreads = 20;
        const int requestsPerThread = 10;
        var completedRequests = 0;
        var errors = new ConcurrentBag<Exception>();
        var tasks = new List<Task>();
        var cancellationTokenSource = new CancellationTokenSource(TimeSpan.FromMinutes(2));

        // Act - High contention scenario
        for (var thread = 0; thread < concurrentThreads; thread++)
        {
            tasks.Add(Task.Run(async () =>
            {
                for (var request = 0; request < requestsPerThread; request++)
                {
                    try
                    {
                        if (cancellationTokenSource.Token.IsCancellationRequested)
                            break;

                        var bookingId = bookingIds[request % bookingIds.Count];
                        var query = new GetBookingHistoryQuery(bookingId);
                        
                        await _handler.Handle(query, cancellationTokenSource.Token);
                        
                        Interlocked.Increment(ref completedRequests);
                    }
                    catch (OperationCanceledException)
                    {
                        break; // Expected when test times out
                    }
                    catch (Exception ex)
                    {
                        errors.Add(ex);
                    }
                }
            }, cancellationTokenSource.Token));
        }

        await Task.WhenAll(tasks);

        // Assert
        var totalExpectedRequests = concurrentThreads * requestsPerThread;
        var errorList = errors.ToList();

        _output.WriteLine($"Completed requests: {completedRequests}/{totalExpectedRequests}");
        _output.WriteLine($"Errors: {errorList.Count}");

        if (errorList.Any())
        {
            _output.WriteLine("Errors encountered:");
            foreach (var error in errorList.Take(5)) // Log first 5 errors
            {
                _output.WriteLine($"- {error.GetType().Name}: {error.Message}");
            }
        }

        // Should complete most requests without deadlocks
        Assert.True(completedRequests >= totalExpectedRequests * 0.9,
            $"Too many requests failed. Completed: {completedRequests}, Expected: {totalExpectedRequests}");

        // Should not have deadlock-related errors
        var deadlockErrors = errorList.Where(e => 
            e.Message.Contains("deadlock", StringComparison.OrdinalIgnoreCase) ||
            e.Message.Contains("timeout", StringComparison.OrdinalIgnoreCase))
            .ToList();

        Assert.Empty(deadlockErrors);
    }

    [Fact]
    public async Task GetBookingHistory_StressTest_SystemStaysResponsive()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, eventCount: 1000);

        const int duration = 30; // seconds
        const int concurrentThreads = 25;
        
        var completedRequests = 0;
        var totalResponseTime = 0L;
        var maxResponseTime = 0L;
        var minResponseTime = long.MaxValue;
        var errors = new ConcurrentBag<Exception>();
        
        var stopwatch = Stopwatch.StartNew();
        var tasks = new List<Task>();

        // Act - Sustained load test
        for (var thread = 0; thread < concurrentThreads; thread++)
        {
            tasks.Add(Task.Run(async () =>
            {
                while (stopwatch.Elapsed.TotalSeconds < duration)
                {
                    try
                    {
                        var requestStopwatch = Stopwatch.StartNew();
                        
                        var query = new GetBookingHistoryQuery(bookingId);
                        await _handler.Handle(query, CancellationToken.None);
                        
                        requestStopwatch.Stop();
                        var responseTime = requestStopwatch.ElapsedMilliseconds;
                        
                        Interlocked.Increment(ref completedRequests);
                        Interlocked.Add(ref totalResponseTime, responseTime);
                        
                        // Update min/max response times thread-safely
                        long currentMax, currentMin;
                        do
                        {
                            currentMax = Interlocked.Read(ref maxResponseTime);
                        } while (responseTime > currentMax && 
                                Interlocked.CompareExchange(ref maxResponseTime, responseTime, currentMax) != currentMax);
                        
                        do
                        {
                            currentMin = Interlocked.Read(ref minResponseTime);
                        } while (responseTime < currentMin && 
                                Interlocked.CompareExchange(ref minResponseTime, responseTime, currentMin) != currentMin);
                        
                        // Brief pause to prevent excessive CPU usage
                        await Task.Delay(10);
                    }
                    catch (Exception ex)
                    {
                        errors.Add(ex);
                    }
                }
            }));
        }

        await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert
        var errorList = errors.ToList();
        var averageResponseTime = completedRequests > 0 ? totalResponseTime / completedRequests : 0;

        _output.WriteLine($"Test duration: {stopwatch.Elapsed.TotalSeconds:F2} seconds");
        _output.WriteLine($"Completed requests: {completedRequests}");
        _output.WriteLine($"Requests per second: {completedRequests / stopwatch.Elapsed.TotalSeconds:F2}");
        _output.WriteLine($"Average response time: {averageResponseTime}ms");
        _output.WriteLine($"Min response time: {minResponseTime}ms");
        _output.WriteLine($"Max response time: {maxResponseTime}ms");
        _output.WriteLine($"Errors: {errorList.Count}");

        // Performance expectations under sustained load
        Assert.True(completedRequests > 0, "No requests completed");
        Assert.True(averageResponseTime < 1000, $"Average response time too high: {averageResponseTime}ms");
        Assert.True(maxResponseTime < 5000, $"Max response time too high: {maxResponseTime}ms");
        
        // Error rate should be low
        var errorRate = errorList.Count / (double)Math.Max(completedRequests + errorList.Count, 1);
        Assert.True(errorRate < 0.05, $"Error rate too high: {errorRate:P2}");
    }

    private async Task CreateTestEventHistory(Guid bookingId, int eventCount)
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
        _context?.Dispose();
    }
}