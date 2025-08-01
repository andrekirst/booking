namespace Booking.Api.Features.Bookings.DTOs;

public record BookingActivityDto(
    string ActivityType,
    string Description,
    DateTime Timestamp,
    string? UserName,
    Dictionary<string, object>? Metadata
);