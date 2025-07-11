using Booking.Api.Attributes;
using Xunit;

namespace Booking.Api.Tests.Unit.Attributes;

public class FutureDateAttributeTests
{
    [Fact]
    public void IsValid_FutureDate_AllowTodayTrue_ReturnsTrue()
    {
        // Arrange
        var attribute = new FutureDateAttribute { AllowToday = true };
        var futureDate = DateTime.UtcNow.Date.AddDays(1);

        // Act
        var result = attribute.IsValid(futureDate);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsValid_Today_AllowTodayTrue_ReturnsTrue()
    {
        // Arrange
        var attribute = new FutureDateAttribute { AllowToday = true };
        var today = DateTime.UtcNow.Date;

        // Act
        var result = attribute.IsValid(today);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsValid_Today_AllowTodayFalse_ReturnsFalse()
    {
        // Arrange
        var attribute = new FutureDateAttribute { AllowToday = false };
        var today = DateTime.UtcNow.Date;

        // Act
        var result = attribute.IsValid(today);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsValid_PastDate_AllowTodayTrue_ReturnsFalse()
    {
        // Arrange
        var attribute = new FutureDateAttribute { AllowToday = true };
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);

        // Act
        var result = attribute.IsValid(yesterday);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsValid_PastDate_AllowTodayFalse_ReturnsFalse()
    {
        // Arrange
        var attribute = new FutureDateAttribute { AllowToday = false };
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);

        // Act
        var result = attribute.IsValid(yesterday);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsValid_NullValue_ReturnsTrue()
    {
        // Arrange
        var attribute = new FutureDateAttribute();

        // Act
        var result = attribute.IsValid(null);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsValid_NonDateTimeValue_ReturnsFalse()
    {
        // Arrange
        var attribute = new FutureDateAttribute();

        // Act
        var result = attribute.IsValid("not a date");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void FormatErrorMessage_AllowTodayTrue_ReturnsCorrectMessage()
    {
        // Arrange
        var attribute = new FutureDateAttribute { AllowToday = true };
        var fieldName = "StartDate";

        // Act
        var message = attribute.FormatErrorMessage(fieldName);

        // Assert
        Assert.Equal("StartDate kann nicht vor heute liegen", message);
    }

    [Fact]
    public void FormatErrorMessage_AllowTodayFalse_ReturnsCorrectMessage()
    {
        // Arrange
        var attribute = new FutureDateAttribute { AllowToday = false };
        var fieldName = "EndDate";

        // Act
        var message = attribute.FormatErrorMessage(fieldName);

        // Assert
        Assert.Equal("EndDate kann nicht in der Vergangenheit liegen", message);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void IsValid_DateTimeWithTime_IgnoresTime(bool allowToday)
    {
        // Arrange
        var attribute = new FutureDateAttribute { AllowToday = allowToday };
        var today = DateTime.UtcNow.Date;
        var todayWithTime = today.AddHours(15).AddMinutes(30); // Same day but with time

        // Act
        var result = attribute.IsValid(todayWithTime);

        // Assert
        Assert.Equal(allowToday, result);
    }
}