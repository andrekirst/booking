namespace Booking.Api.Services.Caching;

public interface IReadModelCache<TReadModel> where TReadModel : class
{
    Task<TReadModel?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task SetAsync(Guid id, TReadModel model, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task InvalidateAsync(Guid id, CancellationToken cancellationToken = default);
    Task InvalidateAllAsync(CancellationToken cancellationToken = default);
    Task WarmupAsync(IEnumerable<TReadModel> models, CancellationToken cancellationToken = default);
}