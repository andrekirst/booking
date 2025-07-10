# Read Model Improvements

This document describes the improvements made to the Read Model handling in the Event Sourcing architecture.

## Overview

The original implementation had Read Models directly accessed by Event Handlers and Query Handlers through the DbContext. This approach had several limitations:
- Tight coupling between Event Handlers and database access
- No abstraction layer for Read Model persistence
- Manual version management
- No caching capabilities
- Synchronous-only projections

## Improvements Implemented

### 1. Repository Pattern for Read Models

Created a generic repository pattern specifically for Read Models:
- `IReadModelRepository<T>` - Generic interface for all Read Model repositories
- `ReadModelRepository<T>` - Base implementation with common CRUD operations
- `ISleepingAccommodationReadModelRepository` - Domain-specific repository interface
- `SleepingAccommodationReadModelRepository` - Implementation with custom queries

Benefits:
- Abstraction of data access logic
- Testability through interface mocking
- Centralized query logic
- Easier to switch persistence mechanisms

### 2. Projection Service Pattern

Implemented a dedicated service for managing Read Model projections:
- `IProjectionService<TAggregate, TReadModel>` - Generic projection interface
- `SleepingAccommodationProjectionService` - Handles event-to-read-model projections

Features:
- Project from specific event versions
- Rebuild entire projections
- Rebuild all projections of a type
- Centralized event application logic

### 3. Caching Layer

Added an in-memory caching layer for Read Models:
- `IReadModelCache<T>` - Generic caching interface
- `InMemoryReadModelCache<T>` - Memory cache implementation
- `CachedSleepingAccommodationReadModelRepository` - Decorator pattern for caching

Benefits:
- Reduced database queries
- Configurable expiration policies
- Cache warming capabilities
- Transparent to consumers

### 4. Asynchronous Projections

Created infrastructure for background projection processing:
- `ProjectionBackgroundService` - Processes projections asynchronously
- `OptimizedEventDispatcher` - Supports both sync and async event handling
- Channel-based queue for reliable event processing

Benefits:
- Better performance for write operations
- Eventual consistency support
- Resilient to projection failures
- Configurable sync/async behavior

### 5. Admin Management API

Added administrative endpoints for projection management:
- Rebuild specific projections
- Rebuild all projections of a type
- Project from specific versions

## Configuration

### Dependency Injection Setup

```csharp
// Register repositories
builder.Services.AddScoped<SleepingAccommodationReadModelRepository>();
builder.Services.AddScoped<ISleepingAccommodationReadModelRepository>(provider =>
{
    var innerRepository = provider.GetRequiredService<SleepingAccommodationReadModelRepository>();
    var cache = provider.GetRequiredService<IReadModelCache<SleepingAccommodationReadModel>>();
    var logger = provider.GetRequiredService<ILogger<CachedSleepingAccommodationReadModelRepository>>();
    return new CachedSleepingAccommodationReadModelRepository(innerRepository, cache, logger);
});

// Register caching
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IReadModelCache<SleepingAccommodationReadModel>, InMemoryReadModelCache<SleepingAccommodationReadModel>>();

// Register projection services
builder.Services.AddScoped<IProjectionService<SleepingAccommodationAggregate, SleepingAccommodationReadModel>, SleepingAccommodationProjectionService>();
```

### Configuration Options

```json
{
  "EventSourcing": {
    "UseAsyncProjections": false
  }
}
```

## Usage Examples

### Query Handler with Repository

```csharp
public class GetSleepingAccommodationsQueryHandler
{
    private readonly ISleepingAccommodationReadModelRepository _repository;

    public async Task<List<SleepingAccommodationDto>> Handle(query, cancellationToken)
    {
        var readModels = await _repository.GetActiveAsync(cancellationToken);
        return MapToDto(readModels);
    }
}
```

### Event Handler with Repository

```csharp
public class SleepingAccommodationCreatedEventHandler
{
    private readonly ISleepingAccommodationReadModelRepository _repository;

    public async Task Handle(notification, cancellationToken)
    {
        var readModel = CreateReadModelFromEvent(notification);
        await _repository.SaveAsync(readModel, cancellationToken);
    }
}
```

### Rebuild Projections

```bash
# Rebuild specific projection
curl -X POST /api/admin/projections/sleeping-accommodations/{id}/rebuild

# Rebuild all projections
curl -X POST /api/admin/projections/sleeping-accommodations/rebuild-all
```

## Future Enhancements

1. **Distributed Caching**: Replace in-memory cache with Redis for scalability
2. **Event Versioning**: Support for multiple event versions
3. **Snapshot Optimization**: Create snapshots for faster projection rebuilds
4. **Monitoring**: Add metrics for projection lag and performance
5. **Dead Letter Queue**: Handle failed projections with retry logic
6. **Multi-tenancy**: Support for tenant-specific read models