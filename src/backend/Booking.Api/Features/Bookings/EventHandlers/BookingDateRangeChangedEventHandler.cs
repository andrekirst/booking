using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Services.Projections;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using MediatR;

namespace Booking.Api.Features.Bookings.EventHandlers;

public class BookingDateRangeChangedEventHandler(
    IProjectionService<BookingAggregate, BookingReadModel> projectionService,
    ILogger<BookingDateRangeChangedEventHandler> logger)
    : INotificationHandler<BookingDateRangeChangedEvent>
{
    public async Task Handle(BookingDateRangeChangedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling BookingDateRangeChangedEvent for booking {BookingId}", notification.BookingId);
        
        try
        {
            await projectionService.ProjectAsync(notification.BookingId, cancellationToken: cancellationToken);
            logger.LogInformation("Successfully projected booking date range change {BookingId}", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to project booking date range change {BookingId}", notification.BookingId);
            throw;
        }
    }
}