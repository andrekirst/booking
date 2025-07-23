using Booking.Api.Domain.Events.Bookings;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class BookingAcceptedEventTests
{
    [Fact]
    public void BookingAcceptedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var bookingAcceptedEvent = new BookingAcceptedEvent
        {
            BookingId = Guid.NewGuid()
        };

        // Assert
        bookingAcceptedEvent.EventType.Should().Be("BookingAccepted");
    }

    [Fact]
    public void BookingAcceptedEvent_ShouldReturnCorrectAggregateInfo()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var bookingAcceptedEvent = new BookingAcceptedEvent
        {
            BookingId = bookingId
        };

        // Act & Assert
        bookingAcceptedEvent.GetAggregateId().Should().Be(bookingId);
        bookingAcceptedEvent.GetAggregateType().Should().Be("BookingAggregate");
    }

    [Fact]
    public void BookingAcceptedEvent_ShouldSetBookingId()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        
        // Act
        var bookingAcceptedEvent = new BookingAcceptedEvent
        {
            BookingId = bookingId
        };

        // Assert
        bookingAcceptedEvent.BookingId.Should().Be(bookingId);
    }
}