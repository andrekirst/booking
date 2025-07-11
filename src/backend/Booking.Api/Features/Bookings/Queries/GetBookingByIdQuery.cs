using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;
using MediatR;
using System.Text.Json;
using Booking.Api.Domain.ValueObjects;

namespace Booking.Api.Features.Bookings.Queries;

public record GetBookingByIdQuery(Guid BookingId) : IRequest<BookingDto?>;

public class GetBookingByIdQueryHandler(
    BookingDbContext context,
    ILogger<GetBookingByIdQueryHandler> logger) 
    : IRequestHandler<GetBookingByIdQuery, BookingDto?>
{
    public async Task<BookingDto?> Handle(GetBookingByIdQuery request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Getting booking {BookingId}", request.BookingId);

        var booking = await context.BookingReadModels
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
        {
            logger.LogWarning("Booking {BookingId} not found", request.BookingId);
            return null;
        }

        return MapToDto(booking);
    }

    private static BookingDto MapToDto(BookingReadModel booking)
    {
        var bookingItems = JsonSerializer.Deserialize<List<BookingItem>>(booking.BookingItemsJson) ?? new();
        
        return new BookingDto(
            booking.Id,
            booking.UserId,
            booking.UserName,
            booking.UserEmail,
            booking.StartDate,
            booking.EndDate,
            booking.Status,
            booking.Notes,
            bookingItems.Select(bi => new BookingItemDto(
                bi.SleepingAccommodationId,
                string.Empty, // TODO: Include accommodation name from join
                bi.PersonCount
            )).ToList(),
            booking.TotalPersons,
            booking.NumberOfNights,
            booking.CreatedAt,
            booking.ChangedAt
        );
    }
}