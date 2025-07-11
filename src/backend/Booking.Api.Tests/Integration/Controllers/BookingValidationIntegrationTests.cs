using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Tests.Integration.TestBase;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Booking.Api.Tests.Integration.Controllers;

public class BookingValidationIntegrationTests : IntegrationTestBase
{
    [Fact]
    public async Task CreateBooking_WithInvalidDateRange_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(2), // End before start
            EndDate: DateTime.UtcNow.Date.AddDays(1),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(Guid.NewGuid(), 2)
            }
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var problemDetails = JsonSerializer.Deserialize<ValidationProblemDetails>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problemDetails);
        Assert.Equal("Validation Error", problemDetails.Title);
        Assert.Equal(400, problemDetails.Status);
    }

    [Fact]
    public async Task CreateBooking_WithStartDateInPast_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(-1), // Past date
            EndDate: DateTime.UtcNow.Date.AddDays(1),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(Guid.NewGuid(), 2)
            }
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var problemDetails = JsonSerializer.Deserialize<ValidationProblemDetails>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problemDetails);
        Assert.Contains("kann nicht vor heute liegen", content);
    }

    [Fact]
    public async Task CreateBooking_WithToday_Succeeds()
    {
        // Arrange
        await AuthenticateAsync();
        await SeedSleepingAccommodationAsync();
        
        var accommodation = await GetFirstSleepingAccommodationAsync();
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date, // Today should be allowed
            EndDate: DateTime.UtcNow.Date.AddDays(1),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(accommodation.Id, 2)
            }
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings", createDto);

        // Assert
        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task CreateBooking_WithInvalidPersonCount_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(1),
            EndDate: DateTime.UtcNow.Date.AddDays(2),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(Guid.NewGuid(), 0) // Invalid person count
            }
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Personenanzahl", content);
    }

    [Fact]
    public async Task CreateBooking_WithExcessivePersonCount_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(1),
            EndDate: DateTime.UtcNow.Date.AddDays(2),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(Guid.NewGuid(), 25) // Exceeds max of 20
            }
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("zwischen 1 und 20", content);
    }

    [Fact]
    public async Task CreateBooking_WithTooLongNotes_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var longNotes = new string('a', 501); // Exceeds 500 character limit
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(1),
            EndDate: DateTime.UtcNow.Date.AddDays(2),
            Notes: longNotes,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(Guid.NewGuid(), 2)
            }
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("500 Zeichen", content);
    }

    [Fact]
    public async Task CreateBooking_WithEmptyBookingItems_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(1),
            EndDate: DateTime.UtcNow.Date.AddDays(2),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>() // Empty list
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Mindestens eine Schlafmöglichkeit", content);
    }

    [Fact]
    public async Task ValidateBookingRequest_WithValidData_ReturnsSuccess()
    {
        // Arrange
        await AuthenticateAsync();
        await SeedSleepingAccommodationAsync();
        
        var accommodation = await GetFirstSleepingAccommodationAsync();
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(1),
            EndDate: DateTime.UtcNow.Date.AddDays(3),
            Notes: "Test booking",
            BookingItems: new List<CreateBookingItemDto>
            {
                new(accommodation.Id, 2)
            }
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings/validate", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        Assert.True(result.GetProperty("isValid").GetBoolean());
        Assert.Equal("Buchungsanfrage ist gültig", result.GetProperty("message").GetString());
        Assert.Equal(2, result.GetProperty("dateRange").GetProperty("nights").GetInt32());
        Assert.Equal(2, result.GetProperty("totalPersons").GetInt32());
        Assert.Equal(1, result.GetProperty("accommodationCount").GetInt32());
    }

    [Fact]
    public async Task ValidateBookingRequest_WithInvalidData_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(-1), // Past date
            EndDate: DateTime.UtcNow.Date.AddDays(1),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(Guid.NewGuid(), 2)
            }
        );

        // Act
        var response = await HttpClient.PostAsJsonAsync("/api/bookings/validate", createDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var problemDetails = JsonSerializer.Deserialize<ValidationProblemDetails>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problemDetails);
        Assert.Equal("Validation Error", problemDetails.Title);
        Assert.Equal(400, problemDetails.Status);
    }

    [Fact]
    public async Task CheckAvailability_WithInvalidDateRange_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var startDate = DateTime.UtcNow.Date.AddDays(2);
        var endDate = DateTime.UtcNow.Date.AddDays(1); // End before start

        // Act
        var response = await HttpClient.GetAsync($"/api/bookings/availability?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var problemDetails = JsonSerializer.Deserialize<ValidationProblemDetails>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problemDetails);
        Assert.Equal("Date Range Validation Error", problemDetails.Title);
    }

    [Fact]
    public async Task CheckAvailability_WithPastStartDate_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        
        var startDate = DateTime.UtcNow.Date.AddDays(-1); // Past date
        var endDate = DateTime.UtcNow.Date.AddDays(1);

        // Act
        var response = await HttpClient.GetAsync($"/api/bookings/availability?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("kann nicht vor heute liegen", content);
    }

    [Fact]
    public async Task CheckAvailability_WithValidDateRange_ReturnsSuccess()
    {
        // Arrange
        await AuthenticateAsync();
        await SeedSleepingAccommodationAsync();
        
        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = DateTime.UtcNow.Date.AddDays(3);

        // Act
        var response = await HttpClient.GetAsync($"/api/bookings/availability?startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var availability = JsonSerializer.Deserialize<BookingAvailabilityDto>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(availability);
        Assert.Equal(startDate, availability.StartDate.Date);
        Assert.Equal(endDate, availability.EndDate.Date);
    }

    [Fact]
    public async Task UpdateBooking_WithInvalidDateRange_ReturnsValidationError()
    {
        // Arrange
        await AuthenticateAsync();
        await SeedSleepingAccommodationAsync();
        
        var accommodation = await GetFirstSleepingAccommodationAsync();
        
        // First create a booking
        var createDto = new CreateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(1),
            EndDate: DateTime.UtcNow.Date.AddDays(2),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(accommodation.Id, 2)
            }
        );

        var createResponse = await HttpClient.PostAsJsonAsync("/api/bookings", createDto);
        var createdBooking = await createResponse.Content.ReadFromJsonAsync<BookingDto>();

        // Now update with invalid date range
        var updateDto = new UpdateBookingDto(
            StartDate: DateTime.UtcNow.Date.AddDays(2), // End before start
            EndDate: DateTime.UtcNow.Date.AddDays(1),
            Notes: null,
            BookingItems: new List<CreateBookingItemDto>
            {
                new(accommodation.Id, 2)
            }
        );

        // Act
        var response = await HttpClient.PutAsJsonAsync($"/api/bookings/{createdBooking!.Id}", updateDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var problemDetails = JsonSerializer.Deserialize<ValidationProblemDetails>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        Assert.NotNull(problemDetails);
        Assert.Equal("Validation Error", problemDetails.Title);
    }
}