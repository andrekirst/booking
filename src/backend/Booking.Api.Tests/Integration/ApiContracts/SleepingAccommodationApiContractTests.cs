using System.Net;
using System.Net.Http.Json;
using Booking.Api.Domain.Enums;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Tests.Integration.TestBase;
using FluentAssertions;

namespace Booking.Api.Tests.Integration.ApiContracts;

public class SleepingAccommodationApiContractTests : IntegrationTestBase
{
    [Fact]
    public async Task CreateSleepingAccommodation_ApiContract_ShouldRemainUnchanged()
    {
        // Arrange
        var validToken = TokenProvider.GenerateToken(1, "admin@example.com", "Administrator");
        AddAuthorizationHeader(validToken);

        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/sleepingaccommodations", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var result = await response.Content.ReadFromJsonAsync<SleepingAccommodationDto>();
        result.Should().NotBeNull();
        result!.Id.Should().NotBeEmpty();
        result.Name.Should().Be("Test Room");
        result.Type.Should().Be(AccommodationType.Room);
        result.MaxCapacity.Should().Be(4);
        result.IsActive.Should().BeTrue();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.ChangedAt.Should().BeNull();
    }

    [Fact]
    public async Task GetSleepingAccommodations_ApiContract_ShouldRemainUnchanged()
    {
        // Arrange
        var validToken = TokenProvider.GenerateToken(1, "admin@example.com", "Administrator");
        AddAuthorizationHeader(validToken);

        // Create a test accommodation first
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        await Client.PostAsJsonAsync("/api/sleepingaccommodations", createDto);

        // Act
        var response = await Client.GetAsync("/api/sleepingaccommodations");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<List<SleepingAccommodationDto>>();
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        
        var accommodation = result!.First();
        accommodation.Id.Should().NotBeEmpty();
        accommodation.Name.Should().Be("Test Room");
        accommodation.Type.Should().Be(AccommodationType.Room);
        accommodation.MaxCapacity.Should().Be(4);
        accommodation.IsActive.Should().BeTrue();
        accommodation.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        accommodation.ChangedAt.Should().BeNull();
    }

    [Fact]
    public async Task GetSleepingAccommodationById_ApiContract_ShouldRemainUnchanged()
    {
        // Arrange
        var validToken = TokenProvider.GenerateToken(1, "admin@example.com", "Administrator");
        AddAuthorizationHeader(validToken);

        // Create a test accommodation first
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        var createResponse = await Client.PostAsJsonAsync("/api/sleepingaccommodations", createDto);
        var createdAccommodation = await createResponse.Content.ReadFromJsonAsync<SleepingAccommodationDto>();

        // Act
        var response = await Client.GetAsync($"/api/sleepingaccommodations/{createdAccommodation!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<SleepingAccommodationDto>();
        result.Should().NotBeNull();
        result!.Id.Should().Be(createdAccommodation.Id);
        result.Name.Should().Be("Test Room");
        result.Type.Should().Be(AccommodationType.Room);
        result.MaxCapacity.Should().Be(4);
        result.IsActive.Should().BeTrue();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.ChangedAt.Should().BeNull();
    }

    [Fact]
    public async Task UpdateSleepingAccommodation_ApiContract_ShouldRemainUnchanged()
    {
        // Arrange
        var validToken = TokenProvider.GenerateToken(1, "admin@example.com", "Administrator");
        AddAuthorizationHeader(validToken);

        // Create a test accommodation first
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Original Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        var createResponse = await Client.PostAsJsonAsync("/api/sleepingaccommodations", createDto);
        var createdAccommodation = await createResponse.Content.ReadFromJsonAsync<SleepingAccommodationDto>();

        // Act
        var updateDto = new UpdateSleepingAccommodationDto
        {
            Name = "Updated Room",
            Type = AccommodationType.Tent,
            MaxCapacity = 2,
            IsActive = true
        };

        var response = await Client.PutAsJsonAsync($"/api/sleepingaccommodations/{createdAccommodation!.Id}", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<SleepingAccommodationDto>();
        result.Should().NotBeNull();
        result!.Id.Should().Be(createdAccommodation.Id);
        result.Name.Should().Be("Updated Room");
        result.Type.Should().Be(AccommodationType.Tent);
        result.MaxCapacity.Should().Be(2);
        result.IsActive.Should().BeTrue();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task DeleteSleepingAccommodation_ApiContract_ShouldRemainUnchanged()
    {
        // Arrange
        var validToken = TokenProvider.GenerateToken(1, "admin@example.com", "Administrator");
        AddAuthorizationHeader(validToken);

        // Create a test accommodation first
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        var createResponse = await Client.PostAsJsonAsync("/api/sleepingaccommodations", createDto);
        var createdAccommodation = await createResponse.Content.ReadFromJsonAsync<SleepingAccommodationDto>();

        // Act
        var response = await Client.DeleteAsync($"/api/sleepingaccommodations/{createdAccommodation!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify accommodation is deactivated, not deleted
        var getResponse = await Client.GetAsync($"/api/sleepingaccommodations/{createdAccommodation.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await getResponse.Content.ReadFromJsonAsync<SleepingAccommodationDto>();
        result.Should().NotBeNull();
        result!.IsActive.Should().BeFalse();
        result.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task SleepingAccommodationDto_Structure_ShouldRemainUnchanged()
    {
        // Arrange
        var validToken = TokenProvider.GenerateToken(1, "admin@example.com", "Administrator");
        AddAuthorizationHeader(validToken);

        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/sleepingaccommodations", createDto);
        var result = await response.Content.ReadFromJsonAsync<SleepingAccommodationDto>();

        // Assert - Verify all expected properties exist and have correct types
        result.Should().NotBeNull();
        
        // Verify property values and types
        result!.Id.Should().NotBeEmpty();
        result.Name.Should().NotBeNullOrEmpty();
        result.Type.Should().Be(AccommodationType.Room);
        result.MaxCapacity.Should().BeGreaterThan(0);
        result.IsActive.Should().BeTrue();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void CreateSleepingAccommodationDto_Structure_ShouldRemainUnchanged()
    {
        // Arrange
        var createDto = new CreateSleepingAccommodationDto
        {
            Name = "Test Room",
            Type = AccommodationType.Room,
            MaxCapacity = 4
        };

        // Assert - Verify DTO structure and values
        createDto.Name.Should().Be("Test Room");
        createDto.Type.Should().Be(AccommodationType.Room);
        createDto.MaxCapacity.Should().Be(4);
    }

    [Fact]
    public void UpdateSleepingAccommodationDto_Structure_ShouldRemainUnchanged()
    {
        // Arrange
        var updateDto = new UpdateSleepingAccommodationDto
        {
            Name = "Updated Room",
            Type = AccommodationType.Tent,
            MaxCapacity = 2,
            IsActive = false
        };

        // Assert - Verify DTO structure and values
        updateDto.Name.Should().Be("Updated Room");
        updateDto.Type.Should().Be(AccommodationType.Tent);
        updateDto.MaxCapacity.Should().Be(2);
        updateDto.IsActive.Should().BeFalse();
    }

    [Fact]
    public void AccommodationType_Enum_ShouldRemainUnchanged()
    {
        // Assert - Verify enum values haven't changed
        var roomValue = (int)AccommodationType.Room;
        var tentValue = (int)AccommodationType.Tent;

        roomValue.Should().Be(0);
        tentValue.Should().Be(1);

        // Verify enum names
        AccommodationType.Room.ToString().Should().Be("Room");
        AccommodationType.Tent.ToString().Should().Be("Tent");
    }
}