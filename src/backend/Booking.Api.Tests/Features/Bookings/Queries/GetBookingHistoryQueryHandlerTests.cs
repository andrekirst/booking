using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace Booking.Api.Tests.Features.Bookings.Queries;

public class GetBookingHistoryQueryHandlerTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly IEventSerializer _eventSerializer;
    private readonly GetBookingHistoryQueryHandler _handler;

    public GetBookingHistoryQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new BookingDbContext(options);
        _eventSerializer = Substitute.For<IEventSerializer>();
        _handler = new GetBookingHistoryQueryHandler(_context, _eventSerializer);
    }

    [Fact]
    public async Task Handle_BookingNotExists_ThrowsKeyNotFoundException()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var query = new GetBookingHistoryQuery(bookingId);

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _handler.Handle(query, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_BookingExists_ReturnsHistoryInDescendingOrder()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        
        var createdEvent = new BookingCreatedEvent
        {
            BookingId = bookingId,
            UserId = userId,
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(3),
            Status = BookingStatus.Pending,
            BookingItems = new List<BookingItem>
            {
                new(Guid.NewGuid(), 2)
            }
        };

        var updatedEvent = new BookingUpdatedEvent
        {
            BookingId = bookingId,
            StartDate = DateTime.UtcNow.AddDays(2),
            EndDate = DateTime.UtcNow.AddDays(4),
            BookingItems = new List<BookingItem>
            {
                new(Guid.NewGuid(), 3)
            }
        };

        var eventStoreEvents = new List<EventStoreEvent>
        {
            new()
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingCreated",
                EventData = "{}",
                Version = 1,
                Timestamp = DateTime.UtcNow.AddHours(-2)
            },
            new()
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingUpdated",
                EventData = "{}",
                Version = 2,
                Timestamp = DateTime.UtcNow.AddHours(-1)
            }
        };

        _context.EventStoreEvents.AddRange(eventStoreEvents);
        await _context.SaveChangesAsync();

        _eventSerializer.DeserializeEvent(Arg.Any<string>(), "BookingCreated")
            .Returns(createdEvent);
        _eventSerializer.DeserializeEvent(Arg.Any<string>(), "BookingUpdated")
            .Returns(updatedEvent);

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(bookingId, result.BookingId);
        Assert.Equal(2, result.History.Count);
        
        // Should be in descending order (most recent first)
        Assert.Equal("BookingUpdated", result.History[0].EventType);
        Assert.Equal("BookingCreated", result.History[1].EventType);
        
        Assert.True(result.History[0].Timestamp > result.History[1].Timestamp);
    }

    [Fact]
    public async Task Handle_BookingCreatedEvent_CreatesCorrectHistoryEntry()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = DateTime.UtcNow.AddDays(3);
        
        var createdEvent = new BookingCreatedEvent
        {
            BookingId = bookingId,
            UserId = userId,
            StartDate = startDate,
            EndDate = endDate,
            Status = BookingStatus.Pending,
            Notes = "Test booking",
            BookingItems = new List<BookingItem>
            {
                new(Guid.NewGuid(), 2),
                new(Guid.NewGuid(), 1)
            }
        };

        var eventStoreEvent = new EventStoreEvent
        {
            Id = Guid.NewGuid(),
            AggregateId = bookingId,
            AggregateType = "BookingAggregate",
            EventType = "BookingCreated",
            EventData = "{}",
            Version = 1,
            Timestamp = DateTime.UtcNow
        };

        _context.EventStoreEvents.Add(eventStoreEvent);
        await _context.SaveChangesAsync();

        _eventSerializer.DeserializeEvent(Arg.Any<string>(), "BookingCreated")
            .Returns(createdEvent);

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        var historyEntry = result.History.First();
        Assert.Equal("Buchung erstellt", historyEntry.Description);
        Assert.Contains("3 Person(en)", historyEntry.Details);
        Assert.Equal(BookingStatus.Pending, historyEntry.StatusAfter);
        Assert.Null(historyEntry.StatusBefore);
        
        Assert.Equal(startDate, historyEntry.Changes["startDate"]);
        Assert.Equal(endDate, historyEntry.Changes["endDate"]);
        Assert.Equal(3, historyEntry.Changes["totalPersons"]);
        Assert.Equal(2, historyEntry.Changes["accommodationCount"]);
        Assert.Equal("Test booking", historyEntry.Changes["notes"]);
    }

    [Fact]
    public async Task Handle_BookingCancelledEvent_CreatesCorrectHistoryEntry()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        
        var cancelledEvent = new BookingCancelledEvent
        {
            BookingId = bookingId
        };

        var eventStoreEvent = new EventStoreEvent
        {
            Id = Guid.NewGuid(),
            AggregateId = bookingId,
            AggregateType = "BookingAggregate",
            EventType = "BookingCancelled",
            EventData = "{}",
            Version = 1,
            Timestamp = DateTime.UtcNow
        };

        _context.EventStoreEvents.Add(eventStoreEvent);
        await _context.SaveChangesAsync();

        _eventSerializer.DeserializeEvent(Arg.Any<string>(), "BookingCancelled")
            .Returns(cancelledEvent);

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        var historyEntry = result.History.First();
        Assert.Equal("Buchung storniert", historyEntry.Description);
        Assert.Equal("Buchung wurde storniert", historyEntry.Details);
        Assert.Equal(BookingStatus.Cancelled, historyEntry.StatusAfter);
    }

    [Fact]
    public async Task Handle_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        
        // Create multiple events
        var events = new List<EventStoreEvent>();
        for (int i = 1; i <= 5; i++)
        {
            events.Add(new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingCreated",
                EventData = "{}",
                Version = i,
                Timestamp = DateTime.UtcNow.AddHours(-i)
            });
        }

        _context.EventStoreEvents.AddRange(events);
        await _context.SaveChangesAsync();

        _eventSerializer.DeserializeEvent(Arg.Any<string>(), "BookingCreated")
            .Returns(new BookingCreatedEvent 
            { 
                BookingId = bookingId, 
                Status = BookingStatus.Pending,
                BookingItems = new List<BookingItem>()
            });

        var query = new GetBookingHistoryQuery(bookingId, Page: 2, PageSize: 2);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(bookingId, result.BookingId);
        Assert.Equal(2, result.History.Count); // Should return 2 items for page 2
    }

    [Fact]
    public async Task Handle_EventDeserializationFails_CreatesFallbackEntry()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        
        var eventStoreEvent = new EventStoreEvent
        {
            Id = Guid.NewGuid(),
            AggregateId = bookingId,
            AggregateType = "BookingAggregate",
            EventType = "BookingCreated",
            EventData = "{}",
            Version = 1,
            Timestamp = DateTime.UtcNow
        };

        _context.EventStoreEvents.Add(eventStoreEvent);
        await _context.SaveChangesAsync();

        // Make deserialization fail
        _eventSerializer.When(x => x.DeserializeEvent(Arg.Any<string>(), "BookingCreated"))
            .Do(x => throw new InvalidOperationException("Deserialization failed"));

        var query = new GetBookingHistoryQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        var historyEntry = result.History.First();
        Assert.Equal("BookingCreated", historyEntry.EventType);
        Assert.Equal("Ereignis konnte nicht verarbeitet werden", historyEntry.Description);
        Assert.Contains("Deserialization failed", historyEntry.Details);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}