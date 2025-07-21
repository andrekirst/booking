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
        logger.LogInformation("EventDispatcher: Publishing {EventType} event with ID {EventId}", 
            domainEvent.EventType, domainEvent.Id);
        
        try
        {
            await mediator.Publish(domainEvent);
            logger.LogInformation("EventDispatcher: Successfully published {EventType} event", 
                domainEvent.EventType);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "EventDispatcher: Failed to publish {EventType} event", 
                domainEvent.EventType);
            throw;
        }
    }
}