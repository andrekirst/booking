using Booking.Api.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.Admin.Commands;

public record RollbackEventSourcingDataCommand : IRequest<RollbackEventSourcingDataResult>;

public record RollbackEventSourcingDataResult(bool Success, string Message, int RemovedEventsCount, int RemovedReadModelsCount);

public class RollbackEventSourcingDataCommandHandler : IRequestHandler<RollbackEventSourcingDataCommand, RollbackEventSourcingDataResult>
{
    private readonly BookingDbContext _context;
    private readonly ILogger<RollbackEventSourcingDataCommandHandler> _logger;

    public RollbackEventSourcingDataCommandHandler(
        BookingDbContext context,
        ILogger<RollbackEventSourcingDataCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<RollbackEventSourcingDataResult> Handle(
        RollbackEventSourcingDataCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting rollback of Event Sourcing data...");

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            // Remove all SleepingAccommodation-related events
            var eventsToRemove = await _context.EventStoreEvents
                .Where(e => e.AggregateType == "SleepingAccommodationAggregate")
                .ToListAsync(cancellationToken);

            _context.EventStoreEvents.RemoveRange(eventsToRemove);

            // Remove all SleepingAccommodation snapshots
            var snapshotsToRemove = await _context.EventStoreSnapshots
                .Where(s => s.AggregateType == "SleepingAccommodationAggregate")
                .ToListAsync(cancellationToken);

            _context.EventStoreSnapshots.RemoveRange(snapshotsToRemove);

            // Remove all SleepingAccommodation read models
            var readModelsToRemove = await _context.SleepingAccommodationReadModels
                .ToListAsync(cancellationToken);

            _context.SleepingAccommodationReadModels.RemoveRange(readModelsToRemove);

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var message = $"Rollback completed successfully. Removed {eventsToRemove.Count} events, {snapshotsToRemove.Count} snapshots, and {readModelsToRemove.Count} read models.";
            _logger.LogInformation(message);

            return new RollbackEventSourcingDataResult(
                true,
                message,
                eventsToRemove.Count,
                readModelsToRemove.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Event Sourcing data rollback");
            return new RollbackEventSourcingDataResult(
                false,
                $"Rollback failed: {ex.Message}",
                0,
                0);
        }
    }
}