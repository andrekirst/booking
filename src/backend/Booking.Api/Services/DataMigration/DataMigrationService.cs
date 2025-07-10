using Booking.Api.Data;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Services.DataMigration;

public class DataMigrationService(
    BookingDbContext context,
    IEventStore eventStore,
    ILogger<DataMigrationService> logger)
    : IDataMigrationService
{
    public async Task<bool> IsDataMigrationRequiredAsync()
    {
        // Check if there are any existing SleepingAccommodation entities
        var hasExistingEntities = await context.SleepingAccommodations.AnyAsync();
        
        // Check if there are any events in the event store
        var hasEvents = await context.EventStoreEvents
            .Where(e => e.AggregateType == "SleepingAccommodationAggregate")
            .AnyAsync();
            
        // Check if there are any read models
        var hasReadModels = await context.SleepingAccommodationReadModels.AnyAsync();

        // Migration is required if we have existing entities but no events or read models
        return hasExistingEntities && (!hasEvents || !hasReadModels);
    }

    public async Task MigrateExistingDataToEventSourcingAsync()
    {
        logger.LogInformation("Starting data migration to Event Sourcing...");

        await using var transaction = await context.Database.BeginTransactionAsync();
        
        try
        {
            // Get all existing SleepingAccommodation entities
            var existingAccommodations = await context.SleepingAccommodations
                .OrderBy(sa => sa.CreatedAt)
                .ToListAsync();

            logger.LogInformation("Found {Count} existing sleeping accommodations to migrate", existingAccommodations.Count);

            foreach (var accommodation in existingAccommodations)
            {
                await MigrateAccommodationToEventsAsync(accommodation);
            }

            await transaction.CommitAsync();
            logger.LogInformation("Data migration completed successfully. Migrated {Count} accommodations", existingAccommodations.Count);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            logger.LogError(ex, "Data migration failed. Rolling back changes.");
            throw;
        }
    }

    private async Task MigrateAccommodationToEventsAsync(Domain.Entities.SleepingAccommodation accommodation)
    {
        logger.LogDebug("Migrating accommodation {Id} - {Name}", accommodation.Id, accommodation.Name);

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
        if (accommodation is { IsActive: false, ChangedAt: not null })
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
        await eventStore.SaveEventsAsync(
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
        var existingReadModel = await context.SleepingAccommodationReadModels
            .FirstOrDefaultAsync(rm => rm.Id == accommodation.Id);

        if (existingReadModel == null)
        {
            context.SleepingAccommodationReadModels.Add(readModel);
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

        await context.SaveChangesAsync();
    }
}