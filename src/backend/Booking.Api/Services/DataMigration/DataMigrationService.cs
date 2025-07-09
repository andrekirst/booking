using Booking.Api.Data;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Services.DataMigration;

public class DataMigrationService : IDataMigrationService
{
    private readonly BookingDbContext _context;
    private readonly IEventStore _eventStore;
    private readonly IEventSerializer _eventSerializer;
    private readonly ILogger<DataMigrationService> _logger;

    public DataMigrationService(
        BookingDbContext context,
        IEventStore eventStore,
        IEventSerializer eventSerializer,
        ILogger<DataMigrationService> logger)
    {
        _context = context;
        _eventStore = eventStore;
        _eventSerializer = eventSerializer;
        _logger = logger;
    }

    public async Task<bool> IsDataMigrationRequiredAsync()
    {
        // Check if there are any existing SleepingAccommodation entities
        var hasExistingEntities = await _context.SleepingAccommodations.AnyAsync();
        
        // Check if there are any events in the event store
        var hasEvents = await _context.EventStoreEvents
            .Where(e => e.AggregateType == "SleepingAccommodationAggregate")
            .AnyAsync();
            
        // Check if there are any read models
        var hasReadModels = await _context.SleepingAccommodationReadModels.AnyAsync();

        // Migration is required if we have existing entities but no events or read models
        return hasExistingEntities && (!hasEvents || !hasReadModels);
    }

    public async Task MigrateExistingDataToEventSourcingAsync()
    {
        _logger.LogInformation("Starting data migration to Event Sourcing...");

        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // Get all existing SleepingAccommodation entities
            var existingAccommodations = await _context.SleepingAccommodations
                .OrderBy(sa => sa.CreatedAt)
                .ToListAsync();

            _logger.LogInformation("Found {Count} existing sleeping accommodations to migrate", existingAccommodations.Count);

            foreach (var accommodation in existingAccommodations)
            {
                await MigrateAccommodationToEventsAsync(accommodation);
            }

            await transaction.CommitAsync();
            _logger.LogInformation("Data migration completed successfully. Migrated {Count} accommodations", existingAccommodations.Count);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Data migration failed. Rolling back changes.");
            throw;
        }
    }

    private async Task MigrateAccommodationToEventsAsync(Domain.Entities.SleepingAccommodation accommodation)
    {
        _logger.LogDebug("Migrating accommodation {Id} - {Name}", accommodation.Id, accommodation.Name);

        var events = new List<Domain.Common.DomainEvent>();

        // Create the initial "Created" event
        var createdEvent = new SleepingAccommodationCreatedEvent
        {
            Id = Guid.NewGuid(),
            OccurredAt = accommodation.CreatedAt,
            SleepingAccommodationId = accommodation.Id,
            Name = accommodation.Name,
            Type = accommodation.Type,
            MaxCapacity = accommodation.MaxCapacity,
            IsActive = true // Initially created as active
        };
        events.Add(createdEvent);

        // If the accommodation was later deactivated, create a deactivated event
        if (!accommodation.IsActive && accommodation.ChangedAt.HasValue)
        {
            var deactivatedEvent = new SleepingAccommodationDeactivatedEvent
            {
                Id = Guid.NewGuid(),
                OccurredAt = accommodation.ChangedAt.Value,
                SleepingAccommodationId = accommodation.Id
            };
            events.Add(deactivatedEvent);
        }

        // Save events to event store
        await _eventStore.SaveEventsAsync(
            accommodation.Id,
            "SleepingAccommodationAggregate",
            events,
            -1); // Starting from version -1 (no previous events)

        // Create the read model
        var readModel = new SleepingAccommodationReadModel
        {
            Id = accommodation.Id,
            Name = accommodation.Name,
            Type = accommodation.Type,
            MaxCapacity = accommodation.MaxCapacity,
            IsActive = accommodation.IsActive,
            CreatedAt = accommodation.CreatedAt,
            ChangedAt = accommodation.ChangedAt,
            LastEventVersion = events.Count - 1 // Last event version
        };

        // Check if read model already exists
        var existingReadModel = await _context.SleepingAccommodationReadModels
            .FirstOrDefaultAsync(rm => rm.Id == accommodation.Id);

        if (existingReadModel == null)
        {
            _context.SleepingAccommodationReadModels.Add(readModel);
        }
        else
        {
            // Update existing read model
            existingReadModel.Name = readModel.Name;
            existingReadModel.Type = readModel.Type;
            existingReadModel.MaxCapacity = readModel.MaxCapacity;
            existingReadModel.IsActive = readModel.IsActive;
            existingReadModel.CreatedAt = readModel.CreatedAt;
            existingReadModel.ChangedAt = readModel.ChangedAt;
            existingReadModel.LastEventVersion = readModel.LastEventVersion;
        }

        await _context.SaveChangesAsync();
    }
}