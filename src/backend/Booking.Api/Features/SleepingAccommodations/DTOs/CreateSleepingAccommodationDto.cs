using System.ComponentModel.DataAnnotations;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Features.SleepingAccommodations.DTOs;

public record CreateSleepingAccommodationDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public required string Name { get; init; }
    
    [Required]
    public AccommodationType Type { get; init; }
    
    [Required]
    [Range(1, 100)]
    public int MaxCapacity { get; init; }
}