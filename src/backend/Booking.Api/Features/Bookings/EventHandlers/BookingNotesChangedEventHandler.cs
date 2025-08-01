using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Services.Projections;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using MediatR;

namespace Booking.Api.Features.Bookings.EventHandlers;

public class BookingNotesChangedEventHandler(
    IProjectionService<BookingAggregate, BookingReadModel> projectionService,
    ILogger<BookingNotesChangedEventHandler> logger)
    : INotificationHandler<BookingNotesChangedEvent>
{
    public async Task Handle(BookingNotesChangedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling BookingNotesChangedEvent for booking {BookingId}", notification.BookingId);
        
        try
        {
            await projectionService.ProjectAsync(notification.BookingId, cancellationToken: cancellationToken);
            logger.LogInformation("Successfully projected booking notes change {BookingId}", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to project booking notes change {BookingId}", notification.BookingId);
            throw;
        }
    }
}