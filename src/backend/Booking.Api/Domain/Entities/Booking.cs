using Booking.Api.Domain.Common;

namespace Booking.Api.Domain.Entities;

public class Booking : IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ChangedAt { get; set; }
}