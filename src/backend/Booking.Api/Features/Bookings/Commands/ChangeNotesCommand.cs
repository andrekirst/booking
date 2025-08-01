using Booking.Api.Application.Common;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Services.EventSourcing;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record ChangeNotesCommand(
    Guid BookingId,
    string? NewNotes
) : IRequest<Result>;

public class ChangeNotesCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    ILogger<ChangeNotesCommandHandler> logger) 
    : IRequestHandler<ChangeNotesCommand, Result>
{
    public async Task<Result> Handle(ChangeNotesCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Changing notes for booking {BookingId}", request.BookingId);

        try
        {
            var aggregate = await repository.GetByIdAsync(request.BookingId);
            if (aggregate == null)
            {
                logger.LogWarning("Booking {BookingId} not found", request.BookingId);
                return Result.Fail($"Booking {request.BookingId} not found");
            }

            aggregate.ChangeNotes(request.NewNotes);
            await repository.SaveAsync(aggregate);

            logger.LogInformation("Successfully changed notes for booking {BookingId}", request.BookingId);
            return Result.Ok("Notes changed successfully");
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Invalid argument when changing notes for booking {BookingId}", request.BookingId);
            return Result.Fail(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Invalid operation when changing notes for booking {BookingId}", request.BookingId);
            return Result.Fail(ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error when changing notes for booking {BookingId}", request.BookingId);
            return Result.Fail("An unexpected error occurred while changing notes");
        }
    }
}