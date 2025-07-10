namespace Booking.Api.Domain.Common;

public interface IAggregateEvent
{
    Guid GetAggregateId();
    string GetAggregateType();
}