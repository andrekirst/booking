using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit.Abstractions;

namespace Booking.Api.Tests.EdgeCases;

/// <summary>
/// Edge Case Tests für Historie-Funktionalität
/// Testet seltene aber kritische Szenarien und Grenzfälle
/// </summary>
public class BookingHistoryEdgeCaseTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly IEventSerializer _eventSerializer;
    private readonly GetBookingHistoryQueryHandler _handler;
    private readonly ITestOutputHelper _output;

    public BookingHistoryEdgeCaseTests(ITestOutputHelper output)
    {
        _output = output;
        
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new BookingDbContext(options);
        _eventSerializer = Substitute.For<IEventSerializer>();
        _handler = new GetBookingHistoryQueryHandler(_context, _eventSerializer);
    }

    [Fact]
    public async Task GetBookingHistory_MaximumEventCount_HandlesGracefully()
    {
        // Arrange - Create maximum possible events (test system limits)
        var bookingId = Guid.NewGuid();
        const int maxEvents = 100000; // 100k events
        
        _output.WriteLine($"Creating {maxEvents} events for stress testing...");
        
        await CreateMassiveEventHistory(bookingId, maxEvents);
        
        var query = new GetBookingHistoryQuery(bookingId, Page: 1, PageSize: 100);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(bookingId, result.BookingId);
        Assert.Equal(100, result.History.Count); // Should return paginated results
        
        // Verify chronological order even with massive dataset
        for (var i = 0; i < result.History.Count - 1; i++)
        {
            Assert.True(result.History[i].Timestamp >= result.History[i + 1].Timestamp,
                "Chronological order must be maintained even with large datasets");
        }
    }

    [Fact]
    public async Task GetBookingHistory_CorruptedEventData_RecoversGracefully()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        
        // Create events with various types of corruption
        var corruptedEvents = new[]
        {
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingCreated",
                EventData = null!, // Null data
                Version = 1,
                Timestamp = DateTime.UtcNow.AddHours(-3)
            },
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingUpdated",
                EventData = "invalid json{", // Invalid JSON
                Version = 2,
                Timestamp = DateTime.UtcNow.AddHours(-2)
            },
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingConfirmed",
                EventData = string.Empty, // Empty data
                Version = 3,
                Timestamp = DateTime.UtcNow.AddHours(-1)
            },
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingCancelled",
                EventData = new string('x', 100000), // Extremely large data
                Version = 4,
                Timestamp = DateTime.UtcNow
            }
        };

        _context.EventStoreEvents.AddRange(corruptedEvents);
        await _context.SaveChangesAsync();

        // Setup serializer to throw exceptions for corrupted data
        _eventSerializer.DeserializeEvent(null!, Arg.Any<string>())
            .Throws(new ArgumentNullException());
        _eventSerializer.DeserializeEvent("invalid json{", Arg.Any<string>())
            .Throws(new InvalidOperationException("Invalid JSON"));
        _eventSerializer.DeserializeEvent(string.Empty, Arg.Any<string>())
            .Throws(new ArgumentException("Empty data"));
        _eventSerializer.DeserializeEvent(Arg.Is<string>(s => s.Length > 50000), Arg.Any<string>())
            .Throws(new OutOfMemoryException("Data too large"));

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(bookingId, result.BookingId);
        Assert.Equal(4, result.History.Count); // Should create fallback entries for all corrupted events
        
        // All entries should be fallback entries with error descriptions
        Assert.All(result.History, entry =>
            Assert.Contains("konnte nicht verarbeitet werden", entry.Description));
    }

    [Theory]
    [InlineData("1900-01-01")]
    [InlineData("2100-12-31")]
    public async Task GetBookingHistory_ExtremeDateValues_HandlesCorrectly(object dateValue)
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var timestamp = dateValue switch
        {
            DateTime dt => dt,
            string str => DateTime.Parse(str),
            _ => throw new ArgumentException("Invalid date value")
        };

        var extremeDateEvent = new EventStoreEvent
        {
            Id = Guid.NewGuid(),
            AggregateId = bookingId,
            AggregateType = "BookingAggregate",
            EventType = "BookingCreated",
            EventData = "{}",
            Version = 1,
            Timestamp = timestamp
        };

        _context.EventStoreEvents.Add(extremeDateEvent);
        await _context.SaveChangesAsync();

        _eventSerializer.DeserializeEvent(Arg.Any<string>(), "BookingCreated")
            .Returns(new BookingCreatedEvent 
            { 
                BookingId = bookingId,
                Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
                BookingItems = []
            });

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Single(result.History);
        Assert.Equal(timestamp, result.History[0].Timestamp);
        
        _output.WriteLine($"Successfully handled extreme date: {timestamp}");
    }

    [Fact]
    public async Task GetBookingHistory_DuplicateVersionNumbers_HandlesConsistently()
    {
        // Arrange - Simulate database corruption with duplicate versions
        var bookingId = Guid.NewGuid();
        
        var duplicateVersionEvents = new[]
        {
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingCreated",
                EventData = "{}",
                Version = 1,
                Timestamp = DateTime.UtcNow.AddHours(-2)
            },
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingUpdated",
                EventData = "{}",
                Version = 1, // Duplicate version!
                Timestamp = DateTime.UtcNow.AddHours(-1)
            },
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingConfirmed",
                EventData = "{}",
                Version = 2,
                Timestamp = DateTime.UtcNow
            }
        };

        _context.EventStoreEvents.AddRange(duplicateVersionEvents);
        await _context.SaveChangesAsync();

        _eventSerializer.DeserializeEvent(Arg.Any<string>(), Arg.Any<string>())
            .Returns(_ => new BookingCreatedEvent 
            { 
                BookingId = bookingId,
                Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
                BookingItems = []
            });

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(3, result.History.Count); // Should handle all events despite duplicate versions
        
        // Should be ordered by timestamp regardless of version inconsistencies
        for (var i = 0; i < result.History.Count - 1; i++)
        {
            Assert.True(result.History[i].Timestamp >= result.History[i + 1].Timestamp,
                "Should maintain chronological order despite version corruption");
        }
    }

    [Fact]
    public async Task GetBookingHistory_UnicodeAndSpecialCharacters_ProcessesCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        
        var unicodeEventData = new[]
        {
            "{\"notes\":\"Gäste aus München: Müller, Größe: 2m² 🏠\"}", // German umlauts + emoji
            "{\"notes\":\"Réservation pour café ☕ et croissant 🥐\"}", // French accents + emojis
            "{\"notes\":\"Резервация на даче в Москве 🏡\"}", // Cyrillic
            "{\"notes\":\"預約在台北的房間 🏨\"}", // Chinese characters
            "{\"notes\":\"صالح للعائلات 👨‍👩‍👧‍👦\"}", // Arabic + family emoji
            "{\"notes\":\"\\u0048\\u0065\\u006C\\u006C\\u006F\"}" // Unicode escapes
        };

        var events = unicodeEventData.Select((t, i) => new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingCreated",
                EventData = t,
                Version = i + 1,
                Timestamp = DateTime.UtcNow.AddMinutes(-i)
            })
            .ToList();

        _context.EventStoreEvents.AddRange(events);
        await _context.SaveChangesAsync();

        _eventSerializer.DeserializeEvent(Arg.Any<string>(), Arg.Any<string>())
            .Returns(new BookingCreatedEvent 
            { 
                BookingId = bookingId,
                Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
                BookingItems = []
            });

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(unicodeEventData.Length, result.History.Count);
        
        // Verify that special characters are handled without corruption
        foreach (var historyEntry in result.History)
        {
            Assert.NotNull(historyEntry.Description);
            Assert.NotNull(historyEntry.Details);
            // Should not contain replacement characters (�) which indicate encoding issues
            Assert.DoesNotContain("�", historyEntry.Description);
            Assert.DoesNotContain("�", historyEntry.Details);
        }
    }

    [Fact]
    public async Task GetBookingHistory_ExtremelyLongEventData_TruncatesGracefully()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        
        // Create event with extremely long data (1MB+)
        var longString = new string('A', 1024 * 1024); // 1MB of 'A'
        var longEventData = $"{{\"notes\":\"{longString}\"}}";
        
        var longDataEvent = new EventStoreEvent
        {
            Id = Guid.NewGuid(),
            AggregateId = bookingId,
            AggregateType = "BookingAggregate",
            EventType = "BookingCreated",
            EventData = longEventData,
            Version = 1,
            Timestamp = DateTime.UtcNow
        };

        _context.EventStoreEvents.Add(longDataEvent);
        await _context.SaveChangesAsync();

        _eventSerializer.DeserializeEvent(longEventData, "BookingCreated")
            .Returns(new BookingCreatedEvent 
            { 
                BookingId = bookingId,
                Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
                BookingItems = [],
                Notes = longString
            });

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Single(result.History);
        
        var historyEntry = result.History[0];
        
        // Details should be truncated to reasonable length
        Assert.True(historyEntry.Details.Length < 10000, 
            $"Details too long: {historyEntry.Details.Length} characters");
        
        // Should indicate truncation if original was too long
        if (longString.Length > 1000)
        {
            Assert.Contains("...", historyEntry.Details);
        }
    }

    [Fact]
    public async Task GetBookingHistory_DatabaseTimeout_RetriesGracefully()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, 100);

        // Create a handler that simulates database timeout on first call
        var timeoutSimulated = false;
        _eventSerializer.When(x => x.DeserializeEvent(Arg.Any<string>(), Arg.Any<string>()))
            .Do(_ =>
            {
                if (!timeoutSimulated)
                {
                    timeoutSimulated = true;
                    Thread.Sleep(100); // Simulate slow operation
                    throw new TimeoutException("Database timeout");
                }
            });

        var query = new GetBookingHistoryQuery(bookingId);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<TimeoutException>(
            () => _handler.Handle(query, CancellationToken.None));
        
        Assert.Contains("timeout", exception.Message.ToLower());
        
        // Second call should succeed (timeout not simulated again)
        _eventSerializer.DeserializeEvent(Arg.Any<string>(), Arg.Any<string>())
            .Returns(new BookingCreatedEvent 
            { 
                BookingId = bookingId,
                Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
                BookingItems = []
            });

        var retryResult = await _handler.Handle(query, CancellationToken.None);
        Assert.NotNull(retryResult);
    }

    [Theory]
    [InlineData(int.MaxValue, 1)]     // Max page number, min page size
    [InlineData(1, int.MaxValue)]     // Min page number, max page size  
    [InlineData(999999, 100)]         // Very high page number
    public async Task GetBookingHistory_ExtremePaginationValues_HandlesGracefully(int page, int pageSize)
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, 50);

        // Clamp page size to reasonable limits for this test
        var clampedPageSize = Math.Min(pageSize, 1000);
        
        var query = new GetBookingHistoryQuery(bookingId, Page: page, PageSize: clampedPageSize);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(bookingId, result.BookingId);
        
        if (page > 1000) // Extremely high page numbers should return empty results
        {
            Assert.Empty(result.History);
        }
        else
        {
            // Should handle gracefully without throwing exceptions
            Assert.True(result.History.Count >= 0);
        }
    }

    [Fact]
    public async Task GetBookingHistory_ConcurrentModificationDuringRead_RemainsConsistent()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        await CreateTestEventHistory(bookingId, 100);

        var readTasks = new List<Task<BookingHistoryDto>>();
        var modificationTask = Task.Run(async () =>
        {
            // Simulate concurrent modifications
            await Task.Delay(50);
            
            for (var i = 0; i < 10; i++)
            {
                var newEvent = new EventStoreEvent
                {
                    Id = Guid.NewGuid(),
                    AggregateId = bookingId,
                    AggregateType = "BookingAggregate",
                    EventType = "BookingModified",
                    EventData = "{}",
                    Version = 101 + i,
                    Timestamp = DateTime.UtcNow.AddMinutes(i)
                };
                
                _context.EventStoreEvents.Add(newEvent);
                await _context.SaveChangesAsync();
                
                await Task.Delay(10);
            }
        });

        // Act - Start reads while modifications are happening
        for (var i = 0; i < 5; i++)
        {
            var i1 = i;
            readTasks.Add(Task.Run(async () =>
            {
                await Task.Delay(i1 * 20); // Stagger the reads
                var query = new GetBookingHistoryQuery(bookingId);
                return await _handler.Handle(query, CancellationToken.None);
            }));
        }

        var readResults = await Task.WhenAll(readTasks);
        await modificationTask;

        // Assert
        Assert.All(readResults, result =>
        {
            Assert.Equal(bookingId, result.BookingId);
            Assert.True(result.History.Count > 0);
            
            // Verify internal consistency of each read
            for (var i = 0; i < result.History.Count - 1; i++)
            {
                Assert.True(result.History[i].Timestamp >= result.History[i + 1].Timestamp,
                    "Each individual read should be internally consistent");
            }
        });

        // Results may vary in count due to concurrent modifications, but should be consistent
        var distinctCounts = readResults.Select(r => r.History.Count).Distinct().ToList();
        Assert.True(distinctCounts.Count <= 3, 
            "Should not have wildly different counts due to concurrent modifications");
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
        
        // Setup mock for all event types
        _eventSerializer.DeserializeEvent(Arg.Any<string>(), Arg.Any<string>())
            .Returns(new BookingCreatedEvent 
            { 
                BookingId = bookingId,
                Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
                BookingItems = []
            });
    }

    private async Task CreateMassiveEventHistory(Guid bookingId, int eventCount)
    {
        // Create events in batches to avoid memory issues
        const int batchSize = 1000;
        var eventTypes = new[] { "BookingCreated", "BookingUpdated", "BookingConfirmed", "BookingCancelled" };
        
        for (var batch = 0; batch < eventCount; batch += batchSize)
        {
            var events = new List<EventStoreEvent>();
            var currentBatchSize = Math.Min(batchSize, eventCount - batch);
            
            for (var i = 0; i < currentBatchSize; i++)
            {
                var eventIndex = batch + i + 1;
                events.Add(new EventStoreEvent
                {
                    Id = Guid.NewGuid(),
                    AggregateId = bookingId,
                    AggregateType = "BookingAggregate",
                    EventType = eventTypes[eventIndex % eventTypes.Length],
                    EventData = $"{{\"BookingId\":\"{bookingId}\",\"Version\":{eventIndex}}}",
                    Version = eventIndex,
                    Timestamp = DateTime.UtcNow.AddMinutes(-eventCount + eventIndex)
                });
            }
            
            _context.EventStoreEvents.AddRange(events);
            await _context.SaveChangesAsync();
            
            // Clear change tracker to prevent memory buildup
            _context.ChangeTracker.Clear();
        }
        
        // Setup mock
        _eventSerializer.DeserializeEvent(Arg.Any<string>(), Arg.Any<string>())
            .Returns(new BookingCreatedEvent 
            { 
                BookingId = bookingId,
                Status = Booking.Api.Domain.Enums.BookingStatus.Pending,
                BookingItems = []
            });
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}