using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.Exceptions;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Aggregates;

public class SleepingAccommodationAggregateTests
{
    [Fact]
    public void Create_WithValidData_ShouldCreateAggregateWithEvent()
    {
        // Arrange
        var id = Guid.NewGuid();
        var name = "Test Room";
        var type = AccommodationType.Room;
        var maxCapacity = 4;

        // Act
        var aggregate = SleepingAccommodationAggregate.Create(id, name, type, maxCapacity);

        // Assert
        aggregate.Id.Should().Be(id);
        aggregate.Name.Should().Be(name);
        aggregate.Type.Should().Be(type);
        aggregate.MaxCapacity.Should().Be(maxCapacity);
        aggregate.IsActive.Should().BeTrue();
        aggregate.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        aggregate.ChangedAt.Should().BeNull();
        aggregate.Version.Should().Be(-1); // Version is -1 until events are persisted

        aggregate.DomainEvents.Should().HaveCount(1);
        var domainEvent = aggregate.DomainEvents.First();
        domainEvent.Should().BeOfType<SleepingAccommodationCreatedEvent>();
        
        var createdEvent = (SleepingAccommodationCreatedEvent)domainEvent;
        createdEvent.SleepingAccommodationId.Should().Be(id);
        createdEvent.Name.Should().Be(name);
        createdEvent.Type.Should().Be(type);
        createdEvent.MaxCapacity.Should().Be(maxCapacity);
        createdEvent.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Create_WithEmptyName_ShouldThrowInvalidAccommodationNameException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var name = "";
        var type = AccommodationType.Room;
        var maxCapacity = 4;

        // Act & Assert
        var act = () => SleepingAccommodationAggregate.Create(id, name, type, maxCapacity);
        act.Should().Throw<InvalidAccommodationNameException>()
            .WithMessage("Sleeping accommodation name cannot be empty or whitespace");
    }

    [Fact]
    public void Create_WithZeroCapacity_ShouldThrowInvalidAccommodationCapacityException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var name = "Test Room";
        var type = AccommodationType.Room;
        var maxCapacity = 0;

        // Act & Assert
        var act = () => SleepingAccommodationAggregate.Create(id, name, type, maxCapacity);
        act.Should().Throw<InvalidAccommodationCapacityException>()
            .WithMessage("Sleeping accommodation capacity must be greater than 0. Provided: 0");
    }

    [Fact]
    public void UpdateDetails_WithValidData_ShouldUpdateAndAddEvent()
    {
        // Arrange
        var aggregate = SleepingAccommodationAggregate.Create(Guid.NewGuid(), "Original", AccommodationType.Room, 4);
        aggregate.ClearDomainEvents(); // Clear creation event

        // Act
        aggregate.UpdateDetails("Updated Room", AccommodationType.Tent, 2);

        // Assert
        aggregate.Name.Should().Be("Updated Room");
        aggregate.Type.Should().Be(AccommodationType.Tent);
        aggregate.MaxCapacity.Should().Be(2);
        aggregate.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));

        aggregate.DomainEvents.Should().HaveCount(1);
        var domainEvent = aggregate.DomainEvents.First();
        domainEvent.Should().BeOfType<SleepingAccommodationUpdatedEvent>();
        
        var updatedEvent = (SleepingAccommodationUpdatedEvent)domainEvent;
        updatedEvent.SleepingAccommodationId.Should().Be(aggregate.Id);
        updatedEvent.Name.Should().Be("Updated Room");
        updatedEvent.Type.Should().Be(AccommodationType.Tent);
        updatedEvent.MaxCapacity.Should().Be(2);
    }

    [Fact]
    public void UpdateDetails_WithSameData_ShouldNotAddEvent()
    {
        // Arrange
        var aggregate = SleepingAccommodationAggregate.Create(Guid.NewGuid(), "Test Room", AccommodationType.Room, 4);
        aggregate.ClearDomainEvents(); // Clear creation event

        // Act
        aggregate.UpdateDetails("Test Room", AccommodationType.Room, 4);

        // Assert
        aggregate.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void Deactivate_WhenActive_ShouldDeactivateAndAddEvent()
    {
        // Arrange
        var aggregate = SleepingAccommodationAggregate.Create(Guid.NewGuid(), "Test Room", AccommodationType.Room, 4);
        aggregate.ClearDomainEvents(); // Clear creation event

        // Act
        aggregate.Deactivate();

        // Assert
        aggregate.IsActive.Should().BeFalse();
        aggregate.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));

        aggregate.DomainEvents.Should().HaveCount(1);
        var domainEvent = aggregate.DomainEvents.First();
        domainEvent.Should().BeOfType<SleepingAccommodationDeactivatedEvent>();
        
        var deactivatedEvent = (SleepingAccommodationDeactivatedEvent)domainEvent;
        deactivatedEvent.SleepingAccommodationId.Should().Be(aggregate.Id);
    }

    [Fact]
    public void Deactivate_WhenAlreadyInactive_ShouldThrowAccommodationAlreadyDeactivatedException()
    {
        // Arrange
        var aggregate = SleepingAccommodationAggregate.Create(Guid.NewGuid(), "Test Room", AccommodationType.Room, 4);
        aggregate.Deactivate();

        // Act & Assert
        var act = () => aggregate.Deactivate();
        act.Should().Throw<AccommodationAlreadyDeactivatedException>()
            .WithMessage($"Sleeping accommodation {aggregate.Id} is already deactivated");
    }

    [Fact]
    public void Reactivate_WhenInactive_ShouldReactivateAndAddEvent()
    {
        // Arrange
        var aggregate = SleepingAccommodationAggregate.Create(Guid.NewGuid(), "Test Room", AccommodationType.Room, 4);
        aggregate.Deactivate();
        aggregate.ClearDomainEvents(); // Clear previous events

        // Act
        aggregate.Reactivate();

        // Assert
        aggregate.IsActive.Should().BeTrue();
        aggregate.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));

        aggregate.DomainEvents.Should().HaveCount(1);
        var domainEvent = aggregate.DomainEvents.First();
        domainEvent.Should().BeOfType<SleepingAccommodationReactivatedEvent>();
        
        var reactivatedEvent = (SleepingAccommodationReactivatedEvent)domainEvent;
        reactivatedEvent.SleepingAccommodationId.Should().Be(aggregate.Id);
    }

    [Fact]
    public void Reactivate_WhenAlreadyActive_ShouldThrowAccommodationAlreadyActivatedException()
    {
        // Arrange
        var aggregate = SleepingAccommodationAggregate.Create(Guid.NewGuid(), "Test Room", AccommodationType.Room, 4);

        // Act & Assert
        var act = () => aggregate.Reactivate();
        act.Should().Throw<AccommodationAlreadyActivatedException>()
            .WithMessage($"Sleeping accommodation {aggregate.Id} is already active");
    }

    [Fact]
    public void LoadFromHistory_WithEvents_ShouldReplayCorrectly()
    {
        // Arrange
        var aggregateId = Guid.NewGuid();
        var createdAt = DateTime.UtcNow.AddDays(-1);
        var updatedAt = DateTime.UtcNow.AddHours(-1);
        var deactivatedAt = DateTime.UtcNow.AddMinutes(-30);

        var events = new DomainEvent[]
        {
            new SleepingAccommodationCreatedEvent
            {
                Id = Guid.NewGuid(),
                OccurredAt = createdAt,
                SleepingAccommodationId = aggregateId,
                Name = "Test Room",
                Type = AccommodationType.Room,
                MaxCapacity = 4,
                IsActive = true
            },
            new SleepingAccommodationUpdatedEvent
            {
                Id = Guid.NewGuid(),
                OccurredAt = updatedAt,
                SleepingAccommodationId = aggregateId,
                Name = "Updated Room",
                Type = AccommodationType.Tent,
                MaxCapacity = 2
            },
            new SleepingAccommodationDeactivatedEvent
            {
                Id = Guid.NewGuid(),
                OccurredAt = deactivatedAt,
                SleepingAccommodationId = aggregateId
            }
        };

        // Act
        var aggregate = new SleepingAccommodationAggregate();
        aggregate.LoadFromHistory(events);

        // Assert
        aggregate.Id.Should().Be(aggregateId);
        aggregate.Name.Should().Be("Updated Room");
        aggregate.Type.Should().Be(AccommodationType.Tent);
        aggregate.MaxCapacity.Should().Be(2);
        aggregate.IsActive.Should().BeFalse();
        aggregate.CreatedAt.Should().Be(createdAt);
        aggregate.ChangedAt.Should().Be(deactivatedAt);
        aggregate.Version.Should().Be(2); // 3 events, version starts at -1
        aggregate.DomainEvents.Should().BeEmpty(); // No new events when loading from history
    }
}