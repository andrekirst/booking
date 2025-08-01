using System;
using System.Threading;
using System.Threading.Tasks;
using AutoFixture;
using Booking.Api.Application.Common;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Features.Bookings.Commands;
using Booking.Api.Services.EventSourcing;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace Booking.Api.Tests.Unit.Features.Bookings.Commands;

public class ChangeNotesCommandHandlerTests
{
    private readonly IEventSourcedRepository<BookingAggregate> _repository;
    private readonly ILogger<ChangeNotesCommandHandler> _logger;
    private readonly ChangeNotesCommandHandler _handler;
    private readonly IFixture _fixture;

    public ChangeNotesCommandHandlerTests()
    {
        _repository = Substitute.For<IEventSourcedRepository<BookingAggregate>>();
        _logger = Substitute.For<ILogger<ChangeNotesCommandHandler>>();
        _handler = new ChangeNotesCommandHandler(_repository, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithValidRequest_ShouldChangeNotesSuccessfully()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "Updated booking notes with additional information";

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Notes changed successfully");

        // Verify aggregate method was called
        aggregate.Received(1).ChangeNotes(newNotes);
        
        // Verify repository operations
        await _repository.Received(1).GetByIdAsync(bookingId);
        await _repository.Received(1).SaveAsync(aggregate);
    }

    [Fact]
    public async Task Handle_WithNullNotes_ShouldSucceed()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        string? newNotes = null;

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify aggregate method was called with null
        aggregate.Received(1).ChangeNotes(null);
    }

    [Fact]
    public async Task Handle_WithEmptyStringNotes_ShouldSucceed()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = string.Empty;

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify aggregate method was called with empty string
        aggregate.Received(1).ChangeNotes(string.Empty);
    }

    [Fact]
    public async Task Handle_WithLongNotes_ShouldSucceed()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = new string('A', 2000); // Long notes

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify aggregate method was called with long notes
        aggregate.Received(1).ChangeNotes(newNotes);
    }

    [Fact]
    public async Task Handle_WithSpecialCharacters_ShouldPreserveCharacters()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "Notes with émojis 🏠 and spëcial charâcters: @#$%^&*()";

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify aggregate method was called with special characters preserved
        aggregate.Received(1).ChangeNotes(newNotes);
    }

    [Fact]
    public async Task Handle_WithNonExistentBooking_ShouldReturnFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "These notes won't be saved";

        var command = new ChangeNotesCommand(bookingId, newNotes);

        _repository.GetByIdAsync(bookingId).Returns((BookingAggregate?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be($"Booking {bookingId} not found");

        // Verify no save operation occurred
        await _repository.DidNotReceive().SaveAsync(Arg.Any<BookingAggregate>());
    }

    [Fact]
    public async Task Handle_WhenAggregateThrowsArgumentException_ShouldReturnFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "Invalid notes";

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        var exceptionMessage = "Notes exceed maximum length";
        aggregate.When(x => x.ChangeNotes(Arg.Any<string>()))
            .Do(x => throw new ArgumentException(exceptionMessage));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be(exceptionMessage);

        // Verify no save operation occurred
        await _repository.DidNotReceive().SaveAsync(Arg.Any<BookingAggregate>());
    }

    [Fact]
    public async Task Handle_WhenAggregateThrowsInvalidOperationException_ShouldReturnFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "Valid notes";

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        var exceptionMessage = "Booking cannot be modified in current state";
        aggregate.When(x => x.ChangeNotes(Arg.Any<string>()))
            .Do(x => throw new InvalidOperationException(exceptionMessage));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be(exceptionMessage);

        // Verify no save operation occurred
        await _repository.DidNotReceive().SaveAsync(Arg.Any<BookingAggregate>());
    }

    [Fact]
    public async Task Handle_WhenRepositoryThrowsException_ShouldReturnFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "Valid notes";

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);
        _repository.SaveAsync(aggregate).ThrowsAsync(new InvalidOperationException("Database error"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Database error");
    }

    [Fact]
    public async Task Handle_WhenUnexpectedExceptionOccurs_ShouldReturnGenericFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "Valid notes";

        var command = new ChangeNotesCommand(bookingId, newNotes);

        _repository.GetByIdAsync(bookingId).ThrowsAsync(new OutOfMemoryException("Unexpected error"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("An unexpected error occurred while changing notes");
    }

    [Fact]
    public async Task Handle_ShouldLogInformationMessages()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "Test notes for logging";

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Verify logging occurred
        _logger.ReceivedWithAnyArgs(2).LogInformation(default(string)!, Array.Empty<object>());
    }

    [Fact]
    public async Task Handle_WhenBookingNotFound_ShouldLogWarning()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "Notes for non-existent booking";

        var command = new ChangeNotesCommand(bookingId, newNotes);

        _repository.GetByIdAsync(bookingId).Returns((BookingAggregate?)null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Verify both Information and Warning logs were called
        _logger.ReceivedWithAnyArgs(1).LogWarning(default(string)!, Array.Empty<object>());
        _logger.ReceivedWithAnyArgs(1).LogInformation(default(string)!, Array.Empty<object>());
    }

    [Theory]
    [InlineData("Simple notes")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("Very long notes with lots of information and details about the booking")]
    public async Task Handle_WithDifferentNotesContent_ShouldHandleCorrectly(string? notes)
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var command = new ChangeNotesCommand(bookingId, notes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify correct notes content was passed
        aggregate.Received(1).ChangeNotes(notes);
    }

    [Fact]
    public async Task Handle_WithWhitespaceOnlyNotes_ShouldPreserveWhitespace()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newNotes = "   \t\n   "; // Only whitespace

        var command = new ChangeNotesCommand(bookingId, newNotes);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify whitespace-only notes are preserved as-is
        aggregate.Received(1).ChangeNotes(newNotes);
    }
}