using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Domain.Entities;

public class SleepingAccommodation : IAuditableEntity, ISoftDeletable
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public AccommodationType Type { get; set; }
    public int MaxCapacity { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ChangedAt { get; set; }
}