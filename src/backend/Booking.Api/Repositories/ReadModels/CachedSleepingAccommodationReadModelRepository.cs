using Booking.Api.Domain.ReadModels;
using Booking.Api.Services.Caching;

namespace Booking.Api.Repositories.ReadModels;

public class CachedSleepingAccommodationReadModelRepository(
    ISleepingAccommodationReadModelRepository innerRepository,
    IReadModelCache<SleepingAccommodationReadModel> cache,
    ILogger<CachedSleepingAccommodationReadModelRepository> logger)
    : ISleepingAccommodationReadModelRepository
{
    public async Task<SleepingAccommodationReadModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // Try cache first
        var cachedModel = await cache.GetAsync(id, cancellationToken);
        if (cachedModel != null)
        {
            return cachedModel;
        }

        // Not in cache, get from repository
        var model = await innerRepository.GetByIdAsync(id, cancellationToken);
        if (model != null)
        {
            await cache.SetAsync(id, model, cancellationToken: cancellationToken);
        }

        return model;
    }

    public async Task<List<SleepingAccommodationReadModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // For list operations, we always go to the repository
        // but we can warm up the cache with the results
        var models = await innerRepository.GetAllAsync(cancellationToken);
        
        // Warm up cache in background
        _ = Task.Run(async () =>
        {
            try
            {
                await cache.WarmupAsync(models, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error warming up cache after GetAllAsync");
            }
        }, cancellationToken);

        return models;
    }

    public async Task SaveAsync(SleepingAccommodationReadModel model, CancellationToken cancellationToken = default)
    {
        await innerRepository.SaveAsync(model, cancellationToken);
        await cache.SetAsync(model.Id, model, cancellationToken: cancellationToken);
    }

    public async Task UpdateAsync(Guid id, Action<SleepingAccommodationReadModel> updateAction, CancellationToken cancellationToken = default)
    {
        await innerRepository.UpdateAsync(id, updateAction, cancellationToken);
        await cache.InvalidateAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await innerRepository.DeleteAsync(id, cancellationToken);
        await cache.InvalidateAsync(id, cancellationToken);
    }

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return innerRepository.ExistsAsync(id, cancellationToken);
    }

    public async Task<List<SleepingAccommodationReadModel>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        // For filtered operations, we go to the repository
        var models = await innerRepository.GetActiveAsync(cancellationToken);
        
        // Warm up cache in background
        _ = Task.Run(async () =>
        {
            try
            {
                await cache.WarmupAsync(models, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error warming up cache after GetActiveAsync");
            }
        }, cancellationToken);

        return models;
    }

    public Task<SleepingAccommodationReadModel?> GetByIdWithVersionAsync(Guid id, int minVersion, CancellationToken cancellationToken = default)
    {
        // Version-specific queries always go to the repository
        return innerRepository.GetByIdWithVersionAsync(id, minVersion, cancellationToken);
    }

    public async Task UpdateVersionAsync(Guid id, int newVersion, CancellationToken cancellationToken = default)
    {
        await innerRepository.UpdateVersionAsync(id, newVersion, cancellationToken);
        await cache.InvalidateAsync(id, cancellationToken);
    }
}