using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using System.Text.Json;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingUpdatedEventApplier : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingUpdatedEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingUpdatedEvent bookingEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingUpdatedEvent)}, got {domainEvent.GetType().Name}");
        }

        readModel.StartDate = bookingEvent.StartDate;
        readModel.EndDate = bookingEvent.EndDate;
        readModel.Notes = bookingEvent.Notes;
        readModel.ChangedAt = bookingEvent.OccurredAt;
        readModel.BookingItemsJson = JsonSerializer.Serialize(bookingEvent.BookingItems);
        readModel.TotalPersons = bookingEvent.BookingItems.Sum(bi => bi.PersonCount);
    }
}