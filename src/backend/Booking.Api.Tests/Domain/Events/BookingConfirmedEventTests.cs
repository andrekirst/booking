using AutoFixture.Xunit2;
using Booking.Api.Domain.Events.Bookings;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class BookingConfirmedEventTests
{
    [Theory, AutoData]
    public void BookingConfirmedEvent_ShouldSetBookingIdCorrectly(Guid bookingId)
    {
        // Act
        var @event = new BookingConfirmedEvent { BookingId = bookingId };

        // Assert
        @event.BookingId.Should().Be(bookingId);
    }

    [Theory, AutoData]
    public void BookingConfirmedEvent_ShouldHaveNonEmptyId(Guid id)
    {
        // Act
        var @event = new BookingConfirmedEvent { Id = id };

        // Assert
        @event.Id.Should().NotBeEmpty();
    }

    [Theory, AutoData]
    public void BookingConfirmedEvent_ShouldHaveRecentOccurredAt(DateTime occuredAt)
    {
        // Act
        var @event = new BookingConfirmedEvent { OccurredAt = occuredAt };

        // Assert
        @event.OccurredAt.Should().Be(occuredAt);
    }
}