using Booking.Api.Domain.Common;

namespace Booking.Api.Services.EventSourcing;

public interface IEventStore
{
    Task<List<DomainEvent>> GetEventsAsync(Guid aggregateId, int fromVersion = 0);
    Task SaveEventsAsync(Guid aggregateId, string aggregateType, IEnumerable<DomainEvent> events, int expectedVersion);
    Task<T?> GetSnapshotAsync<T>(Guid aggregateId) where T : class;
    Task SaveSnapshotAsync<T>(Guid aggregateId, string aggregateType, T snapshot, int version) where T : class;
    Task<List<(DomainEvent Event, int Version)>> GetEventsAsync(Guid aggregateId, int fromVersion, CancellationToken cancellationToken);
    Task<List<Guid>> GetAllAggregateIdsAsync<T>(CancellationToken cancellationToken) where T : class;
}