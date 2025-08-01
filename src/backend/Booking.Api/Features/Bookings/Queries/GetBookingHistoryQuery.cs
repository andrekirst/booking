using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Features.Bookings.DTOs;

namespace Booking.Api.Features.Bookings.Queries;

public record GetBookingHistoryQuery(
    Guid BookingId,
    int Page = 1,
    int PageSize = 20
) : IQuery<BookingHistoryDto>;