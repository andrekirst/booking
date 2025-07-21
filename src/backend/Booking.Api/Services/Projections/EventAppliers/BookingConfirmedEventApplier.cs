using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingConfirmedEventApplier : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingConfirmedEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingConfirmedEvent bookingEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingConfirmedEvent)}, got {domainEvent.GetType().Name}");
        }

        readModel.Status = BookingStatus.Confirmed;
        readModel.ChangedAt = bookingEvent.OccurredAt;
    }
}