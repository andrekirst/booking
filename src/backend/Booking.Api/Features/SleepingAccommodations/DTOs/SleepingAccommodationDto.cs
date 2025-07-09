using Booking.Api.Domain.Enums;

namespace Booking.Api.Features.SleepingAccommodations.DTOs;

public record SleepingAccommodationDto
{
    public Guid Id { get; init; }
    public required string Name { get; init; }
    public AccommodationType Type { get; init; }
    public int MaxCapacity { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ChangedAt { get; init; }
}