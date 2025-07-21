using AutoFixture.Xunit2;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ValueObjects;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class BookingCreatedEventTests
{
    [Theory, AutoData]
    public void BookingCreatedEvent_ShouldSetBookingIdCorrectly(Guid bookingId)
    {
        // Act
        var @event = new BookingCreatedEvent { BookingId = bookingId };

        // Assert
        @event.BookingId.Should().Be(bookingId);
    }

    [Theory, AutoData]
    public void BookingCreatedEvent_ShouldSetUserIdCorrectly(int userId)
    {
        // Act
        var @event = new BookingCreatedEvent { UserId = userId };

        // Assert
        @event.UserId.Should().Be(userId);
    }

    [Theory, AutoData]
    public void BookingCreatedEvent_ShouldSetStartDateCorrectly(DateTime startDate)
    {
        // Act
        var @event = new BookingCreatedEvent { StartDate = startDate };

        // Assert
        @event.StartDate.Should().Be(startDate);
    }

    [Theory, AutoData]
    public void BookingCreatedEvent_ShouldSetEndDateCorrectly(DateTime endDate)
    {
        // Act
        var @event = new BookingCreatedEvent { EndDate = endDate };

        // Assert
        @event.EndDate.Should().Be(endDate);
    }

    [Fact]
    public void BookingCreatedEvent_ShouldSetBookingItemsCorrectly()
    {
        // Arrange
        var bookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 2),
            new BookingItem(Guid.NewGuid(), 3)
        };

        // Act
        var @event = new BookingCreatedEvent { BookingItems = bookingItems };

        // Assert
        @event.BookingItems.Should().BeEquivalentTo(bookingItems);
    }

    [Theory, AutoData]
    public void BookingCreatedEvent_ShouldSetNotesCorrectly(string notes)
    {
        // Act
        var @event = new BookingCreatedEvent { Notes = notes };

        // Assert
        @event.Notes.Should().Be(notes);
    }

    [Theory]
    [InlineData(BookingStatus.Pending)]
    [InlineData(BookingStatus.Confirmed)]
    [InlineData(BookingStatus.Cancelled)]
    public void BookingCreatedEvent_ShouldSetStatusCorrectly(BookingStatus status)
    {
        // Act
        var @event = new BookingCreatedEvent { Status = status };

        // Assert
        @event.Status.Should().Be(status);
    }

    [Theory, AutoData]
    public void BookingCreatedEvent_ShouldHaveNonEmptyId(Guid id)
    {
        // Act
        var @event = new BookingCreatedEvent { Id = id };

        // Assert
        @event.Id.Should().NotBeEmpty();
    }

    [Theory, AutoData]
    public void BookingCreatedEvent_ShouldHaveRecentOccurredAt(DateTime occuredAt)
    {
        // Act
        var @event = new BookingCreatedEvent { OccurredAt = occuredAt };

        // Assert
        @event.OccurredAt.Should().Be(occuredAt);
    }
}