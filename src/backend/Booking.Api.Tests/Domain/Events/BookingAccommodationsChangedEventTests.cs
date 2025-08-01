using System;
using System.Collections.Generic;
using AutoFixture;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Domain.Common;
using FluentAssertions;
using Xunit;

namespace Booking.Api.Tests.Domain.Events;

public class BookingAccommodationsChangedEventTests
{
    private readonly IFixture _fixture;

    public BookingAccommodationsChangedEventTests()
    {
        _fixture = new Fixture();
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_ShouldImplementIAggregateEvent()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingAccommodationsChangedEvent>();

        // Assert
        @event.Should().BeAssignableTo<IAggregateEvent>();
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingAccommodationsChangedEvent>();

        // Assert
        @event.EventType.Should().Be("BookingAccommodationsChanged");
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_ShouldReturnCorrectAggregateId()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        // Act
        var aggregateId = @event.GetAggregateId();

        // Assert
        aggregateId.Should().Be(bookingId);
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_ShouldReturnCorrectAggregateType()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingAccommodationsChangedEvent>();

        // Assert
        @event.GetAggregateType().Should().Be("BookingAggregate");
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_ShouldInitializeEmptyAccommodationChanges()
    {
        // Arrange & Act
        var @event = new BookingAccommodationsChangedEvent
        {
            BookingId = _fixture.Create<Guid>(),
            PreviousTotalPersons = _fixture.Create<int>(),
            NewTotalPersons = _fixture.Create<int>()
        };

        // Assert
        @event.AccommodationChanges.Should().NotBeNull();
        @event.AccommodationChanges.Should().BeEmpty();
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_ShouldStoreAccommodationChanges()
    {
        // Arrange
        var accommodationChanges = new List<AccommodationChange>
        {
            _fixture.Create<AccommodationChange>(),
            _fixture.Create<AccommodationChange>()
        };

        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.AccommodationChanges, accommodationChanges)
            .Create();

        // Assert
        @event.AccommodationChanges.Should().HaveCount(2);
        @event.AccommodationChanges.Should().BeEquivalentTo(accommodationChanges);
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_ShouldTrackPersonCountChanges()
    {
        // Arrange
        var previousTotal = 3;
        var newTotal = 5;

        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.PreviousTotalPersons, previousTotal)
            .With(e => e.NewTotalPersons, newTotal)
            .Create();

        // Assert
        @event.PreviousTotalPersons.Should().Be(previousTotal);
        @event.NewTotalPersons.Should().Be(newTotal);
        (@event.NewTotalPersons - @event.PreviousTotalPersons).Should().Be(2);
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_WithChangeReason_ShouldPreserveReason()
    {
        // Arrange
        var changeReason = "Guest requested additional room";
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.ChangeReason, changeReason)
            .Create();

        // Assert
        @event.ChangeReason.Should().Be(changeReason);
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_WithoutChangeReason_ShouldAllowNull()
    {
        // Arrange & Act
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .Without(e => e.ChangeReason)
            .Create();

        // Assert
        @event.ChangeReason.Should().BeNull();
    }

    [Theory]
    [InlineData(0, 3, 3)] // Adding accommodations
    [InlineData(5, 2, -3)] // Reducing accommodations  
    [InlineData(4, 4, 0)] // No change in total persons
    public void BookingAccommodationsChangedEvent_ShouldHandleDifferentPersonCountChanges(
        int previousTotal, int newTotal, int expectedDifference)
    {
        // Arrange & Act
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.PreviousTotalPersons, previousTotal)
            .With(e => e.NewTotalPersons, newTotal)
            .Create();

        // Assert
        @event.PreviousTotalPersons.Should().Be(previousTotal);
        @event.NewTotalPersons.Should().Be(newTotal);
        (@event.NewTotalPersons - @event.PreviousTotalPersons).Should().Be(expectedDifference);
    }

    [Fact]
    public void BookingAccommodationsChangedEvent_ShouldAllowMultipleAccommodationChanges()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var accommodationId1 = _fixture.Create<Guid>();
        var accommodationId2 = _fixture.Create<Guid>();
        
        var changes = new List<AccommodationChange>
        {
            new(accommodationId1, 0, 2, ChangeType.Added),
            new(accommodationId2, 2, 3, ChangeType.Modified)
        };

        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.AccommodationChanges, changes)
            .With(e => e.PreviousTotalPersons, 1)
            .With(e => e.NewTotalPersons, 5)
            .Create();

        // Assert
        @event.BookingId.Should().Be(bookingId);
        @event.AccommodationChanges.Should().HaveCount(2);
        @event.AccommodationChanges[0].SleepingAccommodationId.Should().Be(accommodationId1);
        @event.AccommodationChanges[0].ChangeType.Should().Be(ChangeType.Added);
        @event.AccommodationChanges[1].SleepingAccommodationId.Should().Be(accommodationId2);
        @event.AccommodationChanges[1].ChangeType.Should().Be(ChangeType.Modified);
        @event.NewTotalPersons.Should().Be(5);
    }
}