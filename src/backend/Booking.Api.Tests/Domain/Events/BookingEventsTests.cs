using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ValueObjects;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Events;

public class BookingEventsTests
{
    [Fact]
    public void BookingCreatedEvent_ShouldInitializeCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = DateTime.UtcNow.AddDays(3);
        var bookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 2)
        };
        var notes = "Test notes";
        var status = BookingStatus.Pending;

        // Act
        var @event = new BookingCreatedEvent
        {
            Id = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
            BookingId = bookingId,
            UserId = userId,
            StartDate = startDate,
            EndDate = endDate,
            BookingItems = bookingItems,
            Notes = notes,
            Status = status
        };

        // Assert
        @event.BookingId.Should().Be(bookingId);
        @event.UserId.Should().Be(userId);
        @event.StartDate.Should().Be(startDate);
        @event.EndDate.Should().Be(endDate);
        @event.BookingItems.Should().BeEquivalentTo(bookingItems);
        @event.Notes.Should().Be(notes);
        @event.Status.Should().Be(status);
        @event.Id.Should().NotBeEmpty();
        @event.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void BookingUpdatedEvent_ShouldInitializeCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var startDate = DateTime.UtcNow.AddDays(2);
        var endDate = DateTime.UtcNow.AddDays(4);
        var bookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 3)
        };
        var notes = "Updated notes";

        // Act
        var @event = new BookingUpdatedEvent
        {
            Id = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
            BookingId = bookingId,
            StartDate = startDate,
            EndDate = endDate,
            BookingItems = bookingItems,
            Notes = notes
        };

        // Assert
        @event.BookingId.Should().Be(bookingId);
        @event.StartDate.Should().Be(startDate);
        @event.EndDate.Should().Be(endDate);
        @event.BookingItems.Should().BeEquivalentTo(bookingItems);
        @event.Notes.Should().Be(notes);
        @event.Id.Should().NotBeEmpty();
        @event.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void BookingConfirmedEvent_ShouldInitializeCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        // Act
        var @event = new BookingConfirmedEvent
        {
            Id = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
            BookingId = bookingId
        };

        // Assert
        @event.BookingId.Should().Be(bookingId);
        @event.Id.Should().NotBeEmpty();
        @event.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void BookingCancelledEvent_ShouldInitializeCorrectly()
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        // Act
        var @event = new BookingCancelledEvent
        {
            Id = Guid.NewGuid(),
            OccurredAt = DateTime.UtcNow,
            BookingId = bookingId
        };

        // Assert
        @event.BookingId.Should().Be(bookingId);
        @event.Id.Should().NotBeEmpty();
        @event.OccurredAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }
}