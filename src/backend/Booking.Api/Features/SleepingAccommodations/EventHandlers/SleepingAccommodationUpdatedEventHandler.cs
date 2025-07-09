using Booking.Api.Data;
using Booking.Api.Domain.Events.SleepingAccommodations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationUpdatedEventHandler : INotificationHandler<SleepingAccommodationUpdatedEvent>
{
    private readonly BookingDbContext _context;

    public SleepingAccommodationUpdatedEventHandler(BookingDbContext context)
    {
        _context = context;
    }

    public async Task Handle(SleepingAccommodationUpdatedEvent notification, CancellationToken cancellationToken)
    {
        var readModel = await _context.SleepingAccommodationReadModels
            .FirstOrDefaultAsync(s => s.Id == notification.SleepingAccommodationId, cancellationToken);

        if (readModel != null)
        {
            readModel.Name = notification.Name;
            readModel.Type = notification.Type;
            readModel.MaxCapacity = notification.MaxCapacity;
            readModel.ChangedAt = notification.OccurredAt;
            readModel.LastEventVersion++;

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}