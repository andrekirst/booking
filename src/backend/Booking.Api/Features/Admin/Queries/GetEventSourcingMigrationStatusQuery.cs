using Booking.Api.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.Admin.Queries;

public record GetEventSourcingMigrationStatusQuery : IRequest<EventSourcingMigrationStatus>;

public record EventSourcingMigrationStatus(
    bool MigrationRequired,
    int ExistingEntitiesCount,
    int EventsCount,
    int ReadModelsCount,
    string Status);

public class GetEventSourcingMigrationStatusQueryHandler(BookingDbContext context) : IRequestHandler<GetEventSourcingMigrationStatusQuery, EventSourcingMigrationStatus>
{
    public async Task<EventSourcingMigrationStatus> Handle(
        GetEventSourcingMigrationStatusQuery request,
        CancellationToken cancellationToken)
    {
        // Count existing entities
        var existingEntitiesCount = await context.SleepingAccommodations.CountAsync(cancellationToken);
        
        // Count events
        var eventsCount = await context.EventStoreEvents
            .Where(e => e.AggregateType == "SleepingAccommodationAggregate")
            .CountAsync(cancellationToken);
            
        // Count read models
        var readModelsCount = await context.SleepingAccommodationReadModels.CountAsync(cancellationToken);

        // Determine migration status
        var migrationRequired = existingEntitiesCount > 0 && (eventsCount == 0 || readModelsCount == 0);
        
        string status;
        if (existingEntitiesCount == 0 && eventsCount == 0 && readModelsCount == 0)
        {
            status = "No data found";
        }
        else if (migrationRequired)
        {
            status = "Migration required - existing entities need to be converted to events";
        }
        else if (eventsCount > 0 && readModelsCount > 0)
        {
            status = "Event sourcing is active and up to date";
        }
        else
        {
            status = "Inconsistent state - please check data";
        }

        return new EventSourcingMigrationStatus(
            migrationRequired,
            existingEntitiesCount,
            eventsCount,
            readModelsCount,
            status);
    }
}