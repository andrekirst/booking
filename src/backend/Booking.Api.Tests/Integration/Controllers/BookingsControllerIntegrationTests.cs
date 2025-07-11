using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Booking.Api.Data;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Tests.Integration.TestBase;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Booking.Api.Tests.Integration.Controllers;

public class BookingsControllerIntegrationTests : IntegrationTestBase
{
    [Fact]
    public async Task CreateBooking_WithValidData_ShouldCreateBookingAndReturnDto()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(token);

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        var request = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            "Test Buchung",
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );

        // Act
        var response = await Client.PostAsJsonAsync("/api/bookings", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<BookingDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        result.Should().NotBeNull();
        result!.Id.Should().NotBeEmpty();
        result.UserId.Should().Be(1);
        result.StartDate.Should().Be(request.StartDate);
        result.EndDate.Should().Be(request.EndDate);
        result.Status.Should().Be(BookingStatus.Pending);
        result.Notes.Should().Be("Test Buchung");
        result.TotalPersons.Should().Be(2);

        // Verify Location header
        response.Headers.Location.Should().NotBeNull();
        response.Headers.Location!.ToString().Should().Contain($"/api/bookings/{result.Id}");
    }

    [Fact]
    public async Task CreateBooking_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            null,
            new List<CreateBookingItemDto>
            {
                new(Guid.NewGuid(), 2)
            }
        );

        // Act
        var response = await Client.PostAsJsonAsync("/api/bookings", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateBooking_WithPastStartDate_ShouldReturnBadRequest()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(token);

        var request = new CreateBookingDto(
            DateTime.UtcNow.AddDays(-1), // Datum in der Vergangenheit
            DateTime.UtcNow.AddDays(3),
            null,
            new List<CreateBookingItemDto>
            {
                new(Guid.NewGuid(), 2)
            }
        );

        // Act
        var response = await Client.PostAsJsonAsync("/api/bookings", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetBookings_AsRegularUser_ShouldReturnOnlyOwnBookings()
    {
        // Arrange
        var user1Token = TokenProvider.GenerateToken(2, "user1@example.com");
        var user2Token = TokenProvider.GenerateToken(3, "user2@example.com");

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        // Erstelle Buchung für User 1
        AddAuthorizationHeader(user1Token);
        var booking1Request = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            "Buchung von User 1",
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );
        await Client.PostAsJsonAsync("/api/bookings", booking1Request);

        // Erstelle Buchung für User 2
        AddAuthorizationHeader(user2Token);
        var booking2Request = new CreateBookingDto(
            DateTime.UtcNow.AddDays(5),
            DateTime.UtcNow.AddDays(7),
            "Buchung von User 2",
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 1)
            }
        );
        await Client.PostAsJsonAsync("/api/bookings", booking2Request);

        // Act - User 1 ruft seine Buchungen ab
        AddAuthorizationHeader(user1Token);
        var response = await Client.GetAsync("/api/bookings");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<List<BookingDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        result.Should().NotBeNull();
        result!.Should().HaveCount(1);
        result.First().UserId.Should().Be(2);
        result.First().Notes.Should().Be("Buchung von User 1");
    }

    [Fact]
    public async Task GetBookings_AsAdmin_ShouldReturnAllBookings()
    {
        // Arrange
        var adminToken = TokenProvider.GenerateToken(4, "admin@example.com", "Administrator");
        var userToken = TokenProvider.GenerateToken(5, "user@example.com");

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        // Erstelle Buchung als normaler User
        AddAuthorizationHeader(userToken);
        var userBookingRequest = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            "User Buchung",
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );
        await Client.PostAsJsonAsync("/api/bookings", userBookingRequest);

        // Erstelle Buchung als Admin
        AddAuthorizationHeader(adminToken);
        var adminBookingRequest = new CreateBookingDto(
            DateTime.UtcNow.AddDays(5),
            DateTime.UtcNow.AddDays(7),
            "Admin Buchung",
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 1)
            }
        );
        await Client.PostAsJsonAsync("/api/bookings", adminBookingRequest);

        // Act - Admin ruft alle Buchungen ab
        var response = await Client.GetAsync("/api/bookings");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<List<BookingDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        result.Should().NotBeNull();
        result!.Should().HaveCount(2);
        result.Should().Contain(b => b.UserId == 4 && b.Notes == "Admin Buchung");
        result.Should().Contain(b => b.UserId == 5 && b.Notes == "User Buchung");
    }

    [Fact]
    public async Task GetBookingById_WithValidId_ShouldReturnBooking()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(token);

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        var createRequest = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            "Test Buchung Details",
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );

        var createResponse = await Client.PostAsJsonAsync("/api/bookings", createRequest);
        var createContent = await createResponse.Content.ReadAsStringAsync();
        var createResult = JsonSerializer.Deserialize<BookingDto>(createContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Act
        var response = await Client.GetAsync($"/api/bookings/{createResult!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<BookingDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        result.Should().NotBeNull();
        result!.Id.Should().Be(createResult.Id);
        result.UserId.Should().Be(1);
        result.Notes.Should().Be("Test Buchung Details");
        result.Status.Should().Be(BookingStatus.Pending);
    }

    [Fact]
    public async Task GetBookingById_WithNonExistentId_ShouldReturnNotFound()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(token);

        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await Client.GetAsync($"/api/bookings/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateBooking_WithValidData_ShouldUpdateBooking()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(token);

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        // Erstelle Buchung
        var createRequest = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            "Original Buchung",
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );

        var createResponse = await Client.PostAsJsonAsync("/api/bookings", createRequest);
        var createContent = await createResponse.Content.ReadAsStringAsync();
        var createResult = JsonSerializer.Deserialize<BookingDto>(createContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Update Request
        var updateRequest = new UpdateBookingDto(
            DateTime.UtcNow.AddDays(2),
            DateTime.UtcNow.AddDays(4),
            "Aktualisierte Buchung",
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 3)
            }
        );

        // Act
        var response = await Client.PutAsJsonAsync($"/api/bookings/{createResult!.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<BookingDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        result.Should().NotBeNull();
        result!.StartDate.Should().Be(updateRequest.StartDate);
        result.EndDate.Should().Be(updateRequest.EndDate);
        result.Notes.Should().Be("Aktualisierte Buchung");
        result.TotalPersons.Should().Be(3);
    }

    [Fact]
    public async Task ConfirmBooking_AsAdmin_ShouldConfirmBooking()
    {
        // Arrange
        var adminToken = TokenProvider.GenerateToken(4, "admin@example.com", "Administrator");
        var userToken = TokenProvider.GenerateToken(5, "user@example.com");

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        // Erstelle Buchung als User
        AddAuthorizationHeader(userToken);
        var createRequest = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            null,
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );

        var createResponse = await Client.PostAsJsonAsync("/api/bookings", createRequest);
        var createContent = await createResponse.Content.ReadAsStringAsync();
        var createResult = JsonSerializer.Deserialize<BookingDto>(createContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Act - Admin bestätigt Buchung
        AddAuthorizationHeader(adminToken);
        var response = await Client.PostAsync($"/api/bookings/{createResult!.Id}/confirm", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify booking is confirmed
        var getResponse = await Client.GetAsync($"/api/bookings/{createResult.Id}");
        var getContent = await getResponse.Content.ReadAsStringAsync();
        var getResult = JsonSerializer.Deserialize<BookingDto>(getContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        getResult!.Status.Should().Be(BookingStatus.Confirmed);
    }

    [Fact]
    public async Task ConfirmBooking_AsRegularUser_ShouldReturnForbidden()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "user@example.com");
        AddAuthorizationHeader(token);

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        var createRequest = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            null,
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );

        var createResponse = await Client.PostAsJsonAsync("/api/bookings", createRequest);
        var createContent = await createResponse.Content.ReadAsStringAsync();
        var createResult = JsonSerializer.Deserialize<BookingDto>(createContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Act
        var response = await Client.PostAsync($"/api/bookings/{createResult!.Id}/confirm", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CancelBooking_WithValidId_ShouldCancelBooking()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(token);

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        // Erstelle Buchung
        var createRequest = new CreateBookingDto(
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            null,
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );

        var createResponse = await Client.PostAsJsonAsync("/api/bookings", createRequest);
        var createContent = await createResponse.Content.ReadAsStringAsync();
        var createResult = JsonSerializer.Deserialize<BookingDto>(createContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // Act
        var response = await Client.PostAsync($"/api/bookings/{createResult!.Id}/cancel", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify booking is cancelled
        var getResponse = await Client.GetAsync($"/api/bookings/{createResult.Id}");
        var getContent = await getResponse.Content.ReadAsStringAsync();
        var getResult = JsonSerializer.Deserialize<BookingDto>(getContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        getResult!.Status.Should().Be(BookingStatus.Cancelled);
    }

    [Fact]
    public async Task CheckAvailability_WithValidDateRange_ShouldReturnAvailability()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(token);

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        var startDate = DateTime.UtcNow.AddDays(10).ToString("yyyy-MM-dd");
        var endDate = DateTime.UtcNow.AddDays(12).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/bookings/availability?startDate={startDate}&endDate={endDate}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<BookingAvailabilityDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        result.Should().NotBeNull();
        result!.StartDate.Should().Be(DateTime.Parse(startDate));
        result.EndDate.Should().Be(DateTime.Parse(endDate));
        result.Accommodations.Should().NotBeEmpty();
        result.Accommodations.Should().Contain(a => a.Id == accommodationId);
    }

    [Fact]
    public async Task CheckAvailability_WithBookedDateRange_ShouldShowReducedAvailability()
    {
        // Arrange
        var token = TokenProvider.GenerateToken(1, "test@example.com");
        AddAuthorizationHeader(token);

        var accommodationId = await CreateTestSleepingAccommodationAsync();

        // Erstelle eine Buchung
        var createRequest = new CreateBookingDto(
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow.AddDays(12),
            null,
            new List<CreateBookingItemDto>
            {
                new(accommodationId, 2)
            }
        );
        await Client.PostAsJsonAsync("/api/bookings", createRequest);

        var startDate = DateTime.UtcNow.AddDays(10).ToString("yyyy-MM-dd");
        var endDate = DateTime.UtcNow.AddDays(12).ToString("yyyy-MM-dd");

        // Act
        var response = await Client.GetAsync($"/api/bookings/availability?startDate={startDate}&endDate={endDate}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<BookingAvailabilityDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        result.Should().NotBeNull();
        var accommodation = result!.Accommodations.FirstOrDefault(a => a.Id == accommodationId);
        accommodation.Should().NotBeNull();
        accommodation!.AvailableCapacity.Should().Be(2); // 4 - 2 = 2 verfügbare Plätze
    }
}