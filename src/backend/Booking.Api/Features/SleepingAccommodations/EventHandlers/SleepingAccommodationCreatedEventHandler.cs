using Booking.Api.Data;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationCreatedEventHandler : INotificationHandler<SleepingAccommodationCreatedEvent>
{
    private readonly BookingDbContext _context;

    public SleepingAccommodationCreatedEventHandler(BookingDbContext context)
    {
        _context = context;
    }

    public async Task Handle(SleepingAccommodationCreatedEvent notification, CancellationToken cancellationToken)
    {
        var readModel = new SleepingAccommodationReadModel
        {
            Id = notification.SleepingAccommodationId,
            Name = notification.Name,
            Type = notification.Type,
            MaxCapacity = notification.MaxCapacity,
            IsActive = notification.IsActive,
            CreatedAt = notification.OccurredAt,
            LastEventVersion = 0 // First event
        };

        _context.SleepingAccommodationReadModels.Add(readModel);
        await _context.SaveChangesAsync(cancellationToken);
    }
}