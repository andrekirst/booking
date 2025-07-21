using AutoFixture.Xunit2;
using Booking.Api.Domain.Events.Bookings;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class BookingCancelledEventTests
{
    [Theory, AutoData]
    public void BookingCancelledEvent_ShouldSetBookingIdCorrectly(Guid bookingId)
    {
        // Act
        var @event = new BookingCancelledEvent { BookingId = bookingId };

        // Assert
        @event.BookingId.Should().Be(bookingId);
    }

    [Theory, AutoData]
    public void BookingCancelledEvent_ShouldHaveNonEmptyId(Guid id)
    {
        // Act
        var @event = new BookingCancelledEvent { Id = id };

        // Assert
        @event.Id.Should().NotBeEmpty();
    }

    [Theory, AutoData]
    public void BookingCancelledEvent_ShouldHaveRecentOccurredAt(DateTime occuredAt)
    {
        // Act
        var @event = new BookingCancelledEvent { OccurredAt = occuredAt };

        // Assert
        @event.OccurredAt.Should().Be(occuredAt);
    }
}