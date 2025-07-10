using Booking.Api.Data;
using Booking.Api.Domain.Common;
using Booking.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Services.EventSourcing;

public class EventStore(BookingDbContext context, IEventSerializer eventSerializer) : IEventStore
{
    public async Task<List<DomainEvent>> GetEventsAsync(Guid aggregateId, int fromVersion = 0)
    {
        var eventStoreEvents = await context.EventStoreEvents
            .Where(e => e.AggregateId == aggregateId && e.Version > fromVersion)
            .OrderBy(e => e.Version)
            .ToListAsync();

        var domainEvents = new List<DomainEvent>();
        foreach (var eventStoreEvent in eventStoreEvents)
        {
            try
            {
                var domainEvent = eventSerializer.DeserializeEvent(eventStoreEvent.EventData, eventStoreEvent.EventType);
                domainEvents.Add(domainEvent);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to deserialize event {eventStoreEvent.Id}: {ex.Message}", ex);
            }
        }

        return domainEvents;
    }

    public async Task SaveEventsAsync(Guid aggregateId, string aggregateType, IEnumerable<DomainEvent> events, int expectedVersion)
    {
        var eventList = events.ToList();
        if (eventList.Count == 0)
        {
            return;
        }

        await using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // Check for concurrency conflicts
            var currentVersion = await GetCurrentVersionAsync(aggregateId);
            if (currentVersion != expectedVersion)
            {
                throw new InvalidOperationException($"Concurrency conflict. Expected version {expectedVersion}, but current version is {currentVersion}");
            }

            var eventStoreEvents = new List<EventStoreEvent>();
            var version = expectedVersion;

            foreach (var domainEvent in eventList)
            {
                version++;
                var eventStoreEvent = new EventStoreEvent
                {
                    Id = domainEvent.Id,
                    AggregateId = aggregateId,
                    AggregateType = aggregateType,
                    EventType = domainEvent.EventType,
                    EventData = eventSerializer.SerializeEvent(domainEvent),
                    Version = version,
                    Timestamp = domainEvent.OccurredAt
                };

                eventStoreEvents.Add(eventStoreEvent);
            }

            context.EventStoreEvents.AddRange(eventStoreEvents);
            await context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<T?> GetSnapshotAsync<T>(Guid aggregateId) where T : class
    {
        var snapshot = await context.EventStoreSnapshots
            .Where(s => s.AggregateId == aggregateId)
            .OrderByDescending(s => s.Version)
            .FirstOrDefaultAsync();

        return snapshot == null
            ? null :
            eventSerializer.DeserializeSnapshot<T>(snapshot.SnapshotData);
    }

    public async Task SaveSnapshotAsync<T>(Guid aggregateId, string aggregateType, T snapshot, int version) where T : class
    {
        // Remove existing snapshot (only keep the latest)
        var existingSnapshot = await context.EventStoreSnapshots
            .Where(s => s.AggregateId == aggregateId)
            .FirstOrDefaultAsync();

        if (existingSnapshot != null)
        {
            context.EventStoreSnapshots.Remove(existingSnapshot);
        }

        var eventStoreSnapshot = new EventStoreSnapshot
        {
            AggregateId = aggregateId,
            AggregateType = aggregateType,
            SnapshotData = eventSerializer.SerializeSnapshot(snapshot),
            Version = version,
            Timestamp = DateTime.UtcNow
        };

        context.EventStoreSnapshots.Add(eventStoreSnapshot);
        await context.SaveChangesAsync();
    }

    private async Task<int> GetCurrentVersionAsync(Guid aggregateId)
    {
        var lastEvent = await context.EventStoreEvents
            .Where(e => e.AggregateId == aggregateId)
            .OrderByDescending(e => e.Version)
            .FirstOrDefaultAsync();

        return lastEvent?.Version ?? -1;
    }

    public async Task<List<(DomainEvent Event, int Version)>> GetEventsAsync(Guid aggregateId, int fromVersion, CancellationToken cancellationToken)
    {
        var eventStoreEvents = await context.EventStoreEvents
            .Where(e => e.AggregateId == aggregateId && e.Version > fromVersion)
            .OrderBy(e => e.Version)
            .ToListAsync(cancellationToken);

        var eventsWithVersion = new List<(DomainEvent Event, int Version)>();
        foreach (var eventStoreEvent in eventStoreEvents)
        {
            try
            {
                var domainEvent = eventSerializer.DeserializeEvent(eventStoreEvent.EventData, eventStoreEvent.EventType);
                eventsWithVersion.Add((domainEvent, eventStoreEvent.Version));
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to deserialize event {eventStoreEvent.Id}: {ex.Message}", ex);
            }
        }

        return eventsWithVersion;
    }

    public async Task<List<Guid>> GetAllAggregateIdsAsync<T>(CancellationToken cancellationToken) where T : class
    {
        var aggregateType = typeof(T).Name;
        
        return await context.EventStoreEvents
            .Where(e => e.AggregateType == aggregateType)
            .Select(e => e.AggregateId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}