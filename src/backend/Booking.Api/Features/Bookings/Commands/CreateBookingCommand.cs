using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Services.EventSourcing;
using Booking.Api.Services.Projections;
using MediatR;

namespace Booking.Api.Features.Bookings.Commands;

public record CreateBookingCommand(int UserId, CreateBookingDto BookingDto) : IRequest<BookingDto>;

public class CreateBookingCommandHandler(
    IEventSourcedRepository<BookingAggregate> repository,
    IProjectionService<BookingAggregate, BookingReadModel> projectionService,
    ILogger<CreateBookingCommandHandler> logger) 
    : IRequestHandler<CreateBookingCommand, BookingDto>
{
    public async Task<BookingDto> Handle(CreateBookingCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating booking for user {UserId} from {StartDate} to {EndDate}",
            request.UserId, request.BookingDto.StartDate, request.BookingDto.EndDate);

        var bookingId = Guid.NewGuid();
        
        var bookingItems = request.BookingDto.BookingItems
            .Select(dto => new BookingItem(dto.SleepingAccommodationId, dto.PersonCount))
            .ToList();

        var aggregate = BookingAggregate.Create(
            bookingId,
            request.UserId,
            request.BookingDto.StartDate,
            request.BookingDto.EndDate,
            bookingItems,
            request.BookingDto.Notes
        );

        await repository.SaveAsync(aggregate);

        logger.LogInformation("Successfully created booking {BookingId}", bookingId);
        
        // TEMPORARY: Manually trigger projection until event handlers are working
        logger.LogInformation("TEMPORARY: Manually triggering projection for booking {BookingId}", bookingId);
        try
        {
            await projectionService.ProjectAsync(bookingId, 0, cancellationToken);
            logger.LogInformation("TEMPORARY: Successfully projected booking {BookingId}", bookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "TEMPORARY: Failed to project booking {BookingId}", bookingId);
            // Don't fail the command if projection fails
        }

        // Return a basic DTO - in a real implementation, you'd query the read model
        return new BookingDto(
            bookingId,
            request.UserId,
            string.Empty, // Will be populated by read model projection
            string.Empty, // Will be populated by read model projection
            request.BookingDto.StartDate,
            request.BookingDto.EndDate,
            Domain.Enums.BookingStatus.Pending,
            request.BookingDto.Notes,
            request.BookingDto.BookingItems.Select(bi => new BookingItemDto(
                bi.SleepingAccommodationId,
                string.Empty, // Will be populated by read model projection
                bi.PersonCount
            )).ToList(),
            request.BookingDto.BookingItems.Sum(bi => bi.PersonCount),
            (request.BookingDto.EndDate - request.BookingDto.StartDate).Days,
            DateTime.UtcNow,
            null
        );
    }
}