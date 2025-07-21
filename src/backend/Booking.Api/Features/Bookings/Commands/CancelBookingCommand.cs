using Booking.Api.Domain.Aggregates;
using Booking.Api.Services.EventSourcing;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record CancelBookingCommand(Guid BookingId) : IRequest<bool>;

public class CancelBookingCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    ILogger<CancelBookingCommandHandler> logger) 
    : IRequestHandler<CancelBookingCommand, bool>
{
    public async Task<bool> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Cancelling booking {BookingId}", request.BookingId);

        var aggregate = await repository.GetByIdAsync(request.BookingId);
        if (aggregate == null)
        {
            logger.LogWarning("Booking {BookingId} not found", request.BookingId);
            return false;
        }

        aggregate.Cancel();
        await repository.SaveAsync(aggregate);

        logger.LogInformation("Successfully cancelled booking {BookingId}", request.BookingId);
        return true;
    }
}