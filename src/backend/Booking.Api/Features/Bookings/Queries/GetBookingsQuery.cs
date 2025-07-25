using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;
using MediatR;
using System.Text.Json;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Features.Bookings.Queries;

public record GetBookingsQuery(
    int? UserId = null,
    BookingStatus? Status = null
) : IRequest<List<BookingDto>>;

public class GetBookingsQueryHandler(
    BookingDbContext context,
    ILogger<GetBookingsQueryHandler> logger) 
    : IRequestHandler<GetBookingsQuery, List<BookingDto>>
{
    public async Task<List<BookingDto>> Handle(GetBookingsQuery request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Getting bookings for user {UserId} with status filter {Status}", request.UserId, request.Status);

        var query = context.BookingReadModels.AsQueryable();

        if (request.UserId.HasValue)
        {
            query = query.Where(b => b.UserId == request.UserId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(b => b.Status == request.Status.Value);
        }

        var bookings = await query
            .OrderBy(b => b.StartDate)
            .ToListAsync(cancellationToken);

        return bookings.Select(MapToDto).ToList();
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