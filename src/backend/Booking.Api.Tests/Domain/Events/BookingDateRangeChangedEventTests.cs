using System;
using AutoFixture;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.Common;
using FluentAssertions;
using Xunit;

namespace Booking.Api.Tests.Domain.Events;

public class BookingDateRangeChangedEventTests
{
    private readonly IFixture _fixture;

    public BookingDateRangeChangedEventTests()
    {
        _fixture = new Fixture();
    }

    [Fact]
    public void BookingDateRangeChangedEvent_ShouldImplementIAggregateEvent()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingDateRangeChangedEvent>();

        // Assert
        @event.Should().BeAssignableTo<IAggregateEvent>();
    }

    [Fact]
    public void BookingDateRangeChangedEvent_ShouldHaveCorrectEventType()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingDateRangeChangedEvent>();

        // Assert
        @event.EventType.Should().Be("BookingDateRangeChanged");
    }

    [Fact]
    public void BookingDateRangeChangedEvent_ShouldReturnCorrectAggregateId()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        // Act
        var aggregateId = @event.GetAggregateId();

        // Assert
        aggregateId.Should().Be(bookingId);
    }

    [Fact]
    public void BookingDateRangeChangedEvent_ShouldReturnCorrectAggregateType()
    {
        // Arrange & Act
        var @event = _fixture.Create<BookingDateRangeChangedEvent>();

        // Assert
        @event.GetAggregateType().Should().Be("BookingAggregate");
    }

    [Fact]
    public void BookingDateRangeChangedEvent_ShouldCalculateNightsCorrectly()
    {
        // Arrange
        var startDate = new DateTime(2025, 8, 1);
        var endDate = new DateTime(2025, 8, 5); // 4 nights
        var previousStartDate = new DateTime(2025, 7, 28);
        var previousEndDate = new DateTime(2025, 7, 30); // 2 nights

        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.NewStartDate, startDate)
            .With(e => e.NewEndDate, endDate)
            .With(e => e.NewNights, (endDate - startDate).Days)
            .With(e => e.PreviousStartDate, previousStartDate)
            .With(e => e.PreviousEndDate, previousEndDate)
            .With(e => e.PreviousNights, (previousEndDate - previousStartDate).Days)
            .Create();

        // Assert
        @event.NewNights.Should().Be(4);
        @event.PreviousNights.Should().Be(2);
    }

    [Fact]
    public void BookingDateRangeChangedEvent_WithChangeReason_ShouldPreserveReason()
    {
        // Arrange
        var changeReason = "Guest requested different dates";
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.ChangeReason, changeReason)
            .Create();

        // Assert
        @event.ChangeReason.Should().Be(changeReason);
    }

    [Fact]
    public void BookingDateRangeChangedEvent_WithoutChangeReason_ShouldAllowNull()
    {
        // Arrange & Act
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .Without(e => e.ChangeReason)
            .Create();

        // Assert
        @event.ChangeReason.Should().BeNull();
    }

    [Theory]
    [InlineData(1)]
    [InlineData(7)]
    [InlineData(14)]
    public void BookingDateRangeChangedEvent_ShouldHandleDifferentDurationChanges(int nightsChange)
    {
        // Arrange
        var baseStartDate = new DateTime(2025, 8, 1);
        var baseEndDate = new DateTime(2025, 8, 4); // 3 nights
        var newEndDate = baseEndDate.AddDays(nightsChange);

        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.PreviousStartDate, baseStartDate)
            .With(e => e.PreviousEndDate, baseEndDate)
            .With(e => e.PreviousNights, (baseEndDate - baseStartDate).Days)
            .With(e => e.NewStartDate, baseStartDate)
            .With(e => e.NewEndDate, newEndDate)
            .With(e => e.NewNights, (newEndDate - baseStartDate).Days)
            .Create();

        // Assert
        @event.PreviousNights.Should().Be(3);
        @event.NewNights.Should().Be(3 + nightsChange);
        (@event.NewNights - @event.PreviousNights).Should().Be(nightsChange);
    }
}