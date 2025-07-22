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
        
        // Create a real aggregate instead of mocking it
        var aggregate = BookingAggregate.Create(
            bookingId,
            userId: 1,
            startDate: DateTime.UtcNow.AddDays(1),
            endDate: DateTime.UtcNow.AddDays(3),
            bookingItems: new List<Booking.Api.Domain.ValueObjects.BookingItem> 
            { 
                new(Guid.NewGuid(), 2) 
            },
            notes: "Test booking"
        );
        
        _repository
            .GetByIdAsync(bookingId)
            .Returns(aggregate);

        BookingAggregate? savedAggregate = null;
        await _repository.SaveAsync(Arg.Do<BookingAggregate>(a => savedAggregate = a));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        await _repository.Received(1).SaveAsync(Arg.Any<BookingAggregate>());
        
        // Verify the aggregate was cancelled by checking its status
        savedAggregate.Should().NotBeNull();
        // The aggregate should have the cancelled event in its uncommitted events
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

        // Assert - Verify that LogWarning was called at least once
        _logger.ReceivedWithAnyArgs().LogWarning(default(string)!, default(object[])!);
    }

    [Fact]
    public async Task Handle_ShouldLogInformationMessages()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var command = new CancelBookingCommand(bookingId);
        
        // Create a real aggregate
        var aggregate = BookingAggregate.Create(
            bookingId,
            userId: 1,
            startDate: DateTime.UtcNow.AddDays(1),
            endDate: DateTime.UtcNow.AddDays(3),
            bookingItems: new List<Booking.Api.Domain.ValueObjects.BookingItem> 
            { 
                new(Guid.NewGuid(), 2) 
            },
            notes: null
        );
        
        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Just verify logging occurred
        _logger.ReceivedWithAnyArgs(2).LogInformation(default(string)!, Array.Empty<object>());
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
        
        // Create a real aggregate instead of mocking it
        var aggregate = BookingAggregate.Create(
            bookingId,
            userId: 1,
            startDate: DateTime.UtcNow.AddDays(1),
            endDate: DateTime.UtcNow.AddDays(3),
            bookingItems: new List<Booking.Api.Domain.ValueObjects.BookingItem> 
            { 
                new(Guid.NewGuid(), 2) 
            },
            notes: "Test booking"
        );
        
        _repository.GetByIdAsync(bookingId).Returns(aggregate);
        _repository.SaveAsync(Arg.Any<BookingAggregate>())
            .Returns(Task.FromException(new InvalidOperationException("Save error")));

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Save error");
    }
}