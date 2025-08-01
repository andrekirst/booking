using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Features.Bookings.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Testcontainers.PostgreSql;
using Xunit.Abstractions;

namespace Booking.Api.Tests.Integration;

/// <summary>
/// End-to-End Integration Tests für Historie-API
/// Testet vollständige Request-Response-Zyklen mit echter Datenbank
/// </summary>
public class BookingHistoryIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly ITestOutputHelper _output;
    private readonly PostgreSqlContainer _postgres;
    private string _connectionString = string.Empty;

    public BookingHistoryIntegrationTests(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        _output = output;
        _postgres = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("booking_test")
            .WithUsername("test_user")
            .WithPassword("test_password")
            .WithCleanUp(true)
            .Build();

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext registration
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<BookingDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add test database
                services.AddDbContext<BookingDbContext>(options =>
                    options.UseNpgsql(_connectionString));

                // Reduce logging noise in tests
                services.AddLogging(loggingBuilder => loggingBuilder.SetMinimumLevel(LogLevel.Warning));
            });
        });

        _client = _factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _connectionString = _postgres.GetConnectionString();

        // Initialize database schema
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        await context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        await _postgres.StopAsync();
    }

    [Fact]
    public async Task GetBookingHistory_CompleteWorkflow_ReturnsCorrectData()
    {
        // Arrange - Create test data in database
        var bookingId = Guid.NewGuid();
        var userId = await CreateTestUserAndBooking(bookingId);
        await CreateBookingEventHistory(bookingId);

        var authToken = await GetAuthToken(userId);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.GetAsync($"/api/bookings/{bookingId}/history");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var historyDto = JsonSerializer.Deserialize<BookingHistoryDto>(responseContent, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(historyDto);
        Assert.Equal(bookingId, historyDto.BookingId);
        Assert.True(historyDto.History.Count >= 3); // Created, Updated, Confirmed events
        
        // Verify chronological order (newest first)
        for (int i = 0; i < historyDto.History.Count - 1; i++)
        {
            Assert.True(historyDto.History[i].Timestamp >= historyDto.History[i + 1].Timestamp,
                "History should be in descending chronological order");
        }
    }

    [Fact]
    public async Task GetBookingHistory_WithPagination_ReturnsCorrectPages()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = await CreateTestUserAndBooking(bookingId);
        
        // Create 25 events for robust pagination testing
        await CreateLargeBookingEventHistory(bookingId, eventCount: 25);

        var authToken = await GetAuthToken(userId);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);

        // Act - Test first page
        var page1Response = await _client.GetAsync($"/api/bookings/{bookingId}/history?page=1&pageSize=10");
        var page1Content = await page1Response.Content.ReadAsStringAsync();
        var page1History = JsonSerializer.Deserialize<BookingHistoryDto>(page1Content, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Act - Test second page  
        var page2Response = await _client.GetAsync($"/api/bookings/{bookingId}/history?page=2&pageSize=10");
        var page2Content = await page2Response.Content.ReadAsStringAsync();
        var page2History = JsonSerializer.Deserialize<BookingHistoryDto>(page2Content, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Assert
        Assert.Equal(HttpStatusCode.OK, page1Response.StatusCode);
        Assert.Equal(HttpStatusCode.OK, page2Response.StatusCode);
        
        Assert.NotNull(page1History);
        Assert.NotNull(page2History);
        
        Assert.Equal(10, page1History.History.Count); // Full page
        Assert.Equal(10, page2History.History.Count); // Full page
        
        // Verify no overlap between pages
        var page1EventIds = page1History.History.Select(h => h.EventType + h.Timestamp).ToHashSet();
        var page2EventIds = page2History.History.Select(h => h.EventType + h.Timestamp).ToHashSet();
        Assert.Empty(page1EventIds.Intersect(page2EventIds));
    }

    [Fact]
    public async Task GetBookingHistory_UnauthorizedUser_ReturnsForbidden()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var bookingOwnerId = await CreateTestUserAndBooking(bookingId);
        var otherUserId = await CreateTestUser("other@example.com");

        var authToken = await GetAuthToken(otherUserId);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.GetAsync($"/api/bookings/{bookingId}/history");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetBookingHistory_AdminUser_CanAccessAnyBooking()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var bookingOwnerId = await CreateTestUserAndBooking(bookingId);
        var adminUserId = await CreateTestUser("admin@example.com", isAdmin: true);
        await CreateBookingEventHistory(bookingId);

        var adminToken = await GetAuthToken(adminUserId);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        // Act
        var response = await _client.GetAsync($"/api/bookings/{bookingId}/history");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var historyDto = JsonSerializer.Deserialize<BookingHistoryDto>(responseContent, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(historyDto);
        Assert.Equal(bookingId, historyDto.BookingId);
    }

    [Fact]
    public async Task GetBookingHistory_NonExistentBooking_ReturnsNotFound()
    {
        // Arrange
        var nonExistentBookingId = Guid.NewGuid();
        var userId = await CreateTestUser("test@example.com");

        var authToken = await GetAuthToken(userId);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.GetAsync($"/api/bookings/{nonExistentBookingId}/history");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData(0, 20)]     // Invalid page number
    [InlineData(-1, 20)]    // Negative page
    [InlineData(1, 0)]      // Invalid page size
    [InlineData(1, 101)]    // Page size too large
    public async Task GetBookingHistory_InvalidPaginationParameters_ReturnsBadRequest(int page, int pageSize)
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = await CreateTestUserAndBooking(bookingId);

        var authToken = await GetAuthToken(userId);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);

        // Act
        var response = await _client.GetAsync($"/api/bookings/{bookingId}/history?page={page}&pageSize={pageSize}");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetBookingHistory_HighConcurrency_HandlesMultipleSimultaneousRequests()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = await CreateTestUserAndBooking(bookingId);
        await CreateBookingEventHistory(bookingId);

        var authToken = await GetAuthToken(userId);
        
        const int concurrentRequests = 20;
        var tasks = new List<Task<HttpResponseMessage>>();

        // Act - Send multiple concurrent requests
        for (int i = 0; i < concurrentRequests; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                using var client = _factory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authToken);
                return await client.GetAsync($"/api/bookings/{bookingId}/history");
            }));
        }

        var responses = await Task.WhenAll(tasks);

        // Assert
        var successfulResponses = responses.Where(r => r.StatusCode == HttpStatusCode.OK).ToList();
        Assert.Equal(concurrentRequests, successfulResponses.Count);

        // Verify all responses have consistent data
        var historyContents = new List<BookingHistoryDto>();
        foreach (var response in successfulResponses)
        {
            var content = await response.Content.ReadAsStringAsync();
            var history = JsonSerializer.Deserialize<BookingHistoryDto>(content, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            historyContents.Add(history!);
        }

        // All responses should have the same booking ID and similar history counts
        Assert.All(historyContents, h => Assert.Equal(bookingId, h.BookingId));
        var expectedHistoryCount = historyContents.First().History.Count;
        Assert.All(historyContents, h => Assert.Equal(expectedHistoryCount, h.History.Count));

        // Cleanup
        foreach (var response in responses)
            response.Dispose();
    }

    private async Task<int> CreateTestUserAndBooking(Guid bookingId)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        var user = new User
        {
            FirstName = "Test",
            LastName = "User",
            Email = "test@example.com",
            EmailVerified = true,
            IsApprovedForBooking = true,
            Role = Booking.Api.Domain.Enums.UserRole.Member,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return user.Id;
    }

    private async Task<int> CreateTestUser(string email, bool isAdmin = false)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        var user = new User
        {
            FirstName = "Test",
            LastName = "User",
            Email = email,
            EmailVerified = true,
            IsApprovedForBooking = true,
            Role = isAdmin ? Booking.Api.Domain.Enums.UserRole.Administrator : Booking.Api.Domain.Enums.UserRole.Member,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return user.Id;
    }

    private async Task CreateBookingEventHistory(Guid bookingId)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        var events = new[]
        {
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingCreated",
                EventData = JsonSerializer.Serialize(new { BookingId = bookingId, Status = "Pending" }),
                Version = 1,
                Timestamp = DateTime.UtcNow.AddHours(-3)
            },
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingUpdated",
                EventData = JsonSerializer.Serialize(new { BookingId = bookingId, Status = "Pending" }),
                Version = 2,
                Timestamp = DateTime.UtcNow.AddHours(-2)
            },
            new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = "BookingConfirmed",
                EventData = JsonSerializer.Serialize(new { BookingId = bookingId, Status = "Confirmed" }),
                Version = 3,
                Timestamp = DateTime.UtcNow.AddHours(-1)
            }
        };

        context.EventStoreEvents.AddRange(events);
        await context.SaveChangesAsync();
    }

    private async Task CreateLargeBookingEventHistory(Guid bookingId, int eventCount)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        var events = new List<EventStoreEvent>();
        var eventTypes = new[] { "BookingCreated", "BookingUpdated", "BookingConfirmed", "BookingCancelled" };

        for (int i = 1; i <= eventCount; i++)
        {
            events.Add(new EventStoreEvent
            {
                Id = Guid.NewGuid(),
                AggregateId = bookingId,
                AggregateType = "BookingAggregate",
                EventType = eventTypes[i % eventTypes.Length],
                EventData = JsonSerializer.Serialize(new { BookingId = bookingId, Version = i }),
                Version = i,
                Timestamp = DateTime.UtcNow.AddMinutes(-eventCount + i)
            });
        }

        context.EventStoreEvents.AddRange(events);
        await context.SaveChangesAsync();
    }

    private static Task<string> GetAuthToken(int userId)
    {
        // Mock JWT token generation for testing
        // In real implementation, this would authenticate and return actual JWT
        return Task.FromResult($"test-token-user-{userId}");
    }
}