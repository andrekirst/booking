using AutoFixture.Xunit2;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ValueObjects;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class BookingUpdatedEventTests
{
    [Theory, AutoData]
    public void BookingUpdatedEvent_ShouldSetBookingIdCorrectly(Guid bookingId)
    {
        // Act
        var @event = new BookingUpdatedEvent { BookingId = bookingId };

        // Assert
        @event.BookingId.Should().Be(bookingId);
    }

    [Theory, AutoData]
    public void BookingUpdatedEvent_ShouldSetStartDateCorrectly(DateTime startDate)
    {
        // Act
        var @event = new BookingUpdatedEvent { StartDate = startDate };

        // Assert
        @event.StartDate.Should().Be(startDate);
    }

    [Theory, AutoData]
    public void BookingUpdatedEvent_ShouldSetEndDateCorrectly(DateTime endDate)
    {
        // Act
        var @event = new BookingUpdatedEvent { EndDate = endDate };

        // Assert
        @event.EndDate.Should().Be(endDate);
    }

    [Fact]
    public void BookingUpdatedEvent_ShouldSetBookingItemsCorrectly()
    {
        // Arrange
        var bookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 3),
            new BookingItem(Guid.NewGuid(), 1)
        };

        // Act
        var @event = new BookingUpdatedEvent { BookingItems = bookingItems };

        // Assert
        @event.BookingItems.Should().BeEquivalentTo(bookingItems);
    }

    [Theory, AutoData]
    public void BookingUpdatedEvent_ShouldSetNotesCorrectly(string notes)
    {
        // Act
        var @event = new BookingUpdatedEvent { Notes = notes };

        // Assert
        @event.Notes.Should().Be(notes);
    }

    [Theory, AutoData]
    public void BookingUpdatedEvent_ShouldHaveNonEmptyId(Guid id)
    {
        // Act
        var @event = new BookingUpdatedEvent { Id = id };

        // Assert
        @event.Id.Should().NotBeEmpty();
    }

    [Theory, AutoData]
    public void BookingUpdatedEvent_ShouldHaveRecentOccurredAt(DateTime occuredAt)
    {
        // Act
        var @event = new BookingUpdatedEvent { OccurredAt = occuredAt };

        // Assert
        @event.OccurredAt.Should().Be(occuredAt);
    }
}