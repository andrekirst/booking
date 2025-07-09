using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Booking.Api.Services.DataMigration;

public class DataMigrationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DataMigrationBackgroundService> _logger;

    public DataMigrationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<DataMigrationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait a bit to ensure the application is fully started
        await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);

        using var scope = _serviceProvider.CreateScope();
        var migrationService = scope.ServiceProvider.GetRequiredService<IDataMigrationService>();

        try
        {
            _logger.LogInformation("Checking if data migration is required...");

            if (await migrationService.IsDataMigrationRequiredAsync())
            {
                _logger.LogInformation("Data migration is required. Starting migration process...");
                await migrationService.MigrateExistingDataToEventSourcingAsync();
                _logger.LogInformation("Data migration completed successfully.");
            }
            else
            {
                _logger.LogInformation("No data migration required. Event sourcing data is up to date.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during data migration process");
            // Don't throw here - let the application continue running
        }
    }
}