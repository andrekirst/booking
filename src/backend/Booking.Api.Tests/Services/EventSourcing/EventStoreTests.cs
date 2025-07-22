using AutoFixture;
using Booking.Api.Data;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.Common;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Services.EventSourcing;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Booking.Api.Tests.Services.EventSourcing;

public class EventStoreTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly IEventSerializer _eventSerializer;
    private readonly EventStore _eventStore;
    private readonly Fixture _fixture;

    public EventStoreTests()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BookingDbContext(options);
        _eventSerializer = Substitute.For<IEventSerializer>();
        _eventStore = new EventStore(_context, _eventSerializer);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task GetEventsAsync_WithFromVersionGreaterThanZero_ShouldIncludeEventWithExactVersion()
    {
        // Arrange
        var aggregateId = Guid.NewGuid();
        var aggregateType = nameof(BookingAggregate);
        
        // Create events with versions 1, 2, 3
        var event1 = CreateEventStoreEvent(aggregateId, aggregateType, 1);
        var event2 = CreateEventStoreEvent(aggregateId, aggregateType, 2);
        var event3 = CreateEventStoreEvent(aggregateId, aggregateType, 3);

        await _context.EventStoreEvents.AddRangeAsync(event1, event2, event3);
        await _context.SaveChangesAsync();

        // Setup event deserialization
        var domainEvent1 = new BookingCreatedEvent { Id = Guid.NewGuid(), OccurredAt = DateTime.UtcNow };
        var domainEvent2 = new BookingConfirmedEvent { Id = Guid.NewGuid(), OccurredAt = DateTime.UtcNow };
        var domainEvent3 = new BookingCancelledEvent { Id = Guid.NewGuid(), OccurredAt = DateTime.UtcNow };

        _eventSerializer.DeserializeEvent(event1.EventData, event1.EventType).Returns(domainEvent1);
        _eventSerializer.DeserializeEvent(event2.EventData, event2.EventType).Returns(domainEvent2);
        _eventSerializer.DeserializeEvent(event3.EventData, event3.EventType).Returns(domainEvent3);

        // Act - Get events from version 2 onwards (should include version 2 and 3)
        var events = await _eventStore.GetEventsAsync(aggregateId, aggregateType, fromVersion: 2);

        // Assert
        events.Should().HaveCount(2);
        events[0].Should().Be(domainEvent2); // Version 2
        events[1].Should().Be(domainEvent3); // Version 3
    }

    [Fact]
    public async Task GetEventsAsync_WithFromVersionZero_ShouldReturnAllEvents()
    {
        // Arrange
        var aggregateId = Guid.NewGuid();
        var aggregateType = nameof(BookingAggregate);
        
        var event1 = CreateEventStoreEvent(aggregateId, aggregateType, 1);
        var event2 = CreateEventStoreEvent(aggregateId, aggregateType, 2);

        await _context.EventStoreEvents.AddRangeAsync(event1, event2);
        await _context.SaveChangesAsync();

        var domainEvent1 = new BookingCreatedEvent { Id = Guid.NewGuid(), OccurredAt = DateTime.UtcNow };
        var domainEvent2 = new BookingConfirmedEvent { Id = Guid.NewGuid(), OccurredAt = DateTime.UtcNow };

        _eventSerializer.DeserializeEvent(event1.EventData, event1.EventType).Returns(domainEvent1);
        _eventSerializer.DeserializeEvent(event2.EventData, event2.EventType).Returns(domainEvent2);

        // Act
        var events = await _eventStore.GetEventsAsync(aggregateId, aggregateType, fromVersion: 0);

        // Assert
        events.Should().HaveCount(2);
        events[0].Should().Be(domainEvent1);
        events[1].Should().Be(domainEvent2);
    }

    [Fact]
    public async Task SaveEventsAsync_ShouldCorrectlyAssignVersionNumbers()
    {
        // Arrange
        var aggregateId = Guid.NewGuid();
        var aggregateType = nameof(BookingAggregate);
        var expectedVersion = 0;

        var events = new List<IAggregateEvent>
        {
            new BookingCreatedEvent { Id = Guid.NewGuid(), OccurredAt = DateTime.UtcNow },
            new BookingConfirmedEvent { Id = Guid.NewGuid(), OccurredAt = DateTime.UtcNow }
        };

        _eventSerializer.SerializeEvent(Arg.Any<IAggregateEvent>()).Returns("{}");

        // Act
        await _eventStore.SaveEventsAsync(aggregateId, aggregateType, events, expectedVersion);

        // Assert
        var savedEvents = await _context.EventStoreEvents
            .Where(e => e.AggregateId == aggregateId)
            .OrderBy(e => e.Version)
            .ToListAsync();

        savedEvents.Should().HaveCount(2);
        savedEvents[0].Version.Should().Be(1);
        savedEvents[1].Version.Should().Be(2);
    }

    [Fact]
    public async Task GetEventsAsync_WithSpecificFromVersion_ShouldNotSkipEventWithThatVersion()
    {
        // Arrange
        var aggregateId = Guid.NewGuid();
        var aggregateType = nameof(BookingAggregate);
        
        // Create event with version 5
        var event5 = CreateEventStoreEvent(aggregateId, aggregateType, 5);
        await _context.EventStoreEvents.AddAsync(event5);
        await _context.SaveChangesAsync();

        var domainEvent = new BookingAcceptedEvent { Id = Guid.NewGuid(), OccurredAt = DateTime.UtcNow };
        _eventSerializer.DeserializeEvent(event5.EventData, event5.EventType).Returns(domainEvent);

        // Act - Get events from version 5 (should include version 5)
        var events = await _eventStore.GetEventsAsync(aggregateId, aggregateType, fromVersion: 5);

        // Assert
        events.Should().HaveCount(1);
        events[0].Should().Be(domainEvent);
    }

    private EventStoreEvent CreateEventStoreEvent(Guid aggregateId, string aggregateType, int version)
    {
        return new EventStoreEvent
        {
            Id = Guid.NewGuid(),
            AggregateId = aggregateId,
            AggregateType = aggregateType,
            EventType = _fixture.Create<string>(),
            EventData = "{}",
            Version = version,
            Timestamp = DateTime.UtcNow
        };
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}