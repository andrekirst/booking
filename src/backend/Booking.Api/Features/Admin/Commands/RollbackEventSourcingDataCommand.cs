using Booking.Api.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.Admin.Commands;

public record RollbackEventSourcingDataCommand : IRequest<RollbackEventSourcingDataResult>;

public record RollbackEventSourcingDataResult(bool Success, string Message, int RemovedEventsCount, int RemovedReadModelsCount);

public class RollbackEventSourcingDataCommandHandler(
    BookingDbContext context,
    ILogger<RollbackEventSourcingDataCommandHandler> logger)
    : IRequestHandler<RollbackEventSourcingDataCommand, RollbackEventSourcingDataResult>
{
    public async Task<RollbackEventSourcingDataResult> Handle(
        RollbackEventSourcingDataCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Starting rollback of Event Sourcing data...");

            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

            // Remove all SleepingAccommodation-related events
            var eventsToRemove = await context.EventStoreEvents
                .Where(e => e.AggregateType == "SleepingAccommodationAggregate")
                .ToListAsync(cancellationToken);

            context.EventStoreEvents.RemoveRange(eventsToRemove);

            // Remove all SleepingAccommodation snapshots
            var snapshotsToRemove = await context.EventStoreSnapshots
                .Where(s => s.AggregateType == "SleepingAccommodationAggregate")
                .ToListAsync(cancellationToken);

            context.EventStoreSnapshots.RemoveRange(snapshotsToRemove);

            // Remove all SleepingAccommodation read models
            var readModelsToRemove = await context.SleepingAccommodationReadModels
                .ToListAsync(cancellationToken);

            context.SleepingAccommodationReadModels.RemoveRange(readModelsToRemove);

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var message = $"Rollback completed successfully. Removed {eventsToRemove.Count} events, {snapshotsToRemove.Count} snapshots, and {readModelsToRemove.Count} read models.";
            logger.LogInformation(message);

            return new RollbackEventSourcingDataResult(
                true,
                message,
                eventsToRemove.Count,
                readModelsToRemove.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during Event Sourcing data rollback");
            return new RollbackEventSourcingDataResult(
                false,
                $"Rollback failed: {ex.Message}",
                0,
                0);
        }
    }
}