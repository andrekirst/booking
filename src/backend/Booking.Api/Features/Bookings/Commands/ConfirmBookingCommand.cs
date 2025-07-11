using Booking.Api.Domain.Aggregates;
using Booking.Api.Services.EventSourcing;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record ConfirmBookingCommand(Guid BookingId) : IRequest<bool>;

public class ConfirmBookingCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    ILogger<ConfirmBookingCommandHandler> logger) 
    : IRequestHandler<ConfirmBookingCommand, bool>
{
    public async Task<bool> Handle(ConfirmBookingCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Confirming booking {BookingId}", request.BookingId);

        var aggregate = await repository.GetByIdAsync(request.BookingId);
        if (aggregate == null)
        {
            logger.LogWarning("Booking {BookingId} not found", request.BookingId);
            return false;
        }

        aggregate.Confirm();
        await repository.SaveAsync(aggregate);

        logger.LogInformation("Successfully confirmed booking {BookingId}", request.BookingId);
        return true;
    }
}