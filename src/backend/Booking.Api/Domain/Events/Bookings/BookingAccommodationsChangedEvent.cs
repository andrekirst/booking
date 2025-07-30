using Booking.Api.Domain.Common;
using Booking.Api.Domain.ValueObjects;

namespace Booking.Api.Domain.Events.Bookings;

public record BookingAccommodationsChangedEvent : DomainEvent, IAggregateEvent
{
    public Guid BookingId { get; init; }
    public List<AccommodationChange> AccommodationChanges { get; init; } = new();
    public int PreviousTotalPersons { get; init; }
    public int NewTotalPersons { get; init; }
    public string? ChangeReason { get; init; }
    
    public override string EventType => "BookingAccommodationsChanged";
    public Guid GetAggregateId() => BookingId;
    public string GetAggregateType() => "BookingAggregate";
}