using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.Bookings;

public record BookingCancelledEvent : DomainEvent, IAggregateEvent
{
    public Guid BookingId { get; set; }

    public override string EventType => "BookingCancelled";

    public Guid GetAggregateId() => BookingId;

    public string GetAggregateType() => "BookingAggregate";
}