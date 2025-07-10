using Booking.Api.Domain.Common;
using MediatR;

namespace Booking.Api.Services.EventSourcing;

public class EventDispatcher(IMediator mediator) : IEventDispatcher
{
    public async Task PublishAsync(DomainEvent domainEvent)
    {
        await mediator.Publish(domainEvent);
    }
}