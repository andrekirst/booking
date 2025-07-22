using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Services.Projections;

public class BookingProjectionService(
    BookingDbContext context,
    IServiceProvider serviceProvider,
    ILogger<BookingProjectionService> logger)
    : IProjectionService<BookingAggregate, BookingReadModel>
{
    public async Task ProjectAsync(Guid aggregateId, int fromVersion = 0, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("BookingProjectionService: Starting projection for booking {AggregateId} from version {FromVersion}", 
            aggregateId, fromVersion);

        // Get existing read model or create new one
        var readModel = await context.BookingReadModels
            .FirstOrDefaultAsync(rm => rm.Id == aggregateId, cancellationToken);

        if (readModel == null)
        {
            logger.LogInformation("BookingProjectionService: Creating new read model for booking {AggregateId}", aggregateId);
            readModel = new BookingReadModel 
            { 
                Id = aggregateId,
                LastEventVersion = -1 // Initialize to -1 so first event (version 0) gets processed
            };
            context.BookingReadModels.Add(readModel);
        }
        else
        {
            logger.LogInformation("BookingProjectionService: Found existing read model for booking {AggregateId}", aggregateId);
        }

        // Get all events from the specified version onwards
        var lastProcessedVersion = readModel?.LastEventVersion ?? -1;
        var events = await context.EventStoreEvents
            .Where(e => e.AggregateId == aggregateId && 
                       e.Version > Math.Max(lastProcessedVersion, fromVersion - 1))
            .OrderBy(e => e.Version)
            .ToListAsync(cancellationToken);

        if (events.Count == 0)
        {
            logger.LogWarning("No events found for booking {AggregateId} from version {FromVersion}",
                aggregateId, fromVersion);
            return;
        }
        
        logger.LogInformation("BookingProjectionService: Found {EventCount} events to process for booking {AggregateId}", 
            events.Count, aggregateId);

        // Get all event appliers for BookingReadModel
        var eventAppliers = serviceProvider.GetServices<IEventApplier<BookingReadModel>>()
            .ToDictionary(applier => applier.EventType, applier => applier);

        // Apply each event to the read model
        foreach (var eventStoreEvent in events)
        {
            try
            {
                // Deserialize the event
                var eventSerializer = serviceProvider.GetRequiredService<Services.EventSourcing.IEventSerializer>();
                var domainEvent = eventSerializer.DeserializeEvent(eventStoreEvent.EventData, eventStoreEvent.EventType);

                // Find the appropriate event applier
                var eventType = domainEvent.GetType();
                if (eventAppliers.TryGetValue(eventType, out var applier) && readModel != null)
                {
                    applier.Apply(readModel, domainEvent);
                    readModel.LastEventVersion = eventStoreEvent.Version;
                    
                    logger.LogDebug("Applied event {EventType} (version {Version}) to booking read model {AggregateId}",
                        eventType.Name, eventStoreEvent.Version, aggregateId);
                }
                else
                {
                    logger.LogWarning("No event applier found for event type {EventType} on booking {AggregateId}",
                        eventType.Name, aggregateId);
                    
                    // Still update the version to avoid reprocessing
                    if (readModel != null)
                    {
                        readModel.LastEventVersion = eventStoreEvent.Version;
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to apply event {EventId} (type: {EventType}) to booking read model {AggregateId}",
                    eventStoreEvent.Id, eventStoreEvent.EventType, aggregateId);
                throw;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        
        logger.LogInformation("Successfully projected booking {AggregateId} from version {FromVersion}", 
            aggregateId, fromVersion);
    }

    public async Task<List<Guid>> GetAllAggregateIdsAsync(CancellationToken cancellationToken = default)
    {
        return await context.EventStoreEvents
            .Where(e => e.AggregateType == "BookingAggregate")
            .Select(e => e.AggregateId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task RebuildAsync(Guid aggregateId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Rebuilding booking read model for aggregate {AggregateId}", aggregateId);

        // Remove existing read model
        var existingReadModel = await context.BookingReadModels
            .FirstOrDefaultAsync(rm => rm.Id == aggregateId, cancellationToken);
        
        if (existingReadModel != null)
        {
            context.BookingReadModels.Remove(existingReadModel);
        }

        // Get the latest version for this aggregate
        var latestVersion = await context.EventStoreEvents
            .Where(e => e.AggregateId == aggregateId)
            .MaxAsync(e => (int?)e.Version, cancellationToken);

        if (latestVersion.HasValue)
        {
            await ProjectAsync(aggregateId, 0, cancellationToken);
        }

        logger.LogInformation("Completed booking read model rebuild for aggregate {AggregateId}", aggregateId);
    }

    public async Task RebuildAllAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Starting booking read model rebuild");

        // Clear existing read models
        await context.BookingReadModels.ExecuteDeleteAsync(cancellationToken);
        
        // Get all booking aggregate IDs
        var aggregateIds = await GetAllAggregateIdsAsync(cancellationToken);
        
        logger.LogInformation("Rebuilding {Count} booking read models", aggregateIds.Count);

        // Rebuild each aggregate
        foreach (var aggregateId in aggregateIds)
        {
            try
            {
                // Get the latest version for this aggregate
                var latestVersion = await context.EventStoreEvents
                    .Where(e => e.AggregateId == aggregateId)
                    .MaxAsync(e => e.Version, cancellationToken);

                await ProjectAsync(aggregateId, latestVersion, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to rebuild booking read model for aggregate {AggregateId}", aggregateId);
                throw;
            }
        }

        logger.LogInformation("Completed booking read model rebuild");
    }
}