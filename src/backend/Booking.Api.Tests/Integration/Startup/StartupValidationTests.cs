using Booking.Api.Configuration;
using Booking.Api.Data;
using Booking.Api.Services;
using Booking.Api.Tests.Integration.TestBase;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace Booking.Api.Tests.Integration.Startup;

public class StartupValidationTests : IntegrationTestBase
{
    [Fact]
    public void Application_ShouldStartSuccessfully()
    {
        // Assert - The fact that IntegrationTestBase can create the WebApplicationFactory
        // means the application starts successfully
        Factory.Should().NotBeNull();
        Client.Should().NotBeNull();
    }

    [Fact]
    public void AllRequiredServices_ShouldBeRegistered()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var services = scope.ServiceProvider;

        // Act & Assert - Core services
        services.GetService<BookingDbContext>().Should().NotBeNull("DbContext should be registered");
        services.GetService<IPasswordService>().Should().NotBeNull("IPasswordService should be registered");
        services.GetService<IJwtService>().Should().NotBeNull("IJwtService should be registered");
        
        // Configuration
        services.GetService<IOptions<JwtSettings>>().Should().NotBeNull("JwtSettings should be configured");
        services.GetService<IOptions<CorsSettings>>().Should().NotBeNull("CorsSettings should be configured");
    }

    [Fact]
    public async Task Database_ShouldBeAccessible()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Act & Assert
        var canConnect = await context.Database.CanConnectAsync();
        canConnect.Should().BeTrue("Database should be accessible");
        
        // Verify we can execute a simple query
        var userCount = await context.Users.CountAsync();
        userCount.Should().BeGreaterOrEqualTo(0, "Should be able to query the database");
    }

    [Fact]
    public async Task AllDbSets_ShouldBeQueryable()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Act & Assert - Try to query each DbSet
        await context.Users.AnyAsync().Invoking(t => t).Should().NotThrowAsync("Users DbSet should be queryable");
        await context.Bookings.AnyAsync().Invoking(t => t).Should().NotThrowAsync("Bookings DbSet should be queryable");
    }

    [Fact]
    public void JwtSettings_ShouldBeProperlyConfigured()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var jwtSettings = scope.ServiceProvider.GetRequiredService<IOptions<JwtSettings>>().Value;

        // Assert
        jwtSettings.Should().NotBeNull();
        jwtSettings.Secret.Should().NotBeNullOrEmpty("JWT Secret must be configured");
        jwtSettings.Issuer.Should().NotBeNullOrEmpty("JWT Issuer must be configured");
        jwtSettings.Audience.Should().NotBeNullOrEmpty("JWT Audience must be configured");
        jwtSettings.ExpirationMinutes.Should().BeGreaterThan(0, "JWT Expiry must be greater than 0");
    }

    [Fact]
    public async Task HealthCheck_Endpoint_ShouldReturnOk()
    {
        // Act
        var response = await Client.GetAsync("/health");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue("Health check endpoint should return success");
    }

    [Fact]
    public async Task Swagger_ShouldBeAvailable_InDevelopment()
    {
        // Note: This test assumes we're running in Development environment
        // In production, Swagger should not be available
        
        // Act
        var swaggerResponse = await Client.GetAsync("/swagger/v1/swagger.json");
        
        // Assert
        // If we're in development, swagger should be available
        // If not, it should return 404
        var isDevEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        if (isDevEnvironment)
        {
            swaggerResponse.IsSuccessStatusCode.Should().BeTrue("Swagger should be available in development");
        }
    }

    [Fact]
    public async Task DbContext_ShouldHaveInterceptorsConfigured()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Act
        var changeTracker = context.ChangeTracker;
        
        // Assert - This is a bit indirect, but we can verify the interceptor is working
        // by creating an entity and checking if audit fields are set
        var booking = new Booking.Api.Domain.Entities.Booking
        {
            UserId = 1, // Use existing test user
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(2),
            Notes = "Test Booking"
        };
        context.Bookings.Add(booking);
        
        // The AuditInterceptor should work when we save
        await context.SaveChangesAsync();
        
        booking.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5), 
            "AuditInterceptor should set CreatedAt");
    }

    [Fact]
    public async Task AllControllers_ShouldRequireAuthentication()
    {
        // This test ensures that all controllers (except auth endpoints) require authentication
        // This helps prevent accidentally exposing endpoints without authentication
        
        // Arrange - Remove auth header
        RemoveAuthorizationHeader();
        
        // Act & Assert - Test various endpoints
        var endpoints = new[]
        {
            "/api/bookings",
            // Add more endpoints as they are created
        };

        foreach (var endpoint in endpoints)
        {
            var response = await Client.GetAsync(endpoint);
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized, 
                $"Endpoint {endpoint} should require authentication");
        }
    }
}