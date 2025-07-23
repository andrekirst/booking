using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Services.Projections;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using MediatR;

namespace Booking.Api.Features.Bookings.EventHandlers;

public class BookingAcceptedEventHandler(
    IProjectionService<BookingAggregate, BookingReadModel> projectionService,
    ILogger<BookingAcceptedEventHandler> logger) 
    : INotificationHandler<BookingAcceptedEvent>
{
    public async Task Handle(BookingAcceptedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling BookingAcceptedEvent for booking {BookingId}", notification.BookingId);
        
        try
        {
            await projectionService.ProjectAsync(notification.BookingId, cancellationToken: cancellationToken);
            logger.LogInformation("Successfully projected booking {BookingId} after acceptance", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to project booking {BookingId} after acceptance", notification.BookingId);
            throw;
        }
    }
}