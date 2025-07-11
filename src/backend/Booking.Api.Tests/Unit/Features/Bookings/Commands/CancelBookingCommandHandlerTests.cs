using System;
using System.Threading;
using System.Threading.Tasks;
using AutoFixture;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Features.Bookings.Commands;
using Booking.Api.Services.EventSourcing;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Booking.Api.Tests.Unit.Features.Bookings.Commands;

public class CancelBookingCommandHandlerTests
{
    private readonly IEventSourcedRepository<BookingAggregate> _repository;
    private readonly ILogger<CancelBookingCommandHandler> _logger;
    private readonly CancelBookingCommandHandler _handler;
    private readonly IFixture _fixture;

    public CancelBookingCommandHandlerTests()
    {
        _repository = Substitute.For<IEventSourcedRepository<BookingAggregate>>();
        _logger = Substitute.For<ILogger<CancelBookingCommandHandler>>();
        _handler = new CancelBookingCommandHandler(_repository, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithExistingBooking_ShouldCancelAndReturnTrue()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var command = new CancelBookingCommand(bookingId);
        
        var aggregate = Substitute.For<BookingAggregate>();
        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        aggregate.Received(1).Cancel();
        await _repository.Received(1).SaveAsync(aggregate);
    }

    [Fact]
    public async Task Handle_WithNonExistentBooking_ShouldReturnFalse()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var command = new CancelBookingCommand(bookingId);
        
        _repository.GetByIdAsync(bookingId).Returns((BookingAggregate?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
        await _repository.DidNotReceive().SaveAsync(Arg.Any<BookingAggregate>());
    }

    [Fact]
    public async Task Handle_WithNonExistentBooking_ShouldLogWarning()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var command = new CancelBookingCommand(bookingId);
        
        _repository.GetByIdAsync(bookingId).Returns((BookingAggregate?)null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _logger.Received(1).LogWarning("Booking {BookingId} not found", bookingId);
    }

    [Fact]
    public async Task Handle_ShouldLogInformationMessages()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var command = new CancelBookingCommand(bookingId);
        
        var aggregate = Substitute.For<BookingAggregate>();
        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _logger.Received(1).LogInformation("Cancelling booking {BookingId}", bookingId);
        _logger.Received(1).LogInformation("Successfully cancelled booking {BookingId}", bookingId);
    }

    [Fact]
    public async Task Handle_WhenRepositoryGetThrows_ShouldPropagateException()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var command = new CancelBookingCommand(bookingId);
        
        _repository.GetByIdAsync(bookingId)
            .Returns(Task.FromException<BookingAggregate?>(new InvalidOperationException("Repository error")));

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Repository error");
    }

    [Fact]
    public async Task Handle_WhenRepositorySaveThrows_ShouldPropagateException()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var command = new CancelBookingCommand(bookingId);
        
        var aggregate = Substitute.For<BookingAggregate>();
        _repository.GetByIdAsync(bookingId).Returns(aggregate);
        _repository.SaveAsync(aggregate)
            .Returns(Task.FromException(new InvalidOperationException("Save error")));

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Save error");
    }
}