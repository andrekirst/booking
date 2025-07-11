using Booking.Api.Attributes;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Features.Bookings.DTOs;
using MediatR;
using NSubstitute;
using Xunit;

namespace Booking.Api.Tests.Unit.Attributes;

public class AvailabilityValidationAttributeTests
{
    private readonly IMediator _mediator = Substitute.For<IMediator>();
    private readonly AvailabilityValidationAttribute _attribute = new();

    public class TestBookingItemDto
    {
        public Guid SleepingAccommodationId { get; set; }
        public int PersonCount { get; set; }
    }

    [Fact]
    public void IsValid_AlwaysReturnsTrue()
    {
        // Note: AvailabilityValidationAttribute doesn't perform sync validation
        // It provides interface for async validation
        
        // Act
        var result = _attribute.IsValid(new object());

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ValidateAvailabilityAsync_AllAccommodationsAvailable_ReturnsTrue()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = DateTime.UtcNow.Date.AddDays(2);
        var accommodationId = Guid.NewGuid();
        
        var bookingItems = new List<TestBookingItemDto>
        {
            new() { SleepingAccommodationId = accommodationId, PersonCount = 2 }
        };

        var availability = new BookingAvailabilityDto(
            startDate,
            endDate,
            new List<SleepingAccommodationAvailabilityDto>
            {
                new(accommodationId, "Test Room", 4, true, 4, new List<ConflictingBookingDto>())
            }
        );

        _mediator.Send(Arg.Any<CheckAvailabilityQuery>())
            .Returns(availability);

        // Act
        var result = await AvailabilityValidationAttribute.ValidateAvailabilityAsync(
            startDate, endDate, bookingItems, _mediator);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateAvailabilityAsync_AccommodationNotAvailable_ReturnsFalse()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = DateTime.UtcNow.Date.AddDays(2);
        var accommodationId = Guid.NewGuid();
        
        var bookingItems = new List<TestBookingItemDto>
        {
            new() { SleepingAccommodationId = accommodationId, PersonCount = 2 }
        };

        var availability = new BookingAvailabilityDto(
            startDate,
            endDate,
            new List<SleepingAccommodationAvailabilityDto>
            {
                new(accommodationId, "Test Room", 4, false, 0, new List<ConflictingBookingDto>())
            }
        );

        _mediator.Send(Arg.Any<CheckAvailabilityQuery>())
            .Returns(availability);

        // Act
        var result = await AvailabilityValidationAttribute.ValidateAvailabilityAsync(
            startDate, endDate, bookingItems, _mediator);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Schlafmöglichkeit 'Test Room' ist für den gewählten Zeitraum nicht verfügbar", result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateAvailabilityAsync_InsufficientCapacity_ReturnsFalse()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = DateTime.UtcNow.Date.AddDays(2);
        var accommodationId = Guid.NewGuid();
        
        var bookingItems = new List<TestBookingItemDto>
        {
            new() { SleepingAccommodationId = accommodationId, PersonCount = 3 }
        };

        var availability = new BookingAvailabilityDto(
            startDate,
            endDate,
            new List<SleepingAccommodationAvailabilityDto>
            {
                new(accommodationId, "Test Room", 4, true, 2, new List<ConflictingBookingDto>()) // Only 2 available, but 3 requested
            }
        );

        _mediator.Send(Arg.Any<CheckAvailabilityQuery>())
            .Returns(availability);

        // Act
        var result = await AvailabilityValidationAttribute.ValidateAvailabilityAsync(
            startDate, endDate, bookingItems, _mediator);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Schlafmöglichkeit 'Test Room' hat nur 2 freie Plätze, 3 wurden angefragt", result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateAvailabilityAsync_AccommodationNotFound_ReturnsFalse()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = DateTime.UtcNow.Date.AddDays(2);
        var accommodationId = Guid.NewGuid();
        var missingAccommodationId = Guid.NewGuid();
        
        var bookingItems = new List<TestBookingItemDto>
        {
            new() { SleepingAccommodationId = missingAccommodationId, PersonCount = 2 }
        };

        var availability = new BookingAvailabilityDto(
            startDate,
            endDate,
            new List<SleepingAccommodationAvailabilityDto>
            {
                new(accommodationId, "Test Room", 4, true, 4, new List<ConflictingBookingDto>()) // Different ID
            }
        );

        _mediator.Send(Arg.Any<CheckAvailabilityQuery>())
            .Returns(availability);

        // Act
        var result = await AvailabilityValidationAttribute.ValidateAvailabilityAsync(
            startDate, endDate, bookingItems, _mediator);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal($"Schlafmöglichkeit mit ID {missingAccommodationId} nicht gefunden", result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateAvailabilityAsync_ExceptionThrown_ReturnsFalse()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = DateTime.UtcNow.Date.AddDays(2);
        var bookingItems = new List<TestBookingItemDto>();

        _mediator.Send(Arg.Any<CheckAvailabilityQuery>())
            .Throws(new Exception("Database error"));

        // Act
        var result = await AvailabilityValidationAttribute.ValidateAvailabilityAsync(
            startDate, endDate, bookingItems, _mediator);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Verfügbarkeitsprüfung fehlgeschlagen. Bitte versuchen Sie es später erneut.", result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateAvailabilityAsync_MultipleAccommodations_AllValid_ReturnsTrue()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = DateTime.UtcNow.Date.AddDays(2);
        var accommodationId1 = Guid.NewGuid();
        var accommodationId2 = Guid.NewGuid();
        
        var bookingItems = new List<TestBookingItemDto>
        {
            new() { SleepingAccommodationId = accommodationId1, PersonCount = 2 },
            new() { SleepingAccommodationId = accommodationId2, PersonCount = 1 }
        };

        var availability = new BookingAvailabilityDto(
            startDate,
            endDate,
            new List<SleepingAccommodationAvailabilityDto>
            {
                new(accommodationId1, "Room 1", 4, true, 4, new List<ConflictingBookingDto>()),
                new(accommodationId2, "Room 2", 2, true, 2, new List<ConflictingBookingDto>())
            }
        );

        _mediator.Send(Arg.Any<CheckAvailabilityQuery>())
            .Returns(availability);

        // Act
        var result = await AvailabilityValidationAttribute.ValidateAvailabilityAsync(
            startDate, endDate, bookingItems, _mediator);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateAvailabilityAsync_WithExcludeBookingId_PassesToQuery()
    {
        // Arrange
        var startDate = DateTime.UtcNow.Date.AddDays(1);
        var endDate = DateTime.UtcNow.Date.AddDays(2);
        var excludeBookingId = "test-booking-id";
        var bookingItems = new List<TestBookingItemDto>();

        var availability = new BookingAvailabilityDto(
            startDate,
            endDate,
            new List<SleepingAccommodationAvailabilityDto>()
        );

        _mediator.Send(Arg.Any<CheckAvailabilityQuery>())
            .Returns(availability);

        // Act
        await AvailabilityValidationAttribute.ValidateAvailabilityAsync(
            startDate, endDate, bookingItems, _mediator, excludeBookingId);

        // Assert
        await _mediator.Received(1).Send(Arg.Is<CheckAvailabilityQuery>(q => 
            q.StartDate == startDate && 
            q.EndDate == endDate && 
            q.ExcludeBookingId == excludeBookingId));
    }
}