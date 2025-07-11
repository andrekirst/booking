using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ValueObjects;
using FluentAssertions;

namespace Booking.Api.Tests.Domain.Aggregates;

public class BookingAggregateTests
{
    [Fact]
    public void Create_WithValidData_ShouldCreateAggregateWithEvent()
    {
        // Arrange
        var id = Guid.NewGuid();
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = DateTime.UtcNow.AddDays(3);
        var bookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 2),
            new BookingItem(Guid.NewGuid(), 1)
        };
        var notes = "Test booking notes";

        // Act
        var aggregate = BookingAggregate.Create(id, userId, startDate, endDate, bookingItems, notes);

        // Assert
        aggregate.Id.Should().Be(id);
        aggregate.UserId.Should().Be(userId);
        aggregate.StartDate.Should().Be(startDate);
        aggregate.EndDate.Should().Be(endDate);
        aggregate.BookingItems.Should().BeEquivalentTo(bookingItems);
        aggregate.Notes.Should().Be(notes);
        aggregate.Status.Should().Be(BookingStatus.Pending);
        aggregate.Version.Should().Be(-1); // Version is -1 until events are persisted

        aggregate.DomainEvents.Should().HaveCount(1);
        var domainEvent = aggregate.DomainEvents.First();
        domainEvent.Should().BeOfType<BookingCreatedEvent>();
        
        var createdEvent = (BookingCreatedEvent)domainEvent;
        createdEvent.BookingId.Should().Be(id);
        createdEvent.UserId.Should().Be(userId);
        createdEvent.StartDate.Should().Be(startDate);
        createdEvent.EndDate.Should().Be(endDate);
        createdEvent.BookingItems.Should().BeEquivalentTo(bookingItems);
        createdEvent.Notes.Should().Be(notes);
        createdEvent.Status.Should().Be(BookingStatus.Pending);
    }

    [Fact]
    public void Create_WithEmptyBookingItems_ShouldThrowArgumentException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = DateTime.UtcNow.AddDays(3);
        var bookingItems = new List<BookingItem>();

        // Act & Assert
        var act = () => BookingAggregate.Create(id, userId, startDate, endDate, bookingItems);
        act.Should().Throw<ArgumentException>()
            .WithMessage("At least one booking item is required");
    }

    [Fact]
    public void Create_WithStartDateInPast_ShouldThrowArgumentException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(-1);
        var endDate = DateTime.UtcNow.AddDays(3);
        var bookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 2)
        };

        // Act & Assert
        var act = () => BookingAggregate.Create(id, userId, startDate, endDate, bookingItems);
        act.Should().Throw<ArgumentException>()
            .WithMessage("Das Anreisedatum kann nicht vor heute liegen");
    }

    [Fact]
    public void Create_WithEndDateBeforeStartDate_ShouldThrowArgumentException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var userId = 1;
        var startDate = DateTime.UtcNow.AddDays(3);
        var endDate = DateTime.UtcNow.AddDays(1);
        var bookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 2)
        };

        // Act & Assert
        var act = () => BookingAggregate.Create(id, userId, startDate, endDate, bookingItems);
        act.Should().Throw<ArgumentException>()
            .WithMessage("Das Abreisedatum muss nach dem Anreisedatum liegen");
    }

    [Fact]
    public void Update_WithValidData_ShouldUpdateAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.ClearDomainEvents(); // Clear creation event

        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(7);
        var newBookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 3)
        };
        var newNotes = "Updated notes";

        // Act
        aggregate.Update(newStartDate, newEndDate, newBookingItems, newNotes);

        // Assert
        aggregate.StartDate.Should().Be(newStartDate);
        aggregate.EndDate.Should().Be(newEndDate);
        aggregate.BookingItems.Should().BeEquivalentTo(newBookingItems);
        aggregate.Notes.Should().Be(newNotes);

        aggregate.DomainEvents.Should().HaveCount(1);
        var domainEvent = aggregate.DomainEvents.First();
        domainEvent.Should().BeOfType<BookingUpdatedEvent>();
        
        var updatedEvent = (BookingUpdatedEvent)domainEvent;
        updatedEvent.BookingId.Should().Be(aggregate.Id);
        updatedEvent.StartDate.Should().Be(newStartDate);
        updatedEvent.EndDate.Should().Be(newEndDate);
        updatedEvent.BookingItems.Should().BeEquivalentTo(newBookingItems);
        updatedEvent.Notes.Should().Be(newNotes);
    }

    [Fact]
    public void Confirm_WhenPending_ShouldConfirmAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.ClearDomainEvents(); // Clear creation event

        // Act
        aggregate.Confirm();

        // Assert
        aggregate.Status.Should().Be(BookingStatus.Confirmed);

        aggregate.DomainEvents.Should().HaveCount(1);
        var domainEvent = aggregate.DomainEvents.First();
        domainEvent.Should().BeOfType<BookingConfirmedEvent>();
        
        var confirmedEvent = (BookingConfirmedEvent)domainEvent;
        confirmedEvent.BookingId.Should().Be(aggregate.Id);
    }

    [Fact]
    public void Confirm_WhenNotPending_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.Cancel();

        // Act & Assert
        var act = () => aggregate.Confirm();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Cannot confirm booking with status {BookingStatus.Cancelled}");
    }

    [Fact]
    public void Cancel_WhenPendingOrConfirmed_ShouldCancelAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.ClearDomainEvents(); // Clear creation event

        // Act
        aggregate.Cancel();

        // Assert
        aggregate.Status.Should().Be(BookingStatus.Cancelled);

        aggregate.DomainEvents.Should().HaveCount(1);
        var domainEvent = aggregate.DomainEvents.First();
        domainEvent.Should().BeOfType<BookingCancelledEvent>();
        
        var cancelledEvent = (BookingCancelledEvent)domainEvent;
        cancelledEvent.BookingId.Should().Be(aggregate.Id);
    }

    [Fact]
    public void Cancel_WhenAlreadyCancelled_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.Cancel();

        // Act & Assert
        var act = () => aggregate.Cancel();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Booking is already cancelled");
    }

    [Fact]
    public void LoadFromHistory_WithEvents_ShouldReplayCorrectly()
    {
        // Arrange
        var aggregateId = Guid.NewGuid();
        var userId = 1;
        var createdAt = DateTime.UtcNow.AddDays(-1);
        var updatedAt = DateTime.UtcNow.AddHours(-1);
        var confirmedAt = DateTime.UtcNow.AddMinutes(-30);

        var originalBookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 2)
        };
        var updatedBookingItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 3)
        };

        var events = new DomainEvent[]
        {
            new BookingCreatedEvent
            {
                Id = Guid.NewGuid(),
                OccurredAt = createdAt,
                BookingId = aggregateId,
                UserId = userId,
                StartDate = createdAt.AddDays(1),
                EndDate = createdAt.AddDays(3),
                BookingItems = originalBookingItems,
                Notes = "Original notes",
                Status = BookingStatus.Pending
            },
            new BookingUpdatedEvent
            {
                Id = Guid.NewGuid(),
                OccurredAt = updatedAt,
                BookingId = aggregateId,
                StartDate = updatedAt.AddDays(1),
                EndDate = updatedAt.AddDays(2),
                BookingItems = updatedBookingItems,
                Notes = "Updated notes"
            },
            new BookingConfirmedEvent
            {
                Id = Guid.NewGuid(),
                OccurredAt = confirmedAt,
                BookingId = aggregateId
            }
        };

        // Act
        var aggregate = new BookingAggregate();
        aggregate.LoadFromHistory(events);

        // Assert
        aggregate.Id.Should().Be(aggregateId);
        aggregate.UserId.Should().Be(userId);
        aggregate.StartDate.Should().Be(updatedAt.AddDays(1));
        aggregate.EndDate.Should().Be(updatedAt.AddDays(2));
        aggregate.BookingItems.Should().BeEquivalentTo(updatedBookingItems);
        aggregate.Notes.Should().Be("Updated notes");
        aggregate.Status.Should().Be(BookingStatus.Confirmed);
        aggregate.Version.Should().Be(2); // 3 events, version starts at -1
        aggregate.DomainEvents.Should().BeEmpty(); // No new events when loading from history
    }

    private static BookingAggregate CreateTestBookingAggregate()
    {
        return BookingAggregate.Create(
            Guid.NewGuid(),
            1,
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(3),
            new List<BookingItem>
            {
                new BookingItem(Guid.NewGuid(), 2)
            },
            "Test notes"
        );
    }
}