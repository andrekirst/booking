using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Services.EventSourcing;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record UpdateBookingCommand(Guid BookingId, UpdateBookingDto BookingDto) : IRequest<BookingDto?>;

public class UpdateBookingCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    ILogger<UpdateBookingCommandHandler> logger) 
    : IRequestHandler<UpdateBookingCommand, BookingDto?>
{
    public async Task<BookingDto?> Handle(UpdateBookingCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Updating booking {BookingId}", request.BookingId);

        var aggregate = await repository.GetByIdAsync(request.BookingId);
        if (aggregate == null)
        {
            logger.LogWarning("Booking {BookingId} not found", request.BookingId);
            return null;
        }

        var bookingItems = request.BookingDto.BookingItems
            .Select(dto => new BookingItem(dto.SleepingAccommodationId, dto.PersonCount))
            .ToList();

        aggregate.Update(
            request.BookingDto.StartDate,
            request.BookingDto.EndDate,
            bookingItems,
            request.BookingDto.Notes
        );

        await repository.SaveAsync(aggregate);

        logger.LogInformation("Successfully updated booking {BookingId}", request.BookingId);

        // Return a basic DTO - in a real implementation, you'd query the read model
        return new BookingDto(
            request.BookingId,
            aggregate.UserId,
            string.Empty, // Will be populated by read model projection
            string.Empty, // Will be populated by read model projection
            request.BookingDto.StartDate,
            request.BookingDto.EndDate,
            aggregate.Status,
            request.BookingDto.Notes,
            request.BookingDto.BookingItems.Select(bi => new BookingItemDto(
                bi.SleepingAccommodationId,
                string.Empty, // Will be populated by read model projection
                bi.PersonCount
            )).ToList(),
            request.BookingDto.BookingItems.Sum(bi => bi.PersonCount),
            (request.BookingDto.EndDate - request.BookingDto.StartDate).Days,
            DateTime.UtcNow,
            DateTime.UtcNow
        );
    }
}