using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Repositories.ReadModels;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Services.Projections;

public class SleepingAccommodationProjectionService : IProjectionService<SleepingAccommodationAggregate, SleepingAccommodationReadModel>
{
    private readonly IEventStore _eventStore;
    private readonly ISleepingAccommodationReadModelRepository _readModelRepository;
    private readonly ILogger<SleepingAccommodationProjectionService> _logger;
    private readonly Dictionary<Type, IEventApplier<SleepingAccommodationReadModel>> _eventAppliers;

    public SleepingAccommodationProjectionService(
        IEventStore eventStore,
        ISleepingAccommodationReadModelRepository readModelRepository,
        ILogger<SleepingAccommodationProjectionService> logger,
        IEnumerable<IEventApplier<SleepingAccommodationReadModel>> eventAppliers)
    {
        _eventStore = eventStore;
        _readModelRepository = readModelRepository;
        _logger = logger;
        _eventAppliers = eventAppliers.ToDictionary(x => x.EventType);
    }

    public async Task ProjectAsync(Guid aggregateId, int fromVersion = 0, CancellationToken cancellationToken = default)
    {
        try
        {
            // Load events from the specified version
            var events = await _eventStore.GetEventsAsync(aggregateId, fromVersion, cancellationToken);
            
            if (events.Count == 0)
            {
                _logger.LogWarning("No events found for aggregate {AggregateId} from version {FromVersion}", aggregateId, fromVersion);
                return;
            }

            // Get or create read model
            var readModel = await _readModelRepository.GetByIdAsync(aggregateId, cancellationToken);
            var isNew = readModel == null;
            
            if (isNew)
            {
                readModel = new SleepingAccommodationReadModel { Id = aggregateId };
            }

            // Apply events to read model
            foreach (var @event in events.OrderBy(e => e.Version))
            {
                ApplyEventToReadModel(readModel!, @event.Event);
                readModel!.LastEventVersion = @event.Version;
            }

            // Save read model
            if (isNew)
            {
                await _readModelRepository.SaveAsync(readModel!, cancellationToken);
            }
            else
            {
                await _readModelRepository.UpdateAsync(aggregateId, rm => 
                {
                    rm.Name = readModel!.Name;
                    rm.Type = readModel.Type;
                    rm.MaxCapacity = readModel.MaxCapacity;
                    rm.IsActive = readModel.IsActive;
                    rm.CreatedAt = readModel.CreatedAt;
                    rm.ChangedAt = readModel.ChangedAt;
                    rm.LastEventVersion = readModel.LastEventVersion;
                }, cancellationToken);
            }

            _logger.LogInformation("Successfully projected aggregate {AggregateId} to version {Version}", aggregateId, readModel!.LastEventVersion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error projecting aggregate {AggregateId}", aggregateId);
            throw;
        }
    }

    public async Task RebuildAsync(Guid aggregateId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Rebuilding projection for aggregate {AggregateId}", aggregateId);
        
        // Delete existing read model
        await _readModelRepository.DeleteAsync(aggregateId, cancellationToken);
        
        // Rebuild from scratch
        await ProjectAsync(aggregateId, 0, cancellationToken);
    }

    public async Task RebuildAllAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Rebuilding all SleepingAccommodation projections");
        
        // Get all unique aggregate IDs from event store
        var aggregateIds = await _eventStore.GetAllAggregateIdsAsync<SleepingAccommodationAggregate>(cancellationToken);
        
        foreach (var aggregateId in aggregateIds.TakeWhile(_ => !cancellationToken.IsCancellationRequested))
        {
            await RebuildAsync(aggregateId, cancellationToken);
        }
        
        _logger.LogInformation("Completed rebuilding all projections");
    }

    private void ApplyEventToReadModel(SleepingAccommodationReadModel readModel, DomainEvent @event)
    {
        var eventType = @event.GetType();
        
        if (_eventAppliers.TryGetValue(eventType, out var applier))
        {
            applier.Apply(readModel, @event);
        }
        else
        {
            _logger.LogWarning("No event applier found for event type: {EventType}", eventType.Name);
        }
    }
}