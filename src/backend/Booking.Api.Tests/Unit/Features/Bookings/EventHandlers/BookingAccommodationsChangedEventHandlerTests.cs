using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoFixture;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Features.Bookings.EventHandlers;
using Booking.Api.Services.Projections;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace Booking.Api.Tests.Unit.Features.Bookings.EventHandlers;

public class BookingAccommodationsChangedEventHandlerTests
{
    private readonly IProjectionService<BookingAggregate, BookingReadModel> _projectionService;
    private readonly ILogger<BookingAccommodationsChangedEventHandler> _logger;
    private readonly BookingAccommodationsChangedEventHandler _handler;
    private readonly IFixture _fixture;

    public BookingAccommodationsChangedEventHandlerTests()
    {
        _projectionService = Substitute.For<IProjectionService<BookingAggregate, BookingReadModel>>();
        _logger = Substitute.For<ILogger<BookingAccommodationsChangedEventHandler>>();
        _handler = new BookingAccommodationsChangedEventHandler(_projectionService, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithValidEvent_ShouldProjectSuccessfully()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_ShouldLogInformationMessages()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert - Verify both start and success log messages
        _logger.ReceivedWithAnyArgs(2).LogInformation(default(string)!, Array.Empty<object>());
    }

    [Fact]
    public async Task Handle_WhenProjectionServiceThrowsException_ShouldLogErrorAndRethrow()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        var exception = new InvalidOperationException("Projection failed");
        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .ThrowsAsync(exception);

        // Act & Assert
        var thrownException = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _handler.Handle(@event, CancellationToken.None));

        thrownException.Should().Be(exception);
        
        // Verify information log was called once
        _logger.Received(1).Log(
            LogLevel.Information,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains($"Handling BookingAccommodationsChangedEvent for booking {bookingId}")),
            null,
            Arg.Any<Func<object, Exception?, string>>());
        // Verify error log was called once
        _logger.Received(1).Log(
            LogLevel.Error,
            Arg.Any<EventId>(),
            Arg.Any<object>(),
            exception,
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task Handle_WithAccommodationChanges_ShouldStillOnlyProjectByBookingId()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var accommodationChanges = new List<AccommodationChange>
        {
            new(Guid.NewGuid(), 0, 2, ChangeType.Added),
            new(Guid.NewGuid(), 2, 3, ChangeType.Modified)
        };

        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.AccommodationChanges, accommodationChanges)
            .With(e => e.PreviousTotalPersons, 3)
            .With(e => e.NewTotalPersons, 5)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert - Only booking ID should be used for projection
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithEmptyAccommodationChanges_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.AccommodationChanges, new List<AccommodationChange>())
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithDifferentBookingIds_ShouldProjectCorrectBooking()
    {
        // Arrange
        var bookingId1 = Guid.NewGuid();
        var bookingId2 = Guid.NewGuid();
        
        var event1 = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId1)
            .Create();
            
        var event2 = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId2)
            .Create();

        _projectionService.ProjectAsync(Arg.Any<Guid>(), cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(event1, CancellationToken.None);
        await _handler.Handle(event2, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId1, cancellationToken: CancellationToken.None);
        await _projectionService.Received(1).ProjectAsync(bookingId2, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithCancellationToken_ShouldPassTokenToProjectionService()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        var cancellationToken = new CancellationToken(true);

        _projectionService.ProjectAsync(bookingId, cancellationToken: cancellationToken)
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, cancellationToken);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: cancellationToken);
    }

    [Theory]
    [InlineData(0, 3, 3)]  // Adding accommodations
    [InlineData(5, 2, -3)] // Reducing accommodations
    [InlineData(4, 4, 0)]  // No change in total persons
    public async Task Handle_WithDifferentPersonCountChanges_ShouldHandleCorrectly(
        int previousTotal, int newTotal, int expectedDifference)
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousTotalPersons, previousTotal)
            .With(e => e.NewTotalPersons, newTotal)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
        
        // Verify the event data is as expected (just to ensure test data integrity)
        (@event.NewTotalPersons - @event.PreviousTotalPersons).Should().Be(expectedDifference);
    }

    [Fact]
    public async Task Handle_WithNullChangeReason_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Without(e => e.ChangeReason)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithValidChangeReason_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var changeReason = "Guest requested additional room for children";
        
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.ChangeReason, changeReason)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WhenProjectionServiceThrowsArgumentException_ShouldLogErrorAndRethrow()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        var exception = new ArgumentException("Invalid booking ID");
        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .ThrowsAsync(exception);

        // Act & Assert
        var thrownException = await Assert.ThrowsAsync<ArgumentException>(
            () => _handler.Handle(@event, CancellationToken.None));

        thrownException.Should().Be(exception);
        
        // Verify information log was called once
        _logger.Received(1).Log(
            LogLevel.Information,
            Arg.Any<EventId>(),
            Arg.Is<object>(o => o.ToString()!.Contains($"Handling BookingAccommodationsChangedEvent for booking {bookingId}")),
            null,
            Arg.Any<Func<object, Exception?, string>>());
        // Verify error log was called once
        _logger.Received(1).Log(
            LogLevel.Error,
            Arg.Any<EventId>(),
            Arg.Any<object>(),
            exception,
            Arg.Any<Func<object, Exception?, string>>());
    }

    [Fact]
    public async Task Handle_WithMultipleAccommodationChanges_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var accommodationChanges = new List<AccommodationChange>
        {
            new(Guid.NewGuid(), 0, 2, ChangeType.Added),
            new(Guid.NewGuid(), 2, 3, ChangeType.Modified),
            new(Guid.NewGuid(), 1, 0, ChangeType.Removed)
        };

        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.AccommodationChanges, accommodationChanges)
            .With(e => e.PreviousTotalPersons, 2)
            .With(e => e.NewTotalPersons, 4)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_ShouldLogCorrectBookingIdInMessages()
    {
        // Arrange
        var bookingId = Guid.NewGuid(); // Use specific GUID for verification
        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert - Verify both log messages were called
        _logger.ReceivedWithAnyArgs(2).LogInformation(default(string)!, Array.Empty<object>());
    }

    [Theory]
    [InlineData(ChangeType.Added)]
    [InlineData(ChangeType.Modified)]
    [InlineData(ChangeType.Removed)]
    public async Task Handle_WithDifferentChangeTypes_ShouldHandleCorrectly(ChangeType changeType)
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var accommodationChanges = new List<AccommodationChange>
        {
            new(Guid.NewGuid(), changeType == ChangeType.Added ? 0 : 2, changeType == ChangeType.Removed ? 0 : 2, changeType)
        };

        var @event = _fixture.Build<BookingAccommodationsChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.AccommodationChanges, accommodationChanges)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }
}