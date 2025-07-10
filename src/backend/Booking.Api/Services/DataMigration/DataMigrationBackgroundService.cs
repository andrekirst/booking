using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Booking.Api.Services.DataMigration;

public class DataMigrationBackgroundService(
    IServiceProvider serviceProvider,
    ILogger<DataMigrationBackgroundService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait a bit to ensure the application is fully started
        await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);

        using var scope = serviceProvider.CreateScope();
        var migrationService = scope.ServiceProvider.GetRequiredService<IDataMigrationService>();

        try
        {
            logger.LogInformation("Checking if data migration is required...");

            if (await migrationService.IsDataMigrationRequiredAsync())
            {
                logger.LogInformation("Data migration is required. Starting migration process...");
                await migrationService.MigrateExistingDataToEventSourcingAsync();
                logger.LogInformation("Data migration completed successfully.");
            }
            else
            {
                logger.LogInformation("No data migration required. Event sourcing data is up to date.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during data migration process");
            // Don't throw here - let the application continue running
        }
    }
}