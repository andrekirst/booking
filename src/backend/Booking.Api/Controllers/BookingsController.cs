using Booking.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Controllers;

[Authorize]
public class BookingsController(BookingDbContext context) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<BookingsResponse>> GetBookings()
    {
        var bookings = await context.Bookings
            .AsNoTracking()
            .OrderByDescending(b => b.CreatedAt)
            .Take(100) // Limit for performance
            .Select(b => new BookingDto(
                b.Id,
                b.CreatedAt,
                b.ChangedAt
            ))
            .ToListAsync();

        return Ok(new BookingsResponse(bookings, bookings.Count));
    }
}

public record BookingDto(Guid Id, DateTime CreatedAt, DateTime? ChangedAt);
public record BookingsResponse(IEnumerable<BookingDto> Bookings, int Count);