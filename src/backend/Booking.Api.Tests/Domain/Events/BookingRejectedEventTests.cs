using Booking.Api.Domain.Events.Bookings;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class BookingRejectedEventTests
{
    [Fact]
    public void BookingRejectedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var bookingRejectedEvent = new BookingRejectedEvent
        {
            BookingId = Guid.NewGuid()
        };

        // Assert
        bookingRejectedEvent.EventType.Should().Be("BookingRejected");
    }

    [Fact]
    public void BookingRejectedEvent_ShouldReturnCorrectAggregateInfo()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var bookingRejectedEvent = new BookingRejectedEvent
        {
            BookingId = bookingId
        };

        // Act & Assert
        bookingRejectedEvent.GetAggregateId().Should().Be(bookingId);
        bookingRejectedEvent.GetAggregateType().Should().Be("BookingAggregate");
    }

    [Fact]
    public void BookingRejectedEvent_ShouldSetBookingId()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        
        // Act
        var bookingRejectedEvent = new BookingRejectedEvent
        {
            BookingId = bookingId
        };

        // Assert
        bookingRejectedEvent.BookingId.Should().Be(bookingId);
    }
}