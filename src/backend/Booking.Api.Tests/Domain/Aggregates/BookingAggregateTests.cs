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
        aggregate.UpdateBooking(newStartDate, newEndDate, newBookingItems, newNotes);

        // Assert
        aggregate.StartDate.Should().Be(newStartDate);
        aggregate.EndDate.Should().Be(newEndDate);
        aggregate.BookingItems.Should().BeEquivalentTo(newBookingItems);
        aggregate.Notes.Should().Be(newNotes);

        // The new implementation generates granular events plus the legacy event
        aggregate.DomainEvents.Should().HaveCount(4);
        
        // Verify DateRangeChanged event
        var dateRangeEvent = aggregate.DomainEvents.OfType<BookingDateRangeChangedEvent>().Should().ContainSingle().Subject;
        dateRangeEvent.BookingId.Should().Be(aggregate.Id);
        dateRangeEvent.NewStartDate.Should().Be(newStartDate);
        dateRangeEvent.NewEndDate.Should().Be(newEndDate);
        
        // Verify AccommodationsChanged event
        var accommodationsEvent = aggregate.DomainEvents.OfType<BookingAccommodationsChangedEvent>().Should().ContainSingle().Subject;
        accommodationsEvent.BookingId.Should().Be(aggregate.Id);
        accommodationsEvent.NewTotalPersons.Should().Be(3);
        
        // Verify NotesChanged event
        var notesEvent = aggregate.DomainEvents.OfType<BookingNotesChangedEvent>().Should().ContainSingle().Subject;
        notesEvent.BookingId.Should().Be(aggregate.Id);
        notesEvent.NewNotes.Should().Be(newNotes);
        
        // Verify legacy UpdatedEvent for backward compatibility
        var updatedEvent = aggregate.DomainEvents.OfType<BookingUpdatedEvent>().Should().ContainSingle().Subject;
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

    [Fact]
    public void Accept_WhenPending_ShouldChangeStatusToAcceptedAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.Status.Should().Be(BookingStatus.Pending);

        // Act
        aggregate.Accept();

        // Assert
        aggregate.Status.Should().Be(BookingStatus.Accepted);
        
        var acceptedEvent = aggregate.DomainEvents.OfType<BookingAcceptedEvent>().FirstOrDefault();
        acceptedEvent.Should().NotBeNull();
        acceptedEvent!.BookingId.Should().Be(aggregate.Id);
    }

    [Fact]
    public void Accept_WhenNotPending_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.Confirm(); // Change status to Confirmed

        // Act & Assert
        var act = () => aggregate.Accept();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Cannot accept booking with status {BookingStatus.Confirmed}");
    }

    [Fact]
    public void Reject_WhenPending_ShouldChangeStatusToRejectedAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.Status.Should().Be(BookingStatus.Pending);

        // Act
        aggregate.Reject();

        // Assert
        aggregate.Status.Should().Be(BookingStatus.Rejected);
        
        var rejectedEvent = aggregate.DomainEvents.OfType<BookingRejectedEvent>().FirstOrDefault();
        rejectedEvent.Should().NotBeNull();
        rejectedEvent!.BookingId.Should().Be(aggregate.Id);
    }

    [Fact]
    public void Reject_WhenNotPending_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.Confirm(); // Change status to Confirmed

        // Act & Assert
        var act = () => aggregate.Reject();
        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Cannot reject booking with status {BookingStatus.Confirmed}");
    }

    [Fact]
    public void ChangeDateRange_WithValidDates_ShouldUpdateDatesAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var originalStartDate = aggregate.StartDate;
        var originalEndDate = aggregate.EndDate;
        var originalNights = (originalEndDate - originalStartDate).Days;
        
        aggregate.ClearDomainEvents(); // Clear creation event
        
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);
        var newNights = (newEndDate - newStartDate).Days;
        var changeReason = "Guest requested different dates";

        // Act
        aggregate.ChangeDateRange(newStartDate, newEndDate, changeReason);

        // Assert
        aggregate.StartDate.Should().Be(newStartDate);
        aggregate.EndDate.Should().Be(newEndDate);

        aggregate.DomainEvents.Should().HaveCount(1);
        var dateRangeEvent = aggregate.DomainEvents.OfType<BookingDateRangeChangedEvent>().Should().ContainSingle().Subject;
        
        dateRangeEvent.BookingId.Should().Be(aggregate.Id);
        dateRangeEvent.PreviousStartDate.Should().Be(originalStartDate);
        dateRangeEvent.PreviousEndDate.Should().Be(originalEndDate);
        dateRangeEvent.NewStartDate.Should().Be(newStartDate);
        dateRangeEvent.NewEndDate.Should().Be(newEndDate);
        dateRangeEvent.PreviousNights.Should().Be(originalNights);
        dateRangeEvent.NewNights.Should().Be(newNights);
        dateRangeEvent.ChangeReason.Should().Be(changeReason);
    }

    [Fact]
    public void ChangeDateRange_WithoutChangeReason_ShouldSucceed()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        aggregate.ClearDomainEvents();
        
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        // Act
        aggregate.ChangeDateRange(newStartDate, newEndDate);

        // Assert
        aggregate.StartDate.Should().Be(newStartDate);
        aggregate.EndDate.Should().Be(newEndDate);
        
        var dateRangeEvent = aggregate.DomainEvents.OfType<BookingDateRangeChangedEvent>().Should().ContainSingle().Subject;
        dateRangeEvent.ChangeReason.Should().BeNull();
    }

    [Fact]
    public void ChangeDateRange_WithInvalidDateRange_ShouldThrowArgumentException()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var newStartDate = DateTime.UtcNow.AddDays(8);
        var newEndDate = DateTime.UtcNow.AddDays(5); // End before start

        // Act & Assert
        var act = () => aggregate.ChangeDateRange(newStartDate, newEndDate);
        act.Should().Throw<ArgumentException>()
            .WithMessage("Das Abreisedatum muss nach dem Anreisedatum liegen");
    }

    [Fact]
    public void ChangeDateRange_WithPastStartDate_ShouldThrowArgumentException()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var newStartDate = DateTime.UtcNow.AddDays(-1); // Past date
        var newEndDate = DateTime.UtcNow.AddDays(3);

        // Act & Assert
        var act = () => aggregate.ChangeDateRange(newStartDate, newEndDate);
        act.Should().Throw<ArgumentException>()
            .WithMessage("Das Anreisedatum kann nicht vor heute liegen");
    }

    [Fact]
    public void ChangeAccommodations_WithValidItems_ShouldUpdateItemsAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var originalItems = aggregate.BookingItems.ToList();
        var originalTotalPersons = originalItems.Sum(x => x.PersonCount);
        
        aggregate.ClearDomainEvents(); // Clear creation event
        
        var newItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 3),
            new BookingItem(Guid.NewGuid(), 2)
        };
        var newTotalPersons = newItems.Sum(x => x.PersonCount);

        // Act
        aggregate.ChangeAccommodations(newItems);

        // Assert
        aggregate.BookingItems.Should().BeEquivalentTo(newItems);

        aggregate.DomainEvents.Should().HaveCount(1);
        var accommodationsEvent = aggregate.DomainEvents.OfType<BookingAccommodationsChangedEvent>().Should().ContainSingle().Subject;
        
        accommodationsEvent.BookingId.Should().Be(aggregate.Id);
        accommodationsEvent.PreviousTotalPersons.Should().Be(originalTotalPersons);
        accommodationsEvent.NewTotalPersons.Should().Be(newTotalPersons);
        accommodationsEvent.AccommodationChanges.Should().NotBeNull();
    }

    [Fact]
    public void ChangeAccommodations_WithEmptyList_ShouldThrowArgumentException()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var emptyItems = new List<BookingItem>();

        // Act & Assert
        var act = () => aggregate.ChangeAccommodations(emptyItems);
        act.Should().Throw<ArgumentException>()
            .WithMessage("At least one booking item is required");
    }

    [Fact]
    public void ChangeAccommodations_WithNullList_ShouldThrowArgumentNullException()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();

        // Act & Assert
        var act = () => aggregate.ChangeAccommodations(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ChangeNotes_WithValidNotes_ShouldUpdateNotesAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var originalNotes = aggregate.Notes;
        
        aggregate.ClearDomainEvents(); // Clear creation event
        
        var newNotes = "Updated booking notes with additional information";

        // Act
        aggregate.ChangeNotes(newNotes);

        // Assert
        aggregate.Notes.Should().Be(newNotes);

        aggregate.DomainEvents.Should().HaveCount(1);
        var notesEvent = aggregate.DomainEvents.OfType<BookingNotesChangedEvent>().Should().ContainSingle().Subject;
        
        notesEvent.BookingId.Should().Be(aggregate.Id);
        notesEvent.PreviousNotes.Should().Be(originalNotes);
        notesEvent.NewNotes.Should().Be(newNotes);
        notesEvent.ChangeReason.Should().BeNull();
    }

    [Fact]
    public void ChangeNotes_WithNullNotes_ShouldUpdateToNullAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var originalNotes = aggregate.Notes;
        
        aggregate.ClearDomainEvents(); // Clear creation event

        // Act
        aggregate.ChangeNotes(null);

        // Assert
        aggregate.Notes.Should().BeNull();

        var notesEvent = aggregate.DomainEvents.OfType<BookingNotesChangedEvent>().Should().ContainSingle().Subject;
        notesEvent.PreviousNotes.Should().Be(originalNotes);
        notesEvent.NewNotes.Should().BeNull();
    }

    [Fact]
    public void ChangeNotes_WithEmptyString_ShouldUpdateToEmptyAndAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var originalNotes = aggregate.Notes;
        
        aggregate.ClearDomainEvents(); // Clear creation event

        // Act
        aggregate.ChangeNotes(string.Empty);

        // Assert
        aggregate.Notes.Should().Be(string.Empty);

        var notesEvent = aggregate.DomainEvents.OfType<BookingNotesChangedEvent>().Should().ContainSingle().Subject;
        notesEvent.PreviousNotes.Should().Be(originalNotes);
        notesEvent.NewNotes.Should().Be(string.Empty);
    }

    [Fact]
    public void ChangeNotes_WithSameNotes_ShouldNotAddEvent()
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        var currentNotes = aggregate.Notes;
        
        aggregate.ClearDomainEvents(); // Clear creation event

        // Act
        aggregate.ChangeNotes(currentNotes);

        // Assert
        aggregate.Notes.Should().Be(currentNotes);
        aggregate.DomainEvents.Should().BeEmpty(); // No event should be added for same notes
    }

    [Theory]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.Rejected)]
    public void ChangeDateRange_WhenBookingNotModifiable_ShouldThrowInvalidOperationException(BookingStatus status)
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        
        // Change status to non-modifiable state
        if (status == BookingStatus.Cancelled)
            aggregate.Cancel();
        else if (status == BookingStatus.Rejected)
            aggregate.Reject();
        
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        // Act & Assert
        var act = () => aggregate.ChangeDateRange(newStartDate, newEndDate);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Cannot modify booking with status {status}");
    }

    [Theory]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.Rejected)]
    public void ChangeAccommodations_WhenBookingNotModifiable_ShouldThrowInvalidOperationException(BookingStatus status)
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        
        // Change status to non-modifiable state
        if (status == BookingStatus.Cancelled)
            aggregate.Cancel();
        else if (status == BookingStatus.Rejected)
            aggregate.Reject();
        
        var newItems = new List<BookingItem>
        {
            new BookingItem(Guid.NewGuid(), 3)
        };

        // Act & Assert
        var act = () => aggregate.ChangeAccommodations(newItems);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Cannot modify booking with status {status}");
    }

    [Theory]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.Rejected)]
    public void ChangeNotes_WhenBookingNotModifiable_ShouldThrowInvalidOperationException(BookingStatus status)
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        
        // Change status to non-modifiable state
        if (status == BookingStatus.Cancelled)
            aggregate.Cancel();
        else if (status == BookingStatus.Rejected)
            aggregate.Reject();
        
        var newNotes = "Updated notes";

        // Act & Assert
        var act = () => aggregate.ChangeNotes(newNotes);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"Cannot modify booking with status {status}");
    }

    [Theory]
    [InlineData(BookingStatus.Pending)]
    [InlineData(BookingStatus.Confirmed)]
    [InlineData(BookingStatus.Accepted)]
    public void ChangeDateRange_WhenBookingModifiable_ShouldSucceed(BookingStatus status)
    {
        // Arrange
        var aggregate = CreateTestBookingAggregate();
        
        // Change status to modifiable state
        if (status == BookingStatus.Confirmed)
            aggregate.Confirm();
        else if (status == BookingStatus.Accepted)
            aggregate.Accept();
        
        aggregate.ClearDomainEvents(); // Clear previous events
        
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        // Act
        aggregate.ChangeDateRange(newStartDate, newEndDate);

        // Assert
        aggregate.StartDate.Should().Be(newStartDate);
        aggregate.EndDate.Should().Be(newEndDate);
        aggregate.DomainEvents.Should().HaveCount(1);
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