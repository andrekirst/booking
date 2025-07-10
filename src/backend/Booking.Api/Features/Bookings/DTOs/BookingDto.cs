using Booking.Api.Domain.Enums;

namespace Booking.Api.Features.Bookings.DTOs;

public record BookingDto(
    Guid Id,
    int UserId,
    string UserName,
    string UserEmail,
    DateTime StartDate,
    DateTime EndDate,
    BookingStatus Status,
    string? Notes,
    List<BookingItemDto> BookingItems,
    int TotalPersons,
    int NumberOfNights,
    DateTime CreatedAt,
    DateTime? ChangedAt
);

public record BookingItemDto(
    Guid SleepingAccommodationId,
    string SleepingAccommodationName,
    int PersonCount
);

public record CreateBookingDto(
    DateTime StartDate,
    DateTime EndDate,
    string? Notes,
    List<CreateBookingItemDto> BookingItems
);

public record CreateBookingItemDto(
    Guid SleepingAccommodationId,
    int PersonCount
);

public record UpdateBookingDto(
    DateTime StartDate,
    DateTime EndDate,
    string? Notes,
    List<CreateBookingItemDto> BookingItems
);

public record BookingAvailabilityDto(
    DateTime StartDate,
    DateTime EndDate,
    List<SleepingAccommodationAvailabilityDto> Accommodations
);

public record SleepingAccommodationAvailabilityDto(
    Guid Id,
    string Name,
    int MaxCapacity,
    bool IsAvailable,
    int AvailableCapacity,
    List<ConflictingBookingDto> ConflictingBookings
);

public record ConflictingBookingDto(
    Guid BookingId,
    DateTime StartDate,
    DateTime EndDate,
    int PersonCount,
    string UserName
);