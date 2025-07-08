using System.Net;
using System.Net.Http.Json;
using Booking.Api.Controllers;
using Booking.Api.Data;
using Booking.Api.Tests.Integration.TestBase;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace Booking.Api.Tests.Integration.Controllers;

public class BookingsControllerTests : IntegrationTestBase
{
    [Fact]
    public async Task GetBookings_WithoutToken_ReturnsUnauthorized()
    {
        // Arrange
        RemoveAuthorizationHeader();
        
        // Act
        var response = await Client.GetAsync("/bookings");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
    
    [Fact]
    public async Task GetBookings_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var invalidToken = TokenProvider.GenerateInvalidToken();
        AddAuthorizationHeader(invalidToken);
        
        // Act
        var response = await Client.GetAsync("/bookings");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
    
    [Fact]
    public async Task GetBookings_WithExpiredToken_ReturnsUnauthorized()
    {
        // Arrange
        var expiredToken = TokenProvider.GenerateExpiredToken(1, "test@example.com");
        AddAuthorizationHeader(expiredToken);
        
        // Act
        var response = await Client.GetAsync("/bookings");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
    
    [Fact]
    public async Task GetBookings_WithValidToken_ReturnsOk()
    {
        // Arrange
        var validToken = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(validToken);
        
        // Act
        var response = await Client.GetAsync("/bookings");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<BookingsResponse>();
        content.Should().NotBeNull();
        content!.Count.Should().Be(0);
        content.Bookings.Should().BeEmpty();
    }
    
    [Fact]
    public async Task GetBookings_WithValidToken_ReturnsBookings()
    {
        // Arrange
        var validToken = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(validToken);
        
        // Add test booking
        await WithScopeAsync(async services =>
        {
            var context = services.GetRequiredService<BookingDbContext>();
            context.Bookings.Add(new Booking.Api.Domain.Entities.Booking
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        });
        
        // Act
        var response = await Client.GetAsync("/bookings");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<BookingsResponse>();
        content.Should().NotBeNull();
        content!.Count.Should().Be(1);
        content.Bookings.Should().HaveCount(1);
    }
    
    [Fact]
    public async Task GetBookings_WithAdminRole_ReturnsOk()
    {
        // Arrange
        var adminToken = TokenProvider.GenerateToken(1, "admin@example.com", "Administrator");
        AddAuthorizationHeader(adminToken);
        
        // Act
        var response = await Client.GetAsync("/bookings");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}