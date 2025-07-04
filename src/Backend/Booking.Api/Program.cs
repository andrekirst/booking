using Booking.Api.Data;
using Booking.Api.Services;
using Npgsql;

namespace Booking.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        
        // Configure logging
        builder.Logging.ClearProviders();
        builder.Logging.AddConsole();
        
        // Configure PostgreSQL connection
        var connectionString = builder.Configuration.GetConnectionString("Main") 
            ?? throw new InvalidOperationException("Connection string 'Main' not found.");
        
        // Add pooled NpgsqlDataSource
        builder.Services.AddNpgsqlDataSource(connectionString);
        
        // Register services
        builder.Services.AddScoped<IBookingRepository, BookingRepository>();
        builder.Services.AddScoped<IBookingService, BookingService>();
        
        var app = builder.Build();
        
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        
        // Health check endpoint
        app.MapGet("/health", () => 
        {
            logger.LogInformation("Health check endpoint called");
            return Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        });
        
        // Default endpoint
        app.MapGet("/", () => "Booking API is running");
        
        logger.LogInformation("Booking API starting...");
        app.Run();
    }
}
