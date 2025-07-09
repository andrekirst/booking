using Booking.Api.Domain.Common;

namespace Booking.Api.Services.EventSourcing;

public class EventSourcedRepository<T> : IEventSourcedRepository<T> where T : AggregateRoot, new()
{
    private readonly IEventStore _eventStore;
    private readonly IEventDispatcher _eventDispatcher;

    public EventSourcedRepository(IEventStore eventStore, IEventDispatcher eventDispatcher)
    {
        _eventStore = eventStore;
        _eventDispatcher = eventDispatcher;
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        var events = await _eventStore.GetEventsAsync(id);
        
        if (!events.Any())
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
        
        if (events.Any())
        {
            var aggregateTypeName = typeof(T).Name;
            await _eventStore.SaveEventsAsync(aggregate.Id, aggregateTypeName, events, aggregate.Version);
            
            // Publish events for read model projections
            foreach (var domainEvent in events)
            {
                await _eventDispatcher.PublishAsync(domainEvent);
            }
            
            aggregate.ClearDomainEvents();
        }
    }
}