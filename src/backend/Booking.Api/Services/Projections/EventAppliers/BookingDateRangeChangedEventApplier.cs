using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingDateRangeChangedEventApplier : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingDateRangeChangedEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingDateRangeChangedEvent dateEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingDateRangeChangedEvent)}, got {domainEvent.GetType().Name}");
        }

        readModel.StartDate = dateEvent.NewStartDate;
        readModel.EndDate = dateEvent.NewEndDate;
        readModel.ChangedAt = dateEvent.OccurredAt;
    }
}