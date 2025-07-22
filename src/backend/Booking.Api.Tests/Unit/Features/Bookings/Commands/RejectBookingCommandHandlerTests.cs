using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Features.Bookings.Commands;
using Booking.Api.Services.EventSourcing;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace Booking.Api.Tests.Unit.Features.Bookings.Commands;

public class RejectBookingCommandHandlerTests
{
    private readonly IEventSourcedRepository<BookingAggregate> _repository;
    private readonly ILogger<RejectBookingCommandHandler> _logger;
    private readonly RejectBookingCommandHandler _handler;

    public RejectBookingCommandHandlerTests()
    {
        _repository = Substitute.For<IEventSourcedRepository<BookingAggregate>>();
        _logger = Substitute.For<ILogger<RejectBookingCommandHandler>>();
        _handler = new RejectBookingCommandHandler(_repository, _logger);
    }

    [Fact]
    public async Task Handle_WithValidBookingId_ShouldRejectBookingAndReturnTrue()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var command = new RejectBookingCommand(bookingId);

        var aggregate = CreateTestBookingAggregate(bookingId);
        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        aggregate.Status.Should().Be(BookingStatus.Rejected);
        await _repository.Received(1).SaveAsync(aggregate);
    }

    [Fact]
    public async Task Handle_WithNonExistentBookingId_ShouldReturnFalse()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var command = new RejectBookingCommand(bookingId);

        _repository.GetByIdAsync(bookingId).Returns((BookingAggregate?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
        await _repository.DidNotReceive().SaveAsync(Arg.Any<BookingAggregate>());
    }

    [Fact]
    public async Task Handle_WithInvalidBookingStatus_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var command = new RejectBookingCommand(bookingId);

        var aggregate = CreateTestBookingAggregate(bookingId);
        aggregate.Confirm(); // Change status to Confirmed
        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act & Assert
        var act = async () => await _handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    private static BookingAggregate CreateTestBookingAggregate(Guid bookingId)
    {
        return BookingAggregate.Create(
            bookingId,
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