using Booking.Api.Domain.ReadModels;
using Booking.Api.Services.Caching;

namespace Booking.Api.Repositories.ReadModels;

public class CachedSleepingAccommodationReadModelRepository : ISleepingAccommodationReadModelRepository
{
    private readonly ISleepingAccommodationReadModelRepository _innerRepository;
    private readonly IReadModelCache<SleepingAccommodationReadModel> _cache;
    private readonly ILogger<CachedSleepingAccommodationReadModelRepository> _logger;

    public CachedSleepingAccommodationReadModelRepository(
        ISleepingAccommodationReadModelRepository innerRepository,
        IReadModelCache<SleepingAccommodationReadModel> cache,
        ILogger<CachedSleepingAccommodationReadModelRepository> logger)
    {
        _innerRepository = innerRepository;
        _cache = cache;
        _logger = logger;
    }

    public async Task<SleepingAccommodationReadModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // Try cache first
        var cachedModel = await _cache.GetAsync(id, cancellationToken);
        if (cachedModel != null)
        {
            return cachedModel;
        }

        // Not in cache, get from repository
        var model = await _innerRepository.GetByIdAsync(id, cancellationToken);
        if (model != null)
        {
            await _cache.SetAsync(id, model, cancellationToken: cancellationToken);
        }

        return model;
    }

    public async Task<List<SleepingAccommodationReadModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // For list operations, we always go to the repository
        // but we can warm up the cache with the results
        var models = await _innerRepository.GetAllAsync(cancellationToken);
        
        // Warm up cache in background
        _ = Task.Run(async () =>
        {
            try
            {
                await _cache.WarmupAsync(models);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error warming up cache after GetAllAsync");
            }
        });

        return models;
    }

    public async Task SaveAsync(SleepingAccommodationReadModel model, CancellationToken cancellationToken = default)
    {
        await _innerRepository.SaveAsync(model, cancellationToken);
        await _cache.SetAsync(model.Id, model, cancellationToken: cancellationToken);
    }

    public async Task UpdateAsync(Guid id, Action<SleepingAccommodationReadModel> updateAction, CancellationToken cancellationToken = default)
    {
        await _innerRepository.UpdateAsync(id, updateAction, cancellationToken);
        await _cache.InvalidateAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await _innerRepository.DeleteAsync(id, cancellationToken);
        await _cache.InvalidateAsync(id, cancellationToken);
    }

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _innerRepository.ExistsAsync(id, cancellationToken);
    }

    public async Task<List<SleepingAccommodationReadModel>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        // For filtered operations, we go to the repository
        var models = await _innerRepository.GetActiveAsync(cancellationToken);
        
        // Warm up cache in background
        _ = Task.Run(async () =>
        {
            try
            {
                await _cache.WarmupAsync(models);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error warming up cache after GetActiveAsync");
            }
        });

        return models;
    }

    public Task<SleepingAccommodationReadModel?> GetByIdWithVersionAsync(Guid id, int minVersion, CancellationToken cancellationToken = default)
    {
        // Version-specific queries always go to the repository
        return _innerRepository.GetByIdWithVersionAsync(id, minVersion, cancellationToken);
    }

    public async Task UpdateVersionAsync(Guid id, int newVersion, CancellationToken cancellationToken = default)
    {
        await _innerRepository.UpdateVersionAsync(id, newVersion, cancellationToken);
        await _cache.InvalidateAsync(id, cancellationToken);
    }
}