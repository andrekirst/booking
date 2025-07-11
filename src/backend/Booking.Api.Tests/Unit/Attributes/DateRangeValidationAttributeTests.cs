using Booking.Api.Attributes;
using Xunit;

namespace Booking.Api.Tests.Unit.Attributes;

public class DateRangeValidationAttributeTests
{
    private readonly DateRangeValidationAttribute _attribute = new();

    public class TestDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    [Fact]
    public void ValidateDateRange_ValidDateRange_ReturnsTrue()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var dayAfterTomorrow = today.AddDays(2);

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(tomorrow, dayAfterTomorrow);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public void ValidateDateRange_StartDateInPast_ReturnsFalse()
    {
        // Arrange
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var tomorrow = DateTime.UtcNow.Date.AddDays(1);

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(yesterday, tomorrow, allowToday: false);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Das Anreisedatum kann nicht in der Vergangenheit liegen", result.ErrorMessage);
    }

    [Fact]
    public void ValidateDateRange_StartDateBeforeToday_AllowTodayTrue_ReturnsFalse()
    {
        // Arrange
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var tomorrow = DateTime.UtcNow.Date.AddDays(1);

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(yesterday, tomorrow, allowToday: true);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Das Anreisedatum kann nicht vor heute liegen", result.ErrorMessage);
    }

    [Fact]
    public void ValidateDateRange_Today_AllowTodayTrue_ReturnsTrue()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(today, tomorrow, allowToday: true);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public void ValidateDateRange_EndDateBeforeStartDate_ReturnsFalse()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var yesterday = today.AddDays(-1);

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(today, yesterday);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Das Abreisedatum muss nach dem Anreisedatum liegen", result.ErrorMessage);
    }

    [Fact]
    public void ValidateDateRange_SameDay_AllowSameDayTrue_ReturnsTrue()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(today, today, allowSameDay: true);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public void ValidateDateRange_SameDay_AllowSameDayFalse_ReturnsFalse()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(today, today, allowSameDay: false);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Das Abreisedatum muss nach dem Anreisedatum liegen", result.ErrorMessage);
    }

    [Fact]
    public void ValidateDateRange_ExceedsMaximumDuration_ReturnsFalse()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var in31Days = today.AddDays(31);

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(today, in31Days);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Die maximale Buchungsdauer beträgt 30 Tage", result.ErrorMessage);
    }

    [Fact]
    public void ValidateDateRange_ExactlyMaximumDuration_ReturnsTrue()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var in30Days = today.AddDays(30);

        // Act
        var result = DateRangeValidationAttribute.ValidateDateRange(today, in30Days);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public void IsValid_ValidDto_ReturnsTrue()
    {
        // Arrange
        var dto = new TestDto
        {
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2)
        };

        // Act
        var result = _attribute.IsValid(dto);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsValid_InvalidDto_ReturnsFalse()
    {
        // Arrange
        var dto = new TestDto
        {
            StartDate = DateTime.UtcNow.Date.AddDays(2),
            EndDate = DateTime.UtcNow.Date.AddDays(1) // End before start
        };

        // Act
        var result = _attribute.IsValid(dto);

        // Assert
        Assert.False(result);
        Assert.Equal("Das Abreisedatum muss nach dem Anreisedatum liegen", _attribute.ErrorMessage);
    }

    [Fact]
    public void IsValid_NullValue_ReturnsTrue()
    {
        // Act
        var result = _attribute.IsValid(null);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsValid_InvalidPropertyNames_ReturnsFalse()
    {
        // Arrange
        _attribute.StartDatePropertyName = "NonExistentProperty";
        var dto = new TestDto
        {
            StartDate = DateTime.UtcNow.Date.AddDays(1),
            EndDate = DateTime.UtcNow.Date.AddDays(2)
        };

        // Act
        var result = _attribute.IsValid(dto);

        // Assert
        Assert.False(result);
    }
}