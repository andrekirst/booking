using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.Bookings;

public record BookingNotesChangedEvent : DomainEvent, IAggregateEvent
{
    public Guid BookingId { get; init; }
    public string? PreviousNotes { get; init; }
    public string? NewNotes { get; init; }
    public string? ChangeReason { get; init; }
    
    public override string EventType => "BookingNotesChanged";
    public Guid GetAggregateId() => BookingId;
    public string GetAggregateType() => "BookingAggregate";
}