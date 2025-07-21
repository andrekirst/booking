using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.Bookings;

public record BookingConfirmedEvent : DomainEvent, IAggregateEvent
{
    public Guid BookingId { get; set; }

    public override string EventType => "BookingConfirmed";

    public Guid GetAggregateId() => BookingId;

    public string GetAggregateType() => "BookingAggregate";
}