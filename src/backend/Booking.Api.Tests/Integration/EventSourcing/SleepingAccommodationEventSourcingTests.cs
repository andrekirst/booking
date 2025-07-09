using Booking.Api.Domain.Enums;
using Booking.Api.Features.SleepingAccommodations.Commands;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Features.SleepingAccommodations.Queries;
using Booking.Api.Tests.Integration.TestBase;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Booking.Api.Tests.Integration.EventSourcing;

public class SleepingAccommodationEventSourcingTests : IntegrationTestBase
{
    [Fact]
    public async Task CreateSleepingAccommodation_ShouldCreateEventsAndReadModel()
    {
        // Arrange
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        var createCommand = new CreateSleepingAccommodationCommand(createDto);

        // Act
        var result = await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            return await mediator.Send(createCommand);
        });

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.Name.Should().Be("Test Room");
        result.Type.Should().Be(AccommodationType.Room);
        result.MaxCapacity.Should().Be(4);
        result.IsActive.Should().BeTrue();

        // Verify events were created
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<Booking.Api.Data.BookingDbContext>();
            var events = await context.EventStoreEvents
                .Where(e => e.AggregateId == result.Id)
                .ToListAsync();

            events.Should().HaveCount(1);
            events.First().EventType.Should().Be("SleepingAccommodationCreated");
            events.First().AggregateType.Should().Be("SleepingAccommodationAggregate");
        });

        // Verify read model was created
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<Booking.Api.Data.BookingDbContext>();
            var readModel = await context.SleepingAccommodationReadModels
                .FirstOrDefaultAsync(rm => rm.Id == result.Id);

            readModel.Should().NotBeNull();
            readModel!.Name.Should().Be("Test Room");
            readModel.Type.Should().Be(AccommodationType.Room);
            readModel.MaxCapacity.Should().Be(4);
            readModel.IsActive.Should().BeTrue();
            readModel.LastEventVersion.Should().Be(0);
        });
    }

    [Fact]
    public async Task UpdateSleepingAccommodation_ShouldCreateUpdateEventAndUpdateReadModel()
    {
        // Arrange - Create first
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Original Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        var accommodationId = await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            var createCommand = new CreateSleepingAccommodationCommand(createDto);
            var result = await mediator.Send(createCommand);
            return result.Id;
        });

        // Act - Update
        var updateDto = new UpdateSleepingAccommodationDto
        {
            Name = "Updated Room",
            Type = AccommodationType.Tent,
            MaxCapacity = 2,
            IsActive = true
        };

        var updateCommand = new UpdateSleepingAccommodationCommand(accommodationId, updateDto);

        var updateResult = await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            return await mediator.Send(updateCommand);
        });

        // Assert
        updateResult.Should().NotBeNull();
        updateResult!.Id.Should().Be(accommodationId);
        updateResult.Name.Should().Be("Updated Room");
        updateResult.Type.Should().Be(AccommodationType.Tent);
        updateResult.MaxCapacity.Should().Be(2);
        updateResult.IsActive.Should().BeTrue();

        // Verify events were created
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<Booking.Api.Data.BookingDbContext>();
            var events = await context.EventStoreEvents
                .Where(e => e.AggregateId == accommodationId)
                .OrderBy(e => e.Version)
                .ToListAsync();

            events.Should().HaveCount(2);
            events.First().EventType.Should().Be("SleepingAccommodationCreated");
            events.Last().EventType.Should().Be("SleepingAccommodationUpdated");
        });

        // Verify read model was updated
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<Booking.Api.Data.BookingDbContext>();
            var readModel = await context.SleepingAccommodationReadModels
                .FirstOrDefaultAsync(rm => rm.Id == accommodationId);

            readModel.Should().NotBeNull();
            readModel!.Name.Should().Be("Updated Room");
            readModel.Type.Should().Be(AccommodationType.Tent);
            readModel.MaxCapacity.Should().Be(2);
            readModel.IsActive.Should().BeTrue();
            readModel.LastEventVersion.Should().Be(1);
        });
    }

    [Fact]
    public async Task DeleteSleepingAccommodation_ShouldCreateDeactivatedEventAndUpdateReadModel()
    {
        // Arrange - Create first
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        var accommodationId = await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            var createCommand = new CreateSleepingAccommodationCommand(createDto);
            var result = await mediator.Send(createCommand);
            return result.Id;
        });

        // Act - Delete (deactivate)
        var deleteCommand = new DeleteSleepingAccommodationCommand(accommodationId);

        var deleteResult = await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            return await mediator.Send(deleteCommand);
        });

        // Assert
        deleteResult.Should().BeTrue();

        // Verify deactivated event was created
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<Booking.Api.Data.BookingDbContext>();
            var events = await context.EventStoreEvents
                .Where(e => e.AggregateId == accommodationId)
                .OrderBy(e => e.Version)
                .ToListAsync();

            events.Should().HaveCount(2);
            events.First().EventType.Should().Be("SleepingAccommodationCreated");
            events.Last().EventType.Should().Be("SleepingAccommodationDeactivated");
        });

        // Verify read model was updated
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<Booking.Api.Data.BookingDbContext>();
            var readModel = await context.SleepingAccommodationReadModels
                .FirstOrDefaultAsync(rm => rm.Id == accommodationId);

            readModel.Should().NotBeNull();
            readModel!.IsActive.Should().BeFalse();
            readModel.LastEventVersion.Should().Be(1);
        });
    }

    [Fact]
    public async Task GetSleepingAccommodations_ShouldReturnFromReadModel()
    {
        // Arrange - Create a sleeping accommodation
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            var createCommand = new CreateSleepingAccommodationCommand(createDto);
            await mediator.Send(createCommand);
        });

        // Act - Query accommodations
        var query = new GetSleepingAccommodationsQuery();
        var result = await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            return await mediator.Send(query);
        });

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Test Room");
        result.First().Type.Should().Be(AccommodationType.Room);
        result.First().MaxCapacity.Should().Be(4);
        result.First().IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task GetSleepingAccommodationById_ShouldReturnFromReadModel()
    {
        // Arrange - Create a sleeping accommodation
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        var accommodationId = await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            var createCommand = new CreateSleepingAccommodationCommand(createDto);
            var result = await mediator.Send(createCommand);
            return result.Id;
        });

        // Act - Query by ID
        var query = new GetSleepingAccommodationByIdQuery(accommodationId);
        var result = await WithScopeAsync(async services =>
        {
            var mediator = services.GetRequiredService<MediatR.IMediator>();
            return await mediator.Send(query);
        });

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(accommodationId);
        result.Name.Should().Be("Test Room");
        result.Type.Should().Be(AccommodationType.Room);
        result.MaxCapacity.Should().Be(4);
        result.IsActive.Should().BeTrue();
    }
}