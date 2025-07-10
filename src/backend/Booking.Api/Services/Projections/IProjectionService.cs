namespace Booking.Api.Services.Projections;

public interface IProjectionService<TAggregate, TReadModel> 
    where TAggregate : class
    where TReadModel : class
{
    Task ProjectAsync(Guid aggregateId, int fromVersion = 0, CancellationToken cancellationToken = default);
    Task RebuildAsync(Guid aggregateId, CancellationToken cancellationToken = default);
    Task RebuildAllAsync(CancellationToken cancellationToken = default);
}