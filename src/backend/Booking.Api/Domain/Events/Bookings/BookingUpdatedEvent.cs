using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ValueObjects;

namespace Booking.Api.Domain.Events.Bookings;

public record BookingUpdatedEvent : DomainEvent, IAggregateEvent
{
    public Guid BookingId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Notes { get; set; }
    public List<BookingItem> BookingItems { get; set; } = new();

    public override string EventType => "BookingUpdated";

    public Guid GetAggregateId() => BookingId;

    public string GetAggregateType() => "BookingAggregate";
}