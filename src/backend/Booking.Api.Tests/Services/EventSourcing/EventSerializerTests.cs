using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Services.EventSourcing;
using FluentAssertions;

namespace Booking.Api.Tests.Services.EventSourcing;

public class EventSerializerTests
{
    private readonly EventSerializer _eventSerializer;

    public EventSerializerTests()
    {
        _eventSerializer = new EventSerializer();
    }

    [Fact]
    public void SerializeEvent_WithSleepingAccommodationCreatedEvent_ShouldSerializeCorrectly()
    {
        // Arrange
        var domainEvent = new SleepingAccommodationCreatedEvent
        {
            Id = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
            SleepingAccommodationId = Guid.NewGuid(),
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4,
            IsActive = true
        };

        // Act
        var serializedEvent = _eventSerializer.SerializeEvent(domainEvent);

        // Assert
        serializedEvent.Should().NotBeNullOrEmpty();
        serializedEvent.Should().Contain("\"name\":\"Test Room\"");
        serializedEvent.Should().Contain("\"type\":0"); // Room enum value
        serializedEvent.Should().Contain("\"maxCapacity\":4");
        serializedEvent.Should().Contain("\"isActive\":true");
    }

    [Fact]
    public void DeserializeEvent_WithSleepingAccommodationCreatedEvent_ShouldDeserializeCorrectly()
    {
        // Arrange
        var originalEvent = new SleepingAccommodationCreatedEvent
        {
            Id = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
            SleepingAccommodationId = Guid.NewGuid(),
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4,
            IsActive = true
        };

        var serializedEvent = _eventSerializer.SerializeEvent(originalEvent);

        // Act
        var deserializedEvent = _eventSerializer.DeserializeEvent(serializedEvent, originalEvent.EventType);

        // Assert
        deserializedEvent.Should().BeOfType<SleepingAccommodationCreatedEvent>();
        var typedEvent = (SleepingAccommodationCreatedEvent)deserializedEvent;
        
        typedEvent.Id.Should().Be(originalEvent.Id);
        typedEvent.OccurredAt.Should().Be(originalEvent.OccurredAt);
        typedEvent.SleepingAccommodationId.Should().Be(originalEvent.SleepingAccommodationId);
        typedEvent.Name.Should().Be(originalEvent.Name);
        typedEvent.Type.Should().Be(originalEvent.Type);
        typedEvent.MaxCapacity.Should().Be(originalEvent.MaxCapacity);
        typedEvent.IsActive.Should().Be(originalEvent.IsActive);
    }

    [Fact]
    public void DeserializeEvent_WithUnknownEventType_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var eventData = "{\"id\":\"" + Guid.NewGuid() + "\"}";
        var unknownEventType = "UnknownEventType";

        // Act & Assert
        var act = () => _eventSerializer.DeserializeEvent(eventData, unknownEventType);
        act.Should().Throw<InvalidOperationException>().WithMessage("Unknown event type: UnknownEventType");
    }

    [Fact]
    public void SerializeSnapshot_WithObject_ShouldSerializeCorrectly()
    {
        // Arrange
        var snapshot = new TestSnapshot
        {
            Id = Guid.NewGuid(),
            Name = "Test Snapshot",
            Value = 42
        };

        // Act
        var serializedSnapshot = _eventSerializer.SerializeSnapshot(snapshot);

        // Assert
        serializedSnapshot.Should().NotBeNullOrEmpty();
        serializedSnapshot.Should().Contain("\"name\":\"Test Snapshot\"");
        serializedSnapshot.Should().Contain("\"value\":42");
    }

    [Fact]
    public void DeserializeSnapshot_WithValidData_ShouldDeserializeCorrectly()
    {
        // Arrange
        var originalSnapshot = new TestSnapshot
        {
            Id = Guid.NewGuid(),
            Name = "Test Snapshot",
            Value = 42
        };

        var serializedSnapshot = _eventSerializer.SerializeSnapshot(originalSnapshot);

        // Act
        var deserializedSnapshot = _eventSerializer.DeserializeSnapshot<TestSnapshot>(serializedSnapshot);

        // Assert
        deserializedSnapshot.Should().NotBeNull();
        deserializedSnapshot!.Id.Should().Be(originalSnapshot.Id);
        deserializedSnapshot.Name.Should().Be(originalSnapshot.Name);
        deserializedSnapshot.Value.Should().Be(originalSnapshot.Value);
    }

    private class TestSnapshot
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Value { get; set; }
    }
}