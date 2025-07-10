using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.SleepingAccommodations;

public record SleepingAccommodationReactivatedEvent : DomainEvent, IAggregateEvent
{
    public override string EventType => "SleepingAccommodationReactivated";
    
    public Guid SleepingAccommodationId { get; init; }
    
    public Guid GetAggregateId() => SleepingAccommodationId;
    public string GetAggregateType() => nameof(Aggregates.SleepingAccommodationAggregate);
}