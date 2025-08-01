using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit.Abstractions;

namespace Booking.Api.Tests.Memory;

/// <summary>
/// Memory Management Tests für Historie-Funktionalität
/// Überprüft Memory-Leaks, Resource-Management und GC-Verhalten
/// </summary>
public class BookingHistoryMemoryTests : IDisposable
{
    private readonly ITestOutputHelper _output;
    private BookingDbContext _context;
    private IEventSerializer _eventSerializer;
    private GetBookingHistoryQueryHandler _handler;

    public BookingHistoryMemoryTests(ITestOutputHelper output)
    {
        _output = output;
        InitializeHandler();
    }

    private void InitializeHandler()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new BookingDbContext(options);
        _eventSerializer = Substitute.For<IEventSerializer>();
        _handler = new GetBookingHistoryQueryHandler(_context, _eventSerializer);
        
        SetupEventSerializerMocks();
    }

    [Fact]
    public async Task GetBookingHistory_RepeatedCalls_NoMemoryLeak()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, eventCount: 500);
        
        const int iterations = 100;
        var initialMemory = GC.GetTotalMemory(forceFullCollection: true);
        
        _output.WriteLine($"Initial memory: {initialMemory / 1024 / 1024}MB");

        // Act - Repeated calls to potentially detect memory leaks
        for (var i = 0; i < iterations; i++)
        {
            var query = new GetBookingHistoryQuery(bookingId);
            var result = await _handler.Handle(query, CancellationToken.None);
            
            // Verify result to ensure work is actually done
            Assert.True(result.History.Count > 0);
            
            // Force GC every 20 iterations to prevent false positives
            if (i % 20 == 0)
            {
                GC.Collect();
                GC.WaitForPendingFinalizers();
                GC.Collect();
            }
        }

        // Final cleanup
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        
        var finalMemory = GC.GetTotalMemory(forceFullCollection: true);
        var memoryIncrease = finalMemory - initialMemory;

        _output.WriteLine($"Final memory: {finalMemory / 1024 / 1024}MB");
        _output.WriteLine($"Memory increase: {memoryIncrease / 1024 / 1024}MB");

        // Assert - Memory increase should be minimal (< 10MB)
        Assert.True(memoryIncrease < 10 * 1024 * 1024, 
            $"Potential memory leak detected: {memoryIncrease / 1024 / 1024}MB increase after {iterations} iterations");
    }

    [Fact]
    public async Task GetBookingHistory_LargeResultSet_EfficientMemoryUsage()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, eventCount: 10000);
        
        var beforeMemory = GC.GetTotalMemory(forceFullCollection: true);

        // Act
        var query = new GetBookingHistoryQuery(bookingId);
        var result = await _handler.Handle(query, CancellationToken.None);

        var afterMemory = GC.GetTotalMemory(forceFullCollection: false);
        var memoryUsed = afterMemory - beforeMemory;

        _output.WriteLine($"Memory before: {beforeMemory / 1024 / 1024}MB");
        _output.WriteLine($"Memory after: {afterMemory / 1024 / 1024}MB");
        _output.WriteLine($"Memory used: {memoryUsed / 1024 / 1024}MB");
        _output.WriteLine($"History entries: {result.History.Count}");
        _output.WriteLine($"Memory per entry: {memoryUsed / result.History.Count} bytes");

        // Assert
        Assert.True(result.History.Count > 0);
        
        // Memory usage should be reasonable - less than 100MB for 10k entries
        Assert.True(memoryUsed < 100 * 1024 * 1024, 
            $"Memory usage too high: {memoryUsed / 1024 / 1024}MB for {result.History.Count} entries");
        
        // Memory per entry should be reasonable (< 1KB per entry average)
        var memoryPerEntry = memoryUsed / result.History.Count;
        Assert.True(memoryPerEntry < 1024, 
            $"Memory per entry too high: {memoryPerEntry} bytes");
    }

    [Fact]
    public async Task GetBookingHistory_PaginatedRequests_MemoryEfficient()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, eventCount: 5000);
        
        const int pageSize = 50;
        const int pages = 20;
        
        var memoryMeasurements = new List<long>();
        var initialMemory = GC.GetTotalMemory(forceFullCollection: true);

        // Act - Request multiple pages and measure memory usage
        for (var page = 1; page <= pages; page++)
        {
            var query = new GetBookingHistoryQuery(bookingId, Page: page, PageSize: pageSize);
            var result = await _handler.Handle(query, CancellationToken.None);
            
            Assert.Equal(pageSize, result.History.Count);
            
            var currentMemory = GC.GetTotalMemory(forceFullCollection: false);
            memoryMeasurements.Add(currentMemory - initialMemory);
            
            // Force GC every 5 pages to prevent accumulation
            if (page % 5 == 0)
            {
                GC.Collect();
                GC.WaitForPendingFinalizers();
            }
        }

        // Final cleanup
        GC.Collect();
        GC.WaitForPendingFinalizers();
        var finalMemory = GC.GetTotalMemory(forceFullCollection: true);

        _output.WriteLine($"Initial memory: {initialMemory / 1024 / 1024}MB");
        _output.WriteLine($"Peak memory increase: {memoryMeasurements.Max() / 1024 / 1024}MB");
        _output.WriteLine($"Final memory increase: {(finalMemory - initialMemory) / 1024 / 1024}MB");

        // Assert
        var peakMemoryIncrease = memoryMeasurements.Max();
        var finalMemoryIncrease = finalMemory - initialMemory;

        // Peak memory should be reasonable (< 20MB)
        Assert.True(peakMemoryIncrease < 20 * 1024 * 1024, 
            $"Peak memory usage too high: {peakMemoryIncrease / 1024 / 1024}MB");
        
        // Final memory should be much lower than peak (memory released)
        Assert.True(finalMemoryIncrease < peakMemoryIncrease / 2, 
            $"Memory not properly released: Final {finalMemoryIncrease / 1024 / 1024}MB vs Peak {peakMemoryIncrease / 1024 / 1024}MB");
    }

    [Fact]
    public async Task GetBookingHistory_ConcurrentMemoryPressure_HandlesGracefully()
    {
        // Arrange
        var bookingIds = Enumerable.Range(0, 10).Select(_ => Guid.NewGuid()).ToList();
        
        foreach (var bookingId in bookingIds)
        {
            await CreateTestEventHistory(bookingId, eventCount: 1000);
        }

        const int concurrentThreads = 10;
        var initialMemory = GC.GetTotalMemory(forceFullCollection: true);
        var successfulRequests = 0;
        var memoryErrors = 0;
        var tasks = new List<Task>();

        // Act - Concurrent requests creating memory pressure
        for (var thread = 0; thread < concurrentThreads; thread++)
        {
            var bookingId = bookingIds[thread];
            tasks.Add(Task.Run(async () =>
            {
                try
                {
                    // Make multiple requests per thread
                    for (var request = 0; request < 5; request++)
                    {
                        var query = new GetBookingHistoryQuery(bookingId);
                        var result = await _handler.Handle(query, CancellationToken.None);
                        
                        Assert.True(result.History.Count > 0);
                        Interlocked.Increment(ref successfulRequests);
                        
                        // Brief pause to simulate real usage
                        await Task.Delay(50);
                    }
                }
                catch (OutOfMemoryException)
                {
                    Interlocked.Increment(ref memoryErrors);
                }
                catch (Exception ex) when (ex.Message.Contains("memory", StringComparison.OrdinalIgnoreCase))
                {
                    Interlocked.Increment(ref memoryErrors);
                }
            }));
        }

        await Task.WhenAll(tasks);

        // Cleanup
        GC.Collect();
        GC.WaitForPendingFinalizers();
        var finalMemory = GC.GetTotalMemory(forceFullCollection: true);

        _output.WriteLine($"Successful requests: {successfulRequests}/50");
        _output.WriteLine($"Memory errors: {memoryErrors}");
        _output.WriteLine($"Memory increase: {(finalMemory - initialMemory) / 1024 / 1024}MB");

        // Assert
        Assert.True(successfulRequests >= 45, 
            $"Too many requests failed: {successfulRequests}/50 successful");
        
        Assert.Equal(0, memoryErrors);
        
        // Memory should be released after concurrent operations
        var memoryIncrease = finalMemory - initialMemory;
        Assert.True(memoryIncrease < 50 * 1024 * 1024, 
            $"Excessive memory usage after concurrent operations: {memoryIncrease / 1024 / 1024}MB");
    }

    [Fact]
    public async Task GetBookingHistory_DisposalPattern_ResourcesReleased()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var initialMemory = GC.GetTotalMemory(forceFullCollection: true);
        
        // Act - Create and dispose multiple handlers to test disposal pattern
        const int iterations = 50;
        for (var i = 0; i < iterations; i++)
        {
            var options = new DbContextOptionsBuilder<BookingDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            await using var context = new BookingDbContext(options);
            var eventSerializer = Substitute.For<IEventSerializer>();
            var handler = new GetBookingHistoryQueryHandler(context, eventSerializer);
            
            // Setup mock
            eventSerializer.DeserializeEvent(Arg.Any<string>(), Arg.Any<string>())
                .Returns(new BookingCreatedEvent 
                { 
                    BookingId = bookingId,
                    Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
                    BookingItems = []
                });
            
            // Create some test data
            context.EventStoreEvents.Add(new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingCreated",
                EventData = "{}",
                Version = 1,
                Timestamp = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
            
            // Use the handler
            var query = new GetBookingHistoryQuery(bookingId);
            var result = await handler.Handle(query, CancellationToken.None);
            
            Assert.NotNull(result);
            
            // Context is disposed automatically by using statement
        }

        // Force GC to clean up disposed resources
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        
        var finalMemory = GC.GetTotalMemory(forceFullCollection: true);
        var memoryIncrease = finalMemory - initialMemory;

        _output.WriteLine($"Initial memory: {initialMemory / 1024 / 1024}MB");
        _output.WriteLine($"Final memory: {finalMemory / 1024 / 1024}MB");
        _output.WriteLine($"Memory increase: {memoryIncrease / 1024 / 1024}MB");

        // Assert - Memory increase should be minimal despite creating many contexts
        Assert.True(memoryIncrease < 20 * 1024 * 1024, 
            $"Resources not properly disposed: {memoryIncrease / 1024 / 1024}MB increase");
    }

    [Fact]
    public async Task GetBookingHistory_GarbageCollectionPressure_RemainsStable()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, eventCount: 1000);
        
        var gcCounts = new Dictionary<int, int>();
        
        // Record initial GC counts
        for (var generation = 0; generation <= 2; generation++)
        {
            gcCounts[generation] = GC.CollectionCount(generation);
        }

        const int requests = 100;
        var successfulRequests = 0;

        // Act - Make many requests to trigger GC pressure
        for (var i = 0; i < requests; i++)
        {
            try
            {
                var query = new GetBookingHistoryQuery(bookingId);
                var result = await _handler.Handle(query, CancellationToken.None);
                
                Assert.True(result.History.Count > 0);
                successfulRequests++;
                
                // Periodically force GC to simulate pressure
                if (i % 10 == 0)
                {
                    GC.Collect(0, GCCollectionMode.Optimized);
                }
            }
            catch (Exception ex)
            {
                _output.WriteLine($"Request {i} failed: {ex.Message}");
            }
        }

        // Record final GC counts
        var finalGcCounts = new Dictionary<int, int>();
        for (var generation = 0; generation <= 2; generation++)
        {
            finalGcCounts[generation] = GC.CollectionCount(generation);
        }

        _output.WriteLine($"Successful requests: {successfulRequests}/{requests}");
        for (var generation = 0; generation <= 2; generation++)
        {
            var collections = finalGcCounts[generation] - gcCounts[generation];
            _output.WriteLine($"Gen {generation} collections: {collections}");
        }

        // Assert
        Assert.True(successfulRequests >= requests * 0.95, 
            $"Too many requests failed under GC pressure: {successfulRequests}/{requests}");
        
        // GC collections should be reasonable (not excessive)
        var gen0Collections = finalGcCounts[0] - gcCounts[0];
        var gen1Collections = finalGcCounts[1] - gcCounts[1];
        var gen2Collections = finalGcCounts[2] - gcCounts[2];
        
        Assert.True(gen0Collections < requests * 2, 
            $"Excessive Gen 0 collections: {gen0Collections}");
        Assert.True(gen2Collections < 10, 
            $"Too many Gen 2 collections: {gen2Collections}");
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
        _handler = null!;
        _context.Dispose();
        _eventSerializer = null!;
        
        // Force cleanup
        GC.Collect();
        GC.WaitForPendingFinalizers();
    }
}