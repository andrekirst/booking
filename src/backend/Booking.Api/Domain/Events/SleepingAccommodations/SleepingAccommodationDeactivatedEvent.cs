using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.SleepingAccommodations;

public record SleepingAccommodationDeactivatedEvent : DomainEvent
{
    public override string EventType => "SleepingAccommodationDeactivated";
    
    public Guid SleepingAccommodationId { get; init; }
}