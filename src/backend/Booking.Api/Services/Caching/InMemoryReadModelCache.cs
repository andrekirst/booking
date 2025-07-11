using Microsoft.Extensions.Caching.Memory;

namespace Booking.Api.Services.Caching;

public class InMemoryReadModelCache<TReadModel>(IMemoryCache memoryCache, ILogger<InMemoryReadModelCache<TReadModel>> logger)
    : IReadModelCache<TReadModel>
    where TReadModel : class
{
    private readonly string _cacheKeyPrefix = $"ReadModel_{typeof(TReadModel).Name}_";

    public Task<TReadModel?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var key = GetCacheKey(id);
        if (memoryCache.TryGetValue<TReadModel>(key, out var model))
        {
            logger.LogDebug("Cache hit for {ModelType} with id {Id}", typeof(TReadModel).Name, id);
            return Task.FromResult(model);
        }

        logger.LogDebug("Cache miss for {ModelType} with id {Id}", typeof(TReadModel).Name, id);
        return Task.FromResult<TReadModel?>(null);
    }

    public Task SetAsync(Guid id, TReadModel model, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var key = GetCacheKey(id);
        var options = new MemoryCacheEntryOptions();
        
        if (expiration.HasValue)
        {
            options.SetAbsoluteExpiration(expiration.Value);
        }
        else
        {
            options.SetSlidingExpiration(TimeSpan.FromMinutes(15)); // Default sliding expiration
        }

        memoryCache.Set(key, model, options);
        logger.LogDebug("Cached {ModelType} with id {Id}", typeof(TReadModel).Name, id);
        
        return Task.CompletedTask;
    }

    public Task InvalidateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var key = GetCacheKey(id);
        memoryCache.Remove(key);
        logger.LogDebug("Invalidated cache for {ModelType} with id {Id}", typeof(TReadModel).Name, id);
        
        return Task.CompletedTask;
    }

    public Task InvalidateAllAsync(CancellationToken cancellationToken = default)
    {
        // With IMemoryCache, we can't efficiently clear all entries with a specific prefix
        // In production, you might want to use a distributed cache like Redis
        logger.LogWarning("InvalidateAllAsync called, but IMemoryCache doesn't support efficient prefix-based clearing");
        return Task.CompletedTask;
    }

    public async Task WarmupAsync(IEnumerable<TReadModel> models, CancellationToken cancellationToken = default)
    {
        var count = 0;
        foreach (var model in models)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                break;
            }

            // Assuming the model has an Id property accessible via reflection
            var idProperty = typeof(TReadModel).GetProperty("Id");
            if (idProperty != null && idProperty.PropertyType == typeof(Guid))
            {
                var id = (Guid)idProperty.GetValue(model)!;
                await SetAsync(id, model, cancellationToken: cancellationToken);
                count++;
            }
        }

        logger.LogInformation("Warmed up cache with {Count} {ModelType} entries", count, typeof(TReadModel).Name);
    }

    private string GetCacheKey(Guid id) => $"{_cacheKeyPrefix}{id}";
}