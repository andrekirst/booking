using Booking.Api.Domain.Aggregates;
using Booking.Api.Services.EventSourcing;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record RejectBookingCommand(Guid BookingId) : IRequest<bool>;

public class RejectBookingCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    ILogger<RejectBookingCommandHandler> logger) 
    : IRequestHandler<RejectBookingCommand, bool>
{
    public async Task<bool> Handle(RejectBookingCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Rejecting booking {BookingId}", request.BookingId);

        var aggregate = await repository.GetByIdAsync(request.BookingId);
        if (aggregate == null)
        {
            logger.LogWarning("Booking {BookingId} not found", request.BookingId);
            return false;
        }

        aggregate.Reject();
        await repository.SaveAsync(aggregate);

        logger.LogInformation("Successfully rejected booking {BookingId}", request.BookingId);
        return true;
    }
}