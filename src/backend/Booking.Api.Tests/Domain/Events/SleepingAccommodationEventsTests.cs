using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.SleepingAccommodations;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class SleepingAccommodationEventsTests
{
    [Fact]
    public void SleepingAccommodationCreatedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var createdEvent = new SleepingAccommodationCreatedEvent
        {
            SleepingAccommodationId = Guid.NewGuid(),
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4,
            IsActive = true
        };

        // Assert
        createdEvent.EventType.Should().Be("SleepingAccommodationCreated");
        createdEvent.SleepingAccommodationId.Should().NotBeEmpty();
        createdEvent.Name.Should().Be("Test Room");
        createdEvent.Type.Should().Be(AccommodationType.Room);
        createdEvent.MaxCapacity.Should().Be(4);
        createdEvent.IsActive.Should().BeTrue();
        createdEvent.Id.Should().NotBeEmpty();
        createdEvent.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void SleepingAccommodationUpdatedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var updatedEvent = new SleepingAccommodationUpdatedEvent
        {
            SleepingAccommodationId = Guid.NewGuid(),
            Name = "Updated Room",
            Type = AccommodationType.Tent,
            MaxCapacity = 2
        };

        // Assert
        updatedEvent.EventType.Should().Be("SleepingAccommodationUpdated");
        updatedEvent.SleepingAccommodationId.Should().NotBeEmpty();
        updatedEvent.Name.Should().Be("Updated Room");
        updatedEvent.Type.Should().Be(AccommodationType.Tent);
        updatedEvent.MaxCapacity.Should().Be(2);
    }

    [Fact]
    public void SleepingAccommodationDeactivatedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var deactivatedEvent = new SleepingAccommodationDeactivatedEvent
        {
            SleepingAccommodationId = Guid.NewGuid()
        };

        // Assert
        deactivatedEvent.EventType.Should().Be("SleepingAccommodationDeactivated");
        deactivatedEvent.SleepingAccommodationId.Should().NotBeEmpty();
    }

    [Fact]
    public void SleepingAccommodationReactivatedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var reactivatedEvent = new SleepingAccommodationReactivatedEvent
        {
            SleepingAccommodationId = Guid.NewGuid()
        };

        // Assert
        reactivatedEvent.EventType.Should().Be("SleepingAccommodationReactivated");
        reactivatedEvent.SleepingAccommodationId.Should().NotBeEmpty();
    }
}