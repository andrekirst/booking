using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Domain.Events.SleepingAccommodations;

public record SleepingAccommodationCreatedEvent : DomainEvent
{
    public override string EventType => "SleepingAccommodationCreated";
    
    public Guid SleepingAccommodationId { get; init; }
    public string Name { get; init; } = string.Empty;
    public AccommodationType Type { get; init; }
    public int MaxCapacity { get; init; }
    public bool IsActive { get; init; }
}