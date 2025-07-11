using Booking.Api.Data;
using Booking.Api.Tests.Integration.TestBase;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Booking.Api.Tests.Integration.Database;

public class DatabaseMigrationTests : IntegrationTestBase
{
    [Fact]
    public async Task Database_ShouldApplyAllMigrations_OnStartup()
    {
        // Arrange & Act - Database migrations are applied in IntegrationTestBase
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Assert - Check if all migrations are applied
        var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
        pendingMigrations.Should().BeEmpty("all migrations should be applied on startup");
    }

    [Fact]
    public async Task Database_ShouldCreateAllRequiredTables()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Act - Get list of tables
        var tables = await GetDatabaseTablesAsync(context);

        // Assert - Verify all expected tables exist
        tables.Should().Contain("Users");
        tables.Should().Contain("Bookings");
        tables.Should().Contain("__EFMigrationsHistory");
    }

    [Fact]
    public async Task BookingsTable_ShouldHaveCorrectSchema()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Act - Get column information for Bookings table
        var columns = await GetTableColumnsAsync(context, "Bookings");

        // Assert - Verify all expected columns exist
        columns.Should().Contain(c => c.ColumnName == "Id" && c.DataType == "uuid");
        columns.Should().Contain(c => c.ColumnName == "CreatedAt" && c.DataType == "timestamp without time zone");
        columns.Should().Contain(c => c.ColumnName == "ChangedAt" && c.DataType == "timestamp without time zone");
    }

    [Fact]
    public async Task UsersTable_ShouldHaveCorrectSchema()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Act - Get column information for Users table
        var columns = await GetTableColumnsAsync(context, "Users");

        // Assert - Verify all expected columns exist
        columns.Should().Contain(c => c.ColumnName == "Id" && c.DataType == "integer");
        columns.Should().Contain(c => c.ColumnName == "Email" && c.DataType == "character varying");
        columns.Should().Contain(c => c.ColumnName == "PasswordHash" && c.DataType == "character varying");
        columns.Should().Contain(c => c.ColumnName == "FirstName" && c.DataType == "character varying");
        columns.Should().Contain(c => c.ColumnName == "LastName" && c.DataType == "character varying");
        columns.Should().Contain(c => c.ColumnName == "Role" && c.DataType == "character varying");
        columns.Should().Contain(c => c.ColumnName == "IsActive" && c.DataType == "boolean");
        columns.Should().Contain(c => c.ColumnName == "CreatedAt" && c.DataType == "timestamp without time zone");
        columns.Should().Contain(c => c.ColumnName == "ChangedAt" && c.DataType == "timestamp without time zone");
    }

    [Fact]
    public async Task Database_ShouldHandleConcurrentMigrations()
    {
        // This test ensures that if multiple instances try to migrate at the same time,
        // it doesn't cause issues (important for production deployments)
        
        // Arrange
        var tasks = new List<Task>();
        
        // Act - Try to apply migrations from multiple threads
        for (int i = 0; i < 3; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                using var scope = Factory.Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
                await context.Database.MigrateAsync();
            }));
        }

        // Assert - All tasks should complete without throwing
        var allTasks = Task.WhenAll(tasks);
        await allTasks.Invoking(t => t).Should().NotThrowAsync();
    }

    private async Task<List<string>> GetDatabaseTablesAsync(BookingDbContext context)
    {
        var tables = new List<string>();
        
        await using var command = context.Database.GetDbConnection().CreateCommand();
        command.CommandText = @"
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'";
        
        await context.Database.OpenConnectionAsync();
        await using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }
        
        return tables;
    }

    private async Task<List<ColumnInfo>> GetTableColumnsAsync(BookingDbContext context, string tableName)
    {
        var columns = new List<ColumnInfo>();
        
        await using var command = context.Database.GetDbConnection().CreateCommand();
        command.CommandText = @"
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = @tableName
            ORDER BY ordinal_position";
        
        var parameter = command.CreateParameter();
        parameter.ParameterName = "@tableName";
        parameter.Value = tableName;
        command.Parameters.Add(parameter);
        
        await context.Database.OpenConnectionAsync();
        await using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync())
        {
            columns.Add(new ColumnInfo
            {
                ColumnName = reader.GetString(0),
                DataType = reader.GetString(1),
                IsNullable = reader.GetString(2) == "YES"
            });
        }
        
        return columns;
    }

    private record ColumnInfo
    {
        public required string ColumnName { get; init; }
        public required string DataType { get; init; }
        public bool IsNullable { get; init; }
    }
}