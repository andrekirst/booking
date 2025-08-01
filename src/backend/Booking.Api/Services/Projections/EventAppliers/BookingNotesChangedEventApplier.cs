using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingNotesChangedEventApplier : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingNotesChangedEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingNotesChangedEvent notesEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingNotesChangedEvent)}, got {domainEvent.GetType().Name}");
        }

        readModel.Notes = notesEvent.NewNotes;
        readModel.ChangedAt = notesEvent.OccurredAt;
    }
}