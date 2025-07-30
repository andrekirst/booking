using Booking.Api.Application.Common;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Services.EventSourcing;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record ChangeAccommodationsCommand(
    Guid BookingId,
    List<BookingItemDto> NewBookingItems
) : IRequest<Result>;

public class ChangeAccommodationsCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    ILogger<ChangeAccommodationsCommandHandler> logger) 
    : IRequestHandler<ChangeAccommodationsCommand, Result>
{
    public async Task<Result> Handle(ChangeAccommodationsCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Changing accommodations for booking {BookingId} with {ItemCount} items",
            request.BookingId, request.NewBookingItems.Count);

        try
        {
            var aggregate = await repository.GetByIdAsync(request.BookingId);
            if (aggregate == null)
            {
                logger.LogWarning("Booking {BookingId} not found", request.BookingId);
                return Result.Fail($"Booking {request.BookingId} not found");
            }

            // Convert DTOs to domain objects
            var bookingItems = request.NewBookingItems
                .Select(dto => new BookingItem(dto.SleepingAccommodationId, dto.PersonCount))
                .ToList();

            aggregate.ChangeAccommodations(bookingItems);
            await repository.SaveAsync(aggregate);

            logger.LogInformation("Successfully changed accommodations for booking {BookingId}", request.BookingId);
            return Result.Ok("Accommodations changed successfully");
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Invalid argument when changing accommodations for booking {BookingId}", request.BookingId);
            return Result.Fail(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Invalid operation when changing accommodations for booking {BookingId}", request.BookingId);
            return Result.Fail(ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error when changing accommodations for booking {BookingId}", request.BookingId);
            return Result.Fail("An unexpected error occurred while changing accommodations");
        }
    }
}