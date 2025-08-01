using System;
using AutoFixture;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.Common;
using FluentAssertions;
using Xunit;

namespace Booking.Api.Tests.Domain.Events;

public class BookingNotesChangedEventTests
{
    private readonly IFixture _fixture;

    public BookingNotesChangedEventTests()
    {
        _fixture = new Fixture();
    }

    [Fact]
    public void BookingNotesChangedEvent_ShouldImplementIAggregateEvent()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingNotesChangedEvent>();

        // Assert
        @event.Should().BeAssignableTo<IAggregateEvent>();
    }

    [Fact]
    public void BookingNotesChangedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingNotesChangedEvent>();

        // Assert
        @event.EventType.Should().Be("BookingNotesChanged");
    }

    [Fact]
    public void BookingNotesChangedEvent_ShouldReturnCorrectAggregateId()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        // Act
        var aggregateId = @event.GetAggregateId();

        // Assert
        aggregateId.Should().Be(bookingId);
    }

    [Fact]
    public void BookingNotesChangedEvent_ShouldReturnCorrectAggregateType()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingNotesChangedEvent>();

        // Assert
        @event.GetAggregateType().Should().Be("BookingAggregate");
    }

    [Fact]
    public void BookingNotesChangedEvent_WithValidNotes_ShouldPreserveNotesContent()
    {
        // Arrange
        var previousNotes = "Original booking notes";
        var newNotes = "Updated booking notes with additional information";

        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.PreviousNotes, previousNotes)
            .With(e => e.NewNotes, newNotes)
            .Create();

        // Assert
        @event.PreviousNotes.Should().Be(previousNotes);
        @event.NewNotes.Should().Be(newNotes);
    }

    [Fact]
    public void BookingNotesChangedEvent_WithNullPreviousNotes_ShouldAllowNull()
    {
        // Arrange
        var newNotes = "First time adding notes";

        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.PreviousNotes, (string?)null)
            .With(e => e.NewNotes, newNotes)
            .Create();

        // Assert
        @event.PreviousNotes.Should().BeNull();
        @event.NewNotes.Should().Be(newNotes);
    }

    [Fact]
    public void BookingNotesChangedEvent_WithNullNewNotes_ShouldAllowNull()
    {
        // Arrange
        var previousNotes = "Removing these notes";

        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.PreviousNotes, previousNotes)
            .With(e => e.NewNotes, (string?)null)
            .Create();

        // Assert
        @event.PreviousNotes.Should().Be(previousNotes);
        @event.NewNotes.Should().BeNull();
    }

    [Fact]
    public void BookingNotesChangedEvent_WithBothNotesNull_ShouldAllowBothNull()
    {
        // Arrange & Act
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.PreviousNotes, (string?)null)
            .With(e => e.NewNotes, (string?)null)
            .Create();

        // Assert
        @event.PreviousNotes.Should().BeNull();
        @event.NewNotes.Should().BeNull();
    }

    [Fact]
    public void BookingNotesChangedEvent_WithChangeReason_ShouldPreserveReason()
    {
        // Arrange
        var changeReason = "Guest requested to add dietary restrictions";
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.ChangeReason, changeReason)
            .Create();

        // Assert
        @event.ChangeReason.Should().Be(changeReason);
    }

    [Fact]
    public void BookingNotesChangedEvent_WithoutChangeReason_ShouldAllowNull()
    {
        // Arrange & Act
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .Without(e => e.ChangeReason)
            .Create();

        // Assert
        @event.ChangeReason.Should().BeNull();
    }

    [Theory]
    [InlineData("", "New notes", "Adding notes to empty")]
    [InlineData("Old notes", "", "Clearing notes")]
    [InlineData("Short", "Very long notes with lots of additional information and details", "Expanding notes")]
    [InlineData("Very long notes with lots of information", "Short", "Shortening notes")]
    public void BookingNotesChangedEvent_ShouldHandleDifferentNotesScenarios(
        string? previousNotes, string? newNotes, string expectedReason)
    {
        // Arrange & Act
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.PreviousNotes, previousNotes)
            .With(e => e.NewNotes, newNotes)
            .With(e => e.ChangeReason, expectedReason)
            .Create();

        // Assert
        @event.PreviousNotes.Should().Be(previousNotes);
        @event.NewNotes.Should().Be(newNotes);
        @event.ChangeReason.Should().Be(expectedReason);
    }

    [Fact]
    public void BookingNotesChangedEvent_WithLongNotes_ShouldPreserveLongContent()
    {
        // Arrange
        var longPreviousNotes = new string('A', 1000);
        var longNewNotes = new string('B', 2000);

        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.PreviousNotes, longPreviousNotes)
            .With(e => e.NewNotes, longNewNotes)
            .Create();

        // Assert
        @event.PreviousNotes.Should().Be(longPreviousNotes);
        @event.PreviousNotes.Should().HaveLength(1000);
        @event.NewNotes.Should().Be(longNewNotes);
        @event.NewNotes.Should().HaveLength(2000);
    }

    [Fact]
    public void BookingNotesChangedEvent_WithSpecialCharacters_ShouldPreserveCharacters()
    {
        // Arrange
        var previousNotes = "Notes with émojis 🏠 and spëcial charâcters: @#$%^&*()";
        var newNotes = "Üpdated nötes with mōre speçial ©haråcters: <>?:\"{}|";

        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.PreviousNotes, previousNotes)
            .With(e => e.NewNotes, newNotes)
            .Create();

        // Assert
        @event.PreviousNotes.Should().Be(previousNotes);
        @event.NewNotes.Should().Be(newNotes);
    }
}