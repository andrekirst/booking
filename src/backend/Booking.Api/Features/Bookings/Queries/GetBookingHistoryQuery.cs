using Booking.Api.Features.Bookings.DTOs;
using MediatR;

namespace Booking.Api.Features.Bookings.Queries;

public record GetBookingHistoryQuery(Guid BookingId) : IRequest<List<BookingActivityDto>>;