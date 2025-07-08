namespace Booking.Api.Domain.Common;

public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    DateTime? ChangedAt { get; set; }
}