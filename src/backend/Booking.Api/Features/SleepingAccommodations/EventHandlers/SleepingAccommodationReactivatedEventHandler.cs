using Booking.Api.Data;
using Booking.Api.Domain.Events.SleepingAccommodations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationReactivatedEventHandler : INotificationHandler<SleepingAccommodationReactivatedEvent>
{
    private readonly BookingDbContext _context;

    public SleepingAccommodationReactivatedEventHandler(BookingDbContext context)
    {
        _context = context;
    }

    public async Task Handle(SleepingAccommodationReactivatedEvent notification, CancellationToken cancellationToken)
    {
        var readModel = await _context.SleepingAccommodationReadModels
            .FirstOrDefaultAsync(s => s.Id == notification.SleepingAccommodationId, cancellationToken);

        if (readModel != null)
        {
            readModel.IsActive = true;
            readModel.ChangedAt = notification.OccurredAt;
            readModel.LastEventVersion++;

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}