using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Services.Projections;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using MediatR;

namespace Booking.Api.Features.Bookings.EventHandlers;

public class BookingUpdatedEventHandler(
    IProjectionService<BookingAggregate, BookingReadModel> projectionService,
    ILogger<BookingUpdatedEventHandler> logger) 
    : INotificationHandler<BookingUpdatedEvent>
{
    public async Task Handle(BookingUpdatedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling BookingUpdatedEvent for booking {BookingId}", notification.BookingId);
        
        try
        {
            await projectionService.ProjectAsync(notification.BookingId, cancellationToken: cancellationToken);
            logger.LogInformation("Successfully projected booking {BookingId}", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to project booking {BookingId}", notification.BookingId);
            throw;
        }
    }
}