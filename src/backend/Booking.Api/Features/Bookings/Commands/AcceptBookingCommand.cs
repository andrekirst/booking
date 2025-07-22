using Booking.Api.Domain.Aggregates;
using Booking.Api.Services.EventSourcing;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record AcceptBookingCommand(Guid BookingId) : IRequest<bool>;

public class AcceptBookingCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    ILogger<AcceptBookingCommandHandler> logger) 
    : IRequestHandler<AcceptBookingCommand, bool>
{
    public async Task<bool> Handle(AcceptBookingCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Accepting booking {BookingId}", request.BookingId);

        var aggregate = await repository.GetByIdAsync(request.BookingId);
        if (aggregate == null)
        {
            logger.LogWarning("Booking {BookingId} not found", request.BookingId);
            return false;
        }

        aggregate.Accept();
        await repository.SaveAsync(aggregate);

        logger.LogInformation("Successfully accepted booking {BookingId}", request.BookingId);
        return true;
    }
}