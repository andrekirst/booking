namespace Booking.Api.Domain.Common;

public interface ISoftDeletable
{
    bool IsActive { get; set; }
}