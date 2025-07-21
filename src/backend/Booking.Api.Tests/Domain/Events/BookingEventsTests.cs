using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ValueObjects;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class BookingEventsTests
{
    #region BookingCreatedEvent Tests

    [Fact]
    public void BookingCreatedEvent_ShouldSetBookingIdCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        // Act
        var @event = new BookingCreatedEvent { BookingId = bookingId };

        // Assert
        @event.BookingId.Should().Be(bookingId);
    }

    [Fact]
    public void BookingCreatedEvent_ShouldSetUserIdCorrectly()
    {
        // Arrange
        var userId = 1;

        // Act
        var @event = new BookingCreatedEvent { UserId = userId };

        // Assert
        @event.UserId.Should().Be(userId);
    }

    [Fact]
    public void BookingCreatedEvent_ShouldSetStartDateCorrectly()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(1);

        // Act
        var @event = new BookingCreatedEvent { StartDate = startDate };

        // Assert
        @event.StartDate.Should().Be(startDate);
    }

    [Fact]
    public void BookingCreatedEvent_ShouldSetEndDateCorrectly()
    {
        // Arrange
        var endDate = DateTime.UtcNow.AddDays(3);

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

    [Fact]
    public void BookingCreatedEvent_ShouldSetNotesCorrectly()
    {
        // Arrange
        var notes = "Test notes";

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

    [Fact]
    public void BookingCreatedEvent_ShouldHaveNonEmptyId()
    {
        // Act
        var @event = new BookingCreatedEvent { Id = Guid.NewGuid() };

        // Assert
        @event.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void BookingCreatedEvent_ShouldHaveRecentOccurredAt()
    {
        // Act
        var @event = new BookingCreatedEvent { OccurredAt = DateTime.UtcNow };

        // Assert
        @event.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    #endregion

    #region BookingUpdatedEvent Tests

    [Fact]
    public void BookingUpdatedEvent_ShouldSetBookingIdCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        // Act
        var @event = new BookingUpdatedEvent { BookingId = bookingId };

        // Assert
        @event.BookingId.Should().Be(bookingId);
    }

    [Fact]
    public void BookingUpdatedEvent_ShouldSetStartDateCorrectly()
    {
        // Arrange
        var startDate = DateTime.UtcNow.AddDays(2);

        // Act
        var @event = new BookingUpdatedEvent { StartDate = startDate };

        // Assert
        @event.StartDate.Should().Be(startDate);
    }

    [Fact]
    public void BookingUpdatedEvent_ShouldSetEndDateCorrectly()
    {
        // Arrange
        var endDate = DateTime.UtcNow.AddDays(4);

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

    [Fact]
    public void BookingUpdatedEvent_ShouldSetNotesCorrectly()
    {
        // Arrange
        var notes = "Updated notes";

        // Act
        var @event = new BookingUpdatedEvent { Notes = notes };

        // Assert
        @event.Notes.Should().Be(notes);
    }

    [Fact]
    public void BookingUpdatedEvent_ShouldHaveNonEmptyId()
    {
        // Act
        var @event = new BookingUpdatedEvent { Id = Guid.NewGuid() };

        // Assert
        @event.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void BookingUpdatedEvent_ShouldHaveRecentOccurredAt()
    {
        // Act
        var @event = new BookingUpdatedEvent { OccurredAt = DateTime.UtcNow };

        // Assert
        @event.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    #endregion

    #region BookingConfirmedEvent Tests

    [Fact]
    public void BookingConfirmedEvent_ShouldSetBookingIdCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        // Act
        var @event = new BookingConfirmedEvent { BookingId = bookingId };

        // Assert
        @event.BookingId.Should().Be(bookingId);
    }

    [Fact]
    public void BookingConfirmedEvent_ShouldHaveNonEmptyId()
    {
        // Act
        var @event = new BookingConfirmedEvent { Id = Guid.NewGuid() };

        // Assert
        @event.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void BookingConfirmedEvent_ShouldHaveRecentOccurredAt()
    {
        // Act
        var @event = new BookingConfirmedEvent { OccurredAt = DateTime.UtcNow };

        // Assert
        @event.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    #endregion

    #region BookingCancelledEvent Tests

    [Fact]
    public void BookingCancelledEvent_ShouldSetBookingIdCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        // Act
        var @event = new BookingCancelledEvent { BookingId = bookingId };

        // Assert
        @event.BookingId.Should().Be(bookingId);
    }

    [Fact]
    public void BookingCancelledEvent_ShouldHaveNonEmptyId()
    {
        // Act
        var @event = new BookingCancelledEvent { Id = Guid.NewGuid() };

        // Assert
        @event.Id.Should().NotBeEmpty();
    }

    [Fact]
    public void BookingCancelledEvent_ShouldHaveRecentOccurredAt()
    {
        // Act
        var @event = new BookingCancelledEvent { OccurredAt = DateTime.UtcNow };

        // Assert
        @event.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    #endregion
}