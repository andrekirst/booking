using Booking.Api.Domain.Common;
using MediatR;

namespace Booking.Api.Services.EventSourcing;

public class EventDispatcher : IEventDispatcher
{
    private readonly IMediator _mediator;

    public EventDispatcher(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task PublishAsync(DomainEvent domainEvent)
    {
        await _mediator.Publish(domainEvent);
    }
}