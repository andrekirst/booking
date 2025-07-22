using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingRejectedEventApplier : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingRejectedEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingRejectedEvent bookingEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingRejectedEvent)}, got {domainEvent.GetType().Name}");
        }

        readModel.Status = BookingStatus.Rejected;
        readModel.ChangedAt = bookingEvent.OccurredAt;
    }
}