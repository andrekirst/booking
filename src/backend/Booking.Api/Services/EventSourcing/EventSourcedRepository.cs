using Booking.Api.Domain.Common;
using Microsoft.Extensions.Logging;

namespace Booking.Api.Services.EventSourcing;

public class EventSourcedRepository<T>(
    IEventStore eventStore, 
    IEventDispatcher eventDispatcher,
    ILogger<EventSourcedRepository<T>> logger) : IEventSourcedRepository<T>
    where T : AggregateRoot, new()
{
    public async Task<T?> GetByIdAsync(Guid id)
    {
        var events = await eventStore.GetEventsAsync(id);
        
        if (events.Count == 0)
        {
            return null;
        }

        var aggregate = new T();
        aggregate.LoadFromHistory(events);
        
        return aggregate;
    }

    public async Task SaveAsync(T aggregate)
    {
        var events = aggregate.DomainEvents.ToList();
        
        if (events.Count > 0)
        {
            var aggregateTypeName = typeof(T).Name;
            await eventStore.SaveEventsAsync(aggregate.Id, aggregateTypeName, events, aggregate.Version);
            
            // Update aggregate version after successful save
            aggregate.MarkEventsAsCommitted(events.Count);
            
            // Publish events for read model projections
            logger.LogInformation("Publishing {Count} events for aggregate {AggregateId} of type {AggregateType}", 
                events.Count, aggregate.Id, aggregateTypeName);
            
            foreach (var domainEvent in events)
            {
                logger.LogDebug("Publishing event {EventType} for aggregate {AggregateId}", 
                    domainEvent.EventType, aggregate.Id);
                await eventDispatcher.PublishAsync(domainEvent);
            }
            
            aggregate.ClearDomainEvents();
        }
    }
}