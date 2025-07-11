using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingCancelledEventApplier : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingCancelledEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingCancelledEvent bookingEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingCancelledEvent)}, got {domainEvent.GetType().Name}");
        }

        readModel.Status = BookingStatus.Cancelled;
        readModel.ChangedAt = bookingEvent.OccurredAt;
    }
}