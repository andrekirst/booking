using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.Bookings;

public record BookingAcceptedEvent : DomainEvent, IAggregateEvent
{
    public Guid BookingId { get; set; }

    public override string EventType => "BookingAccepted";

    public Guid GetAggregateId() => BookingId;

    public string GetAggregateType() => "BookingAggregate";
}