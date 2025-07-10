using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Domain.Events.SleepingAccommodations;

public record SleepingAccommodationUpdatedEvent : DomainEvent, IAggregateEvent
{
    public override string EventType => "SleepingAccommodationUpdated";
    
    public Guid SleepingAccommodationId { get; init; }
    public string Name { get; init; } = string.Empty;
    public AccommodationType Type { get; init; }
    public int MaxCapacity { get; init; }
    
    public Guid GetAggregateId() => SleepingAccommodationId;
    public string GetAggregateType() => nameof(Aggregates.SleepingAccommodationAggregate);
}