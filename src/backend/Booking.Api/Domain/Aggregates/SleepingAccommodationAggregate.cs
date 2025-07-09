using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.SleepingAccommodations;

namespace Booking.Api.Domain.Aggregates;

public class SleepingAccommodationAggregate : AggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public AccommodationType Type { get; private set; }
    public int MaxCapacity { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; }
    public DateTime? ChangedAt { get; private set; }

    // Parameterless constructor for event sourcing
    public SleepingAccommodationAggregate() { }

    // Factory method for creating new sleeping accommodations
    public static SleepingAccommodationAggregate Create(Guid id, string name, AccommodationType type, int maxCapacity)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty", nameof(name));
        
        if (maxCapacity <= 0)
            throw new ArgumentException("Max capacity must be greater than 0", nameof(maxCapacity));

        var aggregate = new SleepingAccommodationAggregate();
        
        var createdEvent = new SleepingAccommodationCreatedEvent
        {
            SleepingAccommodationId = id,
            Name = name,
            Type = type,
            MaxCapacity = maxCapacity,
            IsActive = true
        };

        aggregate.ApplyEvent(createdEvent);
        return aggregate;
    }

    public void UpdateDetails(string name, AccommodationType type, int maxCapacity)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty", nameof(name));
        
        if (maxCapacity <= 0)
            throw new ArgumentException("Max capacity must be greater than 0", nameof(maxCapacity));

        // Only create event if something actually changed
        if (Name != name || Type != type || MaxCapacity != maxCapacity)
        {
            var updatedEvent = new SleepingAccommodationUpdatedEvent
            {
                SleepingAccommodationId = Id,
                Name = name,
                Type = type,
                MaxCapacity = maxCapacity
            };

            ApplyEvent(updatedEvent);
        }
    }

    public void Deactivate()
    {
        if (!IsActive)
            throw new InvalidOperationException("Sleeping accommodation is already deactivated");

        var deactivatedEvent = new SleepingAccommodationDeactivatedEvent
        {
            SleepingAccommodationId = Id
        };

        ApplyEvent(deactivatedEvent);
    }

    public void Reactivate()
    {
        if (IsActive)
            throw new InvalidOperationException("Sleeping accommodation is already active");

        var reactivatedEvent = new SleepingAccommodationReactivatedEvent
        {
            SleepingAccommodationId = Id
        };

        ApplyEvent(reactivatedEvent);
    }

    protected override void Apply(DomainEvent domainEvent)
    {
        switch (domainEvent)
        {
            case SleepingAccommodationCreatedEvent created:
                ApplyCreatedEvent(created);
                break;
            case SleepingAccommodationUpdatedEvent updated:
                ApplyUpdatedEvent(updated);
                break;
            case SleepingAccommodationDeactivatedEvent deactivated:
                ApplyDeactivatedEvent(deactivated);
                break;
            case SleepingAccommodationReactivatedEvent reactivated:
                ApplyReactivatedEvent(reactivated);
                break;
            default:
                throw new InvalidOperationException($"Unknown event type: {domainEvent.GetType().Name}");
        }
    }

    private void ApplyCreatedEvent(SleepingAccommodationCreatedEvent created)
    {
        Id = created.SleepingAccommodationId;
        Name = created.Name;
        Type = created.Type;
        MaxCapacity = created.MaxCapacity;
        IsActive = created.IsActive;
        CreatedAt = created.OccurredAt;
    }

    private void ApplyUpdatedEvent(SleepingAccommodationUpdatedEvent updated)
    {
        Name = updated.Name;
        Type = updated.Type;
        MaxCapacity = updated.MaxCapacity;
        ChangedAt = updated.OccurredAt;
    }

    private void ApplyDeactivatedEvent(SleepingAccommodationDeactivatedEvent deactivated)
    {
        IsActive = false;
        ChangedAt = deactivated.OccurredAt;
    }

    private void ApplyReactivatedEvent(SleepingAccommodationReactivatedEvent reactivated)
    {
        IsActive = true;
        ChangedAt = reactivated.OccurredAt;
    }
}