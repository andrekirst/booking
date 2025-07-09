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

public class GetEventSourcingMigrationStatusQueryHandler : IRequestHandler<GetEventSourcingMigrationStatusQuery, EventSourcingMigrationStatus>
{
    private readonly BookingDbContext _context;

    public GetEventSourcingMigrationStatusQueryHandler(BookingDbContext context)
    {
        _context = context;
    }

    public async Task<EventSourcingMigrationStatus> Handle(
        GetEventSourcingMigrationStatusQuery request,
        CancellationToken cancellationToken)
    {
        // Count existing entities
        var existingEntitiesCount = await _context.SleepingAccommodations.CountAsync(cancellationToken);
        
        // Count events
        var eventsCount = await _context.EventStoreEvents
            .Where(e => e.AggregateType == "SleepingAccommodationAggregate")
            .CountAsync(cancellationToken);
            
        // Count read models
        var readModelsCount = await _context.SleepingAccommodationReadModels.CountAsync(cancellationToken);

        // Determine migration status
        bool migrationRequired = existingEntitiesCount > 0 && (eventsCount == 0 || readModelsCount == 0);
        
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