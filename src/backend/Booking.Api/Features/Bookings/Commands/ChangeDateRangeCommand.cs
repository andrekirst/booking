using Booking.Api.Application.Common;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Services.EventSourcing;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record ChangeDateRangeCommand(
    Guid BookingId, 
    DateTime NewStartDate, 
    DateTime NewEndDate,
    string? ChangeReason = null
) : IRequest<Result>;

public class ChangeDateRangeCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    ILogger<ChangeDateRangeCommandHandler> logger) 
    : IRequestHandler<ChangeDateRangeCommand, Result>
{
    public async Task<Result> Handle(ChangeDateRangeCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Changing date range for booking {BookingId} from {NewStartDate} to {NewEndDate}",
            request.BookingId, request.NewStartDate, request.NewEndDate);

        try
        {
            var aggregate = await repository.GetByIdAsync(request.BookingId);
            if (aggregate == null)
            {
                logger.LogWarning("Booking {BookingId} not found", request.BookingId);
                return Result.Fail($"Booking {request.BookingId} not found");
            }

            aggregate.ChangeDateRange(request.NewStartDate, request.NewEndDate, request.ChangeReason);
            await repository.SaveAsync(aggregate);

            logger.LogInformation("Successfully changed date range for booking {BookingId}", request.BookingId);
            return Result.Ok("Date range changed successfully");
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Invalid argument when changing date range for booking {BookingId}", request.BookingId);
            return Result.Fail(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Invalid operation when changing date range for booking {BookingId}", request.BookingId);
            return Result.Fail(ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error when changing date range for booking {BookingId}", request.BookingId);
            return Result.Fail("An unexpected error occurred while changing the date range");
        }
    }
}