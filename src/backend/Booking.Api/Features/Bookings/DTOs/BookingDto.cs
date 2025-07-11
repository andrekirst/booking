using System.ComponentModel.DataAnnotations;
using Booking.Api.Attributes;
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

[DateRangeValidation(
    StartDatePropertyName = nameof(StartDate),
    EndDatePropertyName = nameof(EndDate),
    AllowSameDay = false,  // Overnight stays require at least 1 night
    AllowToday = true
)]
[AvailabilityValidation(
    StartDatePropertyName = nameof(StartDate),
    EndDatePropertyName = nameof(EndDate),
    BookingItemsPropertyName = nameof(BookingItems)
)]
public record CreateBookingDto(
    [FutureDate(AllowToday = true)]
    [Display(Name = "Anreisedatum")]
    DateTime StartDate,
    
    [FutureDate(AllowToday = true)]
    [Display(Name = "Abreisedatum")]
    DateTime EndDate,
    
    [StringLength(500, ErrorMessage = "Notizen dürfen maximal 500 Zeichen lang sein")]
    [Display(Name = "Notizen")]
    string? Notes,
    
    [Required(ErrorMessage = "Mindestens eine Schlafmöglichkeit muss ausgewählt werden")]
    [MinLength(1, ErrorMessage = "Mindestens eine Schlafmöglichkeit muss ausgewählt werden")]
    [Display(Name = "Schlafmöglichkeiten")]
    List<CreateBookingItemDto> BookingItems
);

public record CreateBookingItemDto(
    [Required(ErrorMessage = "Schlafmöglichkeit muss ausgewählt werden")]
    [Display(Name = "Schlafmöglichkeit")]
    Guid SleepingAccommodationId,
    
    [Required(ErrorMessage = "Personenanzahl ist erforderlich")]
    [Range(1, 20, ErrorMessage = "Personenanzahl muss zwischen 1 und 20 liegen")]
    [Display(Name = "Personenanzahl")]
    int PersonCount
);

[DateRangeValidation(
    StartDatePropertyName = nameof(StartDate),
    EndDatePropertyName = nameof(EndDate),
    AllowSameDay = false,
    AllowToday = true
)]
[AvailabilityValidation(
    StartDatePropertyName = nameof(StartDate),
    EndDatePropertyName = nameof(EndDate),
    BookingItemsPropertyName = nameof(BookingItems)
)]
public record UpdateBookingDto(
    [FutureDate(AllowToday = true)]
    [Display(Name = "Anreisedatum")]
    DateTime StartDate,
    
    [FutureDate(AllowToday = true)]
    [Display(Name = "Abreisedatum")]
    DateTime EndDate,
    
    [StringLength(500, ErrorMessage = "Notizen dürfen maximal 500 Zeichen lang sein")]
    [Display(Name = "Notizen")]
    string? Notes,
    
    [Required(ErrorMessage = "Mindestens eine Schlafmöglichkeit muss ausgewählt werden")]
    [MinLength(1, ErrorMessage = "Mindestens eine Schlafmöglichkeit muss ausgewählt werden")]
    [Display(Name = "Schlafmöglichkeiten")]
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