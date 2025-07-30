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

public class ChangeDateRangeCommandHandlerTests
{
    private readonly IEventSourcedRepository<BookingAggregate> _repository;
    private readonly ILogger<ChangeDateRangeCommandHandler> _logger;
    private readonly ChangeDateRangeCommandHandler _handler;
    private readonly IFixture _fixture;

    public ChangeDateRangeCommandHandlerTests()
    {
        _repository = Substitute.For<IEventSourcedRepository<BookingAggregate>>();
        _logger = Substitute.For<ILogger<ChangeDateRangeCommandHandler>>();
        _handler = new ChangeDateRangeCommandHandler(_repository, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithValidRequest_ShouldChangeDateRangeSuccessfully()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);
        var changeReason = "Guest requested different dates";

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate, changeReason);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Date range changed successfully");

        // Verify aggregate method was called
        aggregate.Received(1).ChangeDateRange(newStartDate, newEndDate, changeReason);
        
        // Verify repository operations
        await _repository.Received(1).GetByIdAsync(bookingId);
        await _repository.Received(1).SaveAsync(aggregate);
    }

    [Fact]
    public async Task Handle_WithNonExistentBooking_ShouldReturnFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate);

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
    public async Task Handle_WithoutChangeReason_ShouldSucceed()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify aggregate method was called with null reason
        aggregate.Received(1).ChangeDateRange(newStartDate, newEndDate, null);
    }

    [Fact]
    public async Task Handle_WhenAggregateThrowsArgumentException_ShouldReturnFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        var exceptionMessage = "Invalid date range";
        aggregate.When(x => x.ChangeDateRange(Arg.Any<DateTime>(), Arg.Any<DateTime>(), Arg.Any<string>()))
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
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        var exceptionMessage = "Booking cannot be modified in current state";
        aggregate.When(x => x.ChangeDateRange(Arg.Any<DateTime>(), Arg.Any<DateTime>(), Arg.Any<string>()))
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
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);
        _repository.SaveAsync(aggregate).ThrowsAsync(new InvalidOperationException("Database error"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();  
        result.Message.Should().Be("An unexpected error occurred while changing the date range");
    }

    [Fact]
    public async Task Handle_WhenUnexpectedExceptionOccurs_ShouldReturnGenericFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate);

        _repository.GetByIdAsync(bookingId).ThrowsAsync(new OutOfMemoryException("Unexpected error"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("An unexpected error occurred while changing the date range");
    }

    [Fact]
    public async Task Handle_ShouldLogInformationMessages()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate);
        var aggregate = _fixture.Create<BookingAggregate>();

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
        var newStartDate = DateTime.UtcNow.AddDays(5);
        var newEndDate = DateTime.UtcNow.AddDays(8);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate);

        _repository.GetByIdAsync(bookingId).Returns((BookingAggregate?)null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Verify warning was logged
        _logger.ReceivedWithAnyArgs(1).LogWarning(default(string)!, Array.Empty<object>());
    }

    [Theory]
    [InlineData("2025-08-01", "2025-08-05", "Extended vacation")]
    [InlineData("2025-07-15", "2025-07-18", "Earlier arrival")]
    [InlineData("2025-09-10", "2025-09-12", null)]
    public async Task Handle_WithDifferentDateRanges_ShouldHandleCorrectly(
        string startDateStr, string endDateStr, string? reason)
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var newStartDate = DateTime.Parse(startDateStr);
        var newEndDate = DateTime.Parse(endDateStr);

        var command = new ChangeDateRangeCommand(bookingId, newStartDate, newEndDate, reason);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify correct parameters were passed
        aggregate.Received(1).ChangeDateRange(newStartDate, newEndDate, reason);
    }
}