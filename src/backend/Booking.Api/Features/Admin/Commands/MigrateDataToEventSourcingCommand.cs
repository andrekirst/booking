using Booking.Api.Services.DataMigration;
using MediatR;

namespace Booking.Api.Features.Admin.Commands;

public record MigrateDataToEventSourcingCommand : IRequest<MigrateDataToEventSourcingResult>;

public record MigrateDataToEventSourcingResult(bool WasRequired, bool Success, string Message);

public class MigrateDataToEventSourcingCommandHandler(
    IDataMigrationService migrationService,
    ILogger<MigrateDataToEventSourcingCommandHandler> logger)
    : IRequestHandler<MigrateDataToEventSourcingCommand, MigrateDataToEventSourcingResult>
{
    public async Task<MigrateDataToEventSourcingResult> Handle(
        MigrateDataToEventSourcingCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var isRequired = await migrationService.IsDataMigrationRequiredAsync();
            
            if (!isRequired)
            {
                return new MigrateDataToEventSourcingResult(
                    false,
                    true,
                    "No data migration required. Event sourcing data is already up to date.");
            }

            await migrationService.MigrateExistingDataToEventSourcingAsync();

            return new MigrateDataToEventSourcingResult(
                true,
                true,
                "Data migration completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during manual data migration");
            return new MigrateDataToEventSourcingResult(
                true,
                false,
                $"Data migration failed: {ex.Message}");
        }
    }
}