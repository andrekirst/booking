using System;
using System.Threading;
using System.Threading.Tasks;
using AutoFixture;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Features.Bookings.EventHandlers;
using Booking.Api.Services.Projections;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace Booking.Api.Tests.Unit.Features.Bookings.EventHandlers;

public class BookingNotesChangedEventHandlerTests
{
    private readonly IProjectionService<BookingAggregate, BookingReadModel> _projectionService;
    private readonly ILogger<BookingNotesChangedEventHandler> _logger;
    private readonly BookingNotesChangedEventHandler _handler;
    private readonly IFixture _fixture;

    public BookingNotesChangedEventHandlerTests()
    {
        _projectionService = Substitute.For<IProjectionService<BookingAggregate, BookingReadModel>>();
        _logger = Substitute.For<ILogger<BookingNotesChangedEventHandler>>();
        _handler = new BookingNotesChangedEventHandler(_projectionService, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithValidEvent_ShouldProjectSuccessfully()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
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
        var @event = _fixture.Build<BookingNotesChangedEvent>()
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
        var @event = _fixture.Build<BookingNotesChangedEvent>()
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
            Arg.Is<object>(o => o.ToString()!.Contains($"Handling BookingNotesChangedEvent for booking {bookingId}")),
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
    public async Task Handle_WithNotesChange_ShouldStillOnlyProjectByBookingId()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousNotes, "Original notes")
            .With(e => e.NewNotes, "Updated notes with more information")
            .With(e => e.ChangeReason, "Guest requested additional info")
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert - Only booking ID should be used for projection
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithNullPreviousNotes_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousNotes, (string?)null)
            .With(e => e.NewNotes, "First time adding notes")
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithNullNewNotes_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousNotes, "Removing these notes")
            .With(e => e.NewNotes, (string?)null)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithBothNotesNull_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousNotes, (string?)null)
            .With(e => e.NewNotes, (string?)null)
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
        
        var event1 = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId1)
            .Create();
            
        var event2 = _fixture.Build<BookingNotesChangedEvent>()
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
        var @event = _fixture.Build<BookingNotesChangedEvent>()
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

    [Fact]
    public async Task Handle_WithLongNotes_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var longPreviousNotes = new string('A', 1000);
        var longNewNotes = new string('B', 2000);
        
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousNotes, longPreviousNotes)
            .With(e => e.NewNotes, longNewNotes)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithSpecialCharacters_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var specialCharNotes = "Notes with émojis 🏠 and spëcial charâcters: @#$%^&*()";
        
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousNotes, "Simple notes")
            .With(e => e.NewNotes, specialCharNotes)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Fact]
    public async Task Handle_WithNullChangeReason_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
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
        var changeReason = "Guest requested to add dietary restrictions";
        
        var @event = _fixture.Build<BookingNotesChangedEvent>()
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
        var @event = _fixture.Build<BookingNotesChangedEvent>()
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
            Arg.Is<object>(o => o.ToString()!.Contains($"Handling BookingNotesChangedEvent for booking {bookingId}")),
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
    public async Task Handle_ShouldLogCorrectBookingIdInMessages()
    {
        // Arrange
        var bookingId = Guid.NewGuid(); // Use specific GUID for verification
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert - Verify both log messages include the correct booking ID
        _logger.Received(1).LogInformation("Handling BookingNotesChangedEvent for booking {BookingId}", bookingId);
        _logger.Received(1).LogInformation("Successfully projected booking notes change {BookingId}", bookingId);
    }

    [Theory]
    [InlineData("", "New notes", "Adding notes to empty")]
    [InlineData("Old notes", "", "Clearing notes")]
    [InlineData("Short", "Very long notes with lots of additional information and details", "Expanding notes")]
    [InlineData("Very long notes with lots of information", "Short", "Shortening notes")]
    public async Task Handle_WithDifferentNotesScenarios_ShouldHandleCorrectly(
        string? previousNotes, string? newNotes, string expectedReason)
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousNotes, previousNotes)
            .With(e => e.NewNotes, newNotes)
            .With(e => e.ChangeReason, expectedReason)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
        
        // Verify event data is as expected (test data integrity)
        @event.PreviousNotes.Should().Be(previousNotes);
        @event.NewNotes.Should().Be(newNotes);
        @event.ChangeReason.Should().Be(expectedReason);
    }

    [Fact]
    public async Task Handle_WithEmptyStringNotes_ShouldHandleCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingNotesChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousNotes, "Some notes")
            .With(e => e.NewNotes, string.Empty)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }
}