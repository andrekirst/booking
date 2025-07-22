using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.Bookings;

public record BookingRejectedEvent : DomainEvent, IAggregateEvent
{
    public Guid BookingId { get; set; }

    public override string EventType => "BookingRejected";

    public Guid GetAggregateId() => BookingId;

    public string GetAggregateType() => "BookingAggregate";
}