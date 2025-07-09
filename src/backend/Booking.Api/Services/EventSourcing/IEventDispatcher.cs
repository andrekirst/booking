using Booking.Api.Domain.Common;

namespace Booking.Api.Services.EventSourcing;

public interface IEventDispatcher
{
    Task PublishAsync(DomainEvent domainEvent);
}