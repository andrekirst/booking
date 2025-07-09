using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Enums;
using Booking.Api.Services.DataMigration;
using Booking.Api.Tests.Integration.TestBase;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Booking.Api.Tests.Integration.DataMigration;

public class DataMigrationServiceTests : IntegrationTestBase
{
    [Fact]
    public async Task IsDataMigrationRequiredAsync_WithNoData_ShouldReturnFalse()
    {
        // Arrange & Act
        var isRequired = await WithScopeAsync(async services =>
        {
            var migrationService = services.GetRequiredService<IDataMigrationService>();
            return await migrationService.IsDataMigrationRequiredAsync();
        });

        // Assert
        isRequired.Should().BeFalse();
    }

    [Fact]
    public async Task IsDataMigrationRequiredAsync_WithExistingEntitiesButNoEvents_ShouldReturnTrue()
    {
        // Arrange - Add existing entity without events
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<BookingDbContext>();
            var accommodation = new SleepingAccommodation
            {
                Id = Guid.NewGuid(),
                Name = "Test Room",
                Type = AccommodationType.Room,
                MaxCapacity = 4,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            
            context.SleepingAccommodations.Add(accommodation);
            await context.SaveChangesAsync();
        });

        // Act
        var isRequired = await WithScopeAsync(async services =>
        {
            var migrationService = services.GetRequiredService<IDataMigrationService>();
            return await migrationService.IsDataMigrationRequiredAsync();
        });

        // Assert
        isRequired.Should().BeTrue();
    }

    [Fact]
    public async Task MigrateExistingDataToEventSourcingAsync_WithExistingEntities_ShouldCreateEventsAndReadModels()
    {
        // Arrange - Add existing entities
        var activeAccommodationId = Guid.NewGuid();
        var inactiveAccommodationId = Guid.NewGuid();
        var createdAt = DateTime.UtcNow.AddDays(-1);
        var changedAt = DateTime.UtcNow.AddHours(-1);

        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<BookingDbContext>();
            
            var activeAccommodation = new SleepingAccommodation
            {
                Id = activeAccommodationId,
                Name = "Active Room",
                Type = AccommodationType.Room,
                MaxCapacity = 4,
                IsActive = true,
                CreatedAt = createdAt
            };

            var inactiveAccommodation = new SleepingAccommodation
            {
                Id = inactiveAccommodationId,
                Name = "Inactive Room",
                Type = AccommodationType.Tent,
                MaxCapacity = 2,
                IsActive = false,
                CreatedAt = createdAt,
                ChangedAt = changedAt
            };

            context.SleepingAccommodations.AddRange(activeAccommodation, inactiveAccommodation);
            await context.SaveChangesAsync();
        });

        // Act - Migrate
        await WithScopeAsync(async services =>
        {
            var migrationService = services.GetRequiredService<IDataMigrationService>();
            await migrationService.MigrateExistingDataToEventSourcingAsync();
        });

        // Assert - Check events were created
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<BookingDbContext>();
            
            // Check active accommodation events
            var activeEvents = await context.EventStoreEvents
                .Where(e => e.AggregateId == activeAccommodationId)
                .OrderBy(e => e.Version)
                .ToListAsync();

            activeEvents.Should().HaveCount(1);
            activeEvents.First().EventType.Should().Be("SleepingAccommodationCreated");
            activeEvents.First().AggregateType.Should().Be("SleepingAccommodationAggregate");
            activeEvents.First().Version.Should().Be(0);

            // Check inactive accommodation events
            var inactiveEvents = await context.EventStoreEvents
                .Where(e => e.AggregateId == inactiveAccommodationId)
                .OrderBy(e => e.Version)
                .ToListAsync();

            inactiveEvents.Should().HaveCount(2);
            inactiveEvents.First().EventType.Should().Be("SleepingAccommodationCreated");
            inactiveEvents.Last().EventType.Should().Be("SleepingAccommodationDeactivated");
        });

        // Assert - Check read models were created
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<BookingDbContext>();
            
            var readModels = await context.SleepingAccommodationReadModels
                .OrderBy(rm => rm.Name)
                .ToListAsync();

            readModels.Should().HaveCount(2);

            // Active accommodation read model
            var activeReadModel = readModels.First(rm => rm.Id == activeAccommodationId);
            activeReadModel.Name.Should().Be("Active Room");
            activeReadModel.Type.Should().Be(AccommodationType.Room);
            activeReadModel.MaxCapacity.Should().Be(4);
            activeReadModel.IsActive.Should().BeTrue();
            activeReadModel.CreatedAt.Should().Be(createdAt);
            activeReadModel.ChangedAt.Should().BeNull();
            activeReadModel.LastEventVersion.Should().Be(0);

            // Inactive accommodation read model
            var inactiveReadModel = readModels.First(rm => rm.Id == inactiveAccommodationId);
            inactiveReadModel.Name.Should().Be("Inactive Room");
            inactiveReadModel.Type.Should().Be(AccommodationType.Tent);
            inactiveReadModel.MaxCapacity.Should().Be(2);
            inactiveReadModel.IsActive.Should().BeFalse();
            inactiveReadModel.CreatedAt.Should().Be(createdAt);
            inactiveReadModel.ChangedAt.Should().Be(changedAt);
            inactiveReadModel.LastEventVersion.Should().Be(1);
        });
    }

    [Fact]
    public async Task MigrateExistingDataToEventSourcingAsync_WithExistingReadModels_ShouldUpdateThem()
    {
        // Arrange - Add existing entity and read model
        var accommodationId = Guid.NewGuid();
        var createdAt = DateTime.UtcNow.AddDays(-1);

        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<BookingDbContext>();
            
            var accommodation = new SleepingAccommodation
            {
                Id = accommodationId,
                Name = "Updated Room",
                Type = AccommodationType.Room,
                MaxCapacity = 4,
                IsActive = true,
                CreatedAt = createdAt
            };

            // Add existing read model with different data
            var existingReadModel = new Booking.Api.Domain.ReadModels.SleepingAccommodationReadModel
            {
                Id = accommodationId,
                Name = "Old Name",
                Type = AccommodationType.Tent,
                MaxCapacity = 2,
                IsActive = false,
                CreatedAt = createdAt.AddHours(-1),
                LastEventVersion = -1
            };

            context.SleepingAccommodations.Add(accommodation);
            context.SleepingAccommodationReadModels.Add(existingReadModel);
            await context.SaveChangesAsync();
        });

        // Act - Migrate
        await WithScopeAsync(async services =>
        {
            var migrationService = services.GetRequiredService<IDataMigrationService>();
            await migrationService.MigrateExistingDataToEventSourcingAsync();
        });

        // Assert - Check read model was updated
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<BookingDbContext>();
            
            var readModel = await context.SleepingAccommodationReadModels
                .FirstOrDefaultAsync(rm => rm.Id == accommodationId);

            readModel.Should().NotBeNull();
            readModel!.Name.Should().Be("Updated Room");
            readModel.Type.Should().Be(AccommodationType.Room);
            readModel.MaxCapacity.Should().Be(4);
            readModel.IsActive.Should().BeTrue();
            readModel.CreatedAt.Should().Be(createdAt);
            readModel.LastEventVersion.Should().Be(0);
        });
    }

    [Fact]
    public async Task MigrateExistingDataToEventSourcingAsync_WithNoExistingData_ShouldNotThrow()
    {
        // Arrange - No existing data

        // Act & Assert - Should not throw
        await WithScopeAsync(async services =>
        {
            var migrationService = services.GetRequiredService<IDataMigrationService>();
            var act = async () => await migrationService.MigrateExistingDataToEventSourcingAsync();
            await act.Should().NotThrowAsync();
        });
    }
}