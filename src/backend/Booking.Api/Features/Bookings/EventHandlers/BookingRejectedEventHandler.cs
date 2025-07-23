using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Services.Projections;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using MediatR;

namespace Booking.Api.Features.Bookings.EventHandlers;

public class BookingRejectedEventHandler(
    IProjectionService<BookingAggregate, BookingReadModel> projectionService,
    ILogger<BookingRejectedEventHandler> logger) 
    : INotificationHandler<BookingRejectedEvent>
{
    public async Task Handle(BookingRejectedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling BookingRejectedEvent for booking {BookingId}", notification.BookingId);
        
        try
        {
            await projectionService.ProjectAsync(notification.BookingId, cancellationToken: cancellationToken);
            logger.LogInformation("Successfully projected booking {BookingId} after rejection", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to project booking {BookingId} after rejection", notification.BookingId);
            throw;
        }
    }
}