using Booking.Api.Domain.Common;

namespace Booking.Api.Services.EventSourcing;

public class EventSourcedRepository<T>(IEventStore eventStore, IEventDispatcher eventDispatcher) : IEventSourcedRepository<T>
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
            
            // Publish events for read model projections
            foreach (var domainEvent in events)
            {
                await eventDispatcher.PublishAsync(domainEvent);
            }
            
            aggregate.ClearDomainEvents();
        }
    }
}