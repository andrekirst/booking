using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Services.Projections;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using MediatR;

namespace Booking.Api.Features.Bookings.EventHandlers;

public class BookingAccommodationsChangedEventHandler(
    IProjectionService<BookingAggregate, BookingReadModel> projectionService,
    ILogger<BookingAccommodationsChangedEventHandler> logger)
    : INotificationHandler<BookingAccommodationsChangedEvent>
{
    public async Task Handle(BookingAccommodationsChangedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling BookingAccommodationsChangedEvent for booking {BookingId}", notification.BookingId);
        
        try
        {
            await projectionService.ProjectAsync(notification.BookingId, cancellationToken: cancellationToken);
            logger.LogInformation("Successfully projected booking accommodations change {BookingId}", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to project booking accommodations change {BookingId}", notification.BookingId);
            throw;
        }
    }
}