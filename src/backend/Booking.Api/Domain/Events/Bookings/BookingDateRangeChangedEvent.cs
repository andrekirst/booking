using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Events.Bookings;

public record BookingDateRangeChangedEvent : DomainEvent, IAggregateEvent
{
    public Guid BookingId { get; init; }
    public DateTime PreviousStartDate { get; init; }
    public DateTime PreviousEndDate { get; init; }
    public DateTime NewStartDate { get; init; }
    public DateTime NewEndDate { get; init; }
    public int PreviousNights { get; init; }
    public int NewNights { get; init; }
    public string? ChangeReason { get; init; }
    
    public override string EventType => "BookingDateRangeChanged";
    public Guid GetAggregateId() => BookingId;
    public string GetAggregateType() => "BookingAggregate";
}