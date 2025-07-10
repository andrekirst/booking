using Booking.Api.Domain.Enums;

namespace Booking.Api.Domain.ReadModels;

public class SleepingAccommodationReadModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public AccommodationType Type { get; set; }
    public int MaxCapacity { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? ChangedAt { get; set; }
    public int LastEventVersion { get; set; }
}