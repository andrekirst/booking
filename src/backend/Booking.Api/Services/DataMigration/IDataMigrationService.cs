namespace Booking.Api.Services.DataMigration;

public interface IDataMigrationService
{
    Task MigrateExistingDataToEventSourcingAsync();
    Task<bool> IsDataMigrationRequiredAsync();
}