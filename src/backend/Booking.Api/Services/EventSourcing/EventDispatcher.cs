using Booking.Api.Domain.Common;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Booking.Api.Services.EventSourcing;

public class EventDispatcher(
    IMediator mediator,
    ILogger<EventDispatcher> logger) : IEventDispatcher
{
    public async Task PublishAsync(DomainEvent domainEvent)
    {
        logger.LogDebug("Publishing {EventType} event with ID {EventId}", 
            domainEvent.EventType, domainEvent.Id);
        
        try
        {
            await mediator.Publish(domainEvent);
            logger.LogDebug("Successfully published {EventType} event", domainEvent.EventType);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to publish {EventType} event with ID {EventId}", 
                domainEvent.EventType, domainEvent.Id);
            throw;
        }
    }
}