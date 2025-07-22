using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingAcceptedEventApplier : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingAcceptedEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingAcceptedEvent bookingEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingAcceptedEvent)}, got {domainEvent.GetType().Name}");
        }

        readModel.Status = BookingStatus.Accepted;
        readModel.ChangedAt = bookingEvent.OccurredAt;
    }
}