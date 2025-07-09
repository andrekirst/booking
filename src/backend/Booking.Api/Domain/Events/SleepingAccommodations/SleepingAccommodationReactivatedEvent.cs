using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.SleepingAccommodations;

public record SleepingAccommodationReactivatedEvent : DomainEvent
{
    public override string EventType => "SleepingAccommodationReactivated";
    
    public Guid SleepingAccommodationId { get; init; }
}