using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoFixture;
using Booking.Api.Application.Common;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Features.Bookings.Commands;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Services.EventSourcing;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace Booking.Api.Tests.Unit.Features.Bookings.Commands;

public class ChangeAccommodationsCommandHandlerTests
{
    private readonly IEventSourcedRepository<BookingAggregate> _repository;
    private readonly ILogger<ChangeAccommodationsCommandHandler> _logger;
    private readonly ChangeAccommodationsCommandHandler _handler;
    private readonly IFixture _fixture;

    public ChangeAccommodationsCommandHandlerTests()
    {
        _repository = Substitute.For<IEventSourcedRepository<BookingAggregate>>();
        _logger = Substitute.For<ILogger<ChangeAccommodationsCommandHandler>>();
        _handler = new ChangeAccommodationsCommandHandler(_repository, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithValidRequest_ShouldChangeAccommodationsSuccessfully()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var accommodationId1 = _fixture.Create<Guid>();
        var accommodationId2 = _fixture.Create<Guid>();

        var bookingItems = new List<BookingItemDto>
        {
            new(accommodationId1, "Room 1", 2),
            new(accommodationId2, "Room 2", 3)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Accommodations changed successfully");

        // Verify aggregate method was called with correct booking items
        aggregate.Received(1).ChangeAccommodations(Arg.Is<List<BookingItem>>(items =>
            items.Count == 2 &&
            items.Any(x => x.SleepingAccommodationId == accommodationId1 && x.PersonCount == 2) &&
            items.Any(x => x.SleepingAccommodationId == accommodationId2 && x.PersonCount == 3)
        ));
        
        // Verify repository operations
        await _repository.Received(1).GetByIdAsync(bookingId);
        await _repository.Received(1).SaveAsync(aggregate);
    }

    [Fact]
    public async Task Handle_WithEmptyBookingItems_ShouldSucceed()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var emptyBookingItems = new List<BookingItemDto>();

        var command = new ChangeAccommodationsCommand(bookingId, emptyBookingItems);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify aggregate method was called with empty list
        aggregate.Received(1).ChangeAccommodations(Arg.Is<List<BookingItem>>(items => items.Count == 0));
    }

    [Fact]
    public async Task Handle_WithSingleBookingItem_ShouldSucceed()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var accommodationId = _fixture.Create<Guid>();

        var bookingItems = new List<BookingItemDto>
        {
            new(accommodationId, "Room", 4)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify correct conversion from DTO to domain object
        aggregate.Received(1).ChangeAccommodations(Arg.Is<List<BookingItem>>(items =>
            items.Count == 1 &&
            items[0].SleepingAccommodationId == accommodationId &&
            items[0].PersonCount == 4
        ));
    }

    [Fact]
    public async Task Handle_WithNonExistentBooking_ShouldReturnFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var bookingItems = new List<BookingItemDto>
        {
            new(_fixture.Create<Guid>(), "Room", 2)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);

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
        var bookingItems = new List<BookingItemDto>
        {
            new(_fixture.Create<Guid>(), "Room", 0) // Invalid person count
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        var exceptionMessage = "Person count must be greater than 0";
        aggregate.When(x => x.ChangeAccommodations(Arg.Any<List<BookingItem>>()))
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
        var bookingItems = new List<BookingItemDto>
        {
            new(_fixture.Create<Guid>(), "Room", 2)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);
        var aggregate = Substitute.For<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        var exceptionMessage = "Booking cannot be modified in current state";
        aggregate.When(x => x.ChangeAccommodations(Arg.Any<List<BookingItem>>()))
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
        var bookingItems = new List<BookingItemDto>
        {
            new(_fixture.Create<Guid>(), "Room", 2)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);
        _repository.SaveAsync(aggregate).ThrowsAsync(new InvalidOperationException("Database error"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("An unexpected error occurred while changing accommodations");
    }

    [Fact]
    public async Task Handle_WhenUnexpectedExceptionOccurs_ShouldReturnGenericFailureResult()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var bookingItems = new List<BookingItemDto>
        {
            new(_fixture.Create<Guid>(), "Room", 2)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);

        _repository.GetByIdAsync(bookingId).ThrowsAsync(new OutOfMemoryException("Unexpected error"));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("An unexpected error occurred while changing accommodations");
    }

    [Fact]
    public async Task Handle_ShouldLogInformationMessages()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var bookingItems = new List<BookingItemDto>
        {
            new(_fixture.Create<Guid>(), "Room", 2),
            new(_fixture.Create<Guid>(), "Room 2", 3)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Verify logging occurred with correct item count
        _logger.ReceivedWithAnyArgs(2).LogInformation(default(string)!, Array.Empty<object>());
    }

    [Fact]
    public async Task Handle_WhenBookingNotFound_ShouldLogWarning()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var bookingItems = new List<BookingItemDto>
        {
            new(_fixture.Create<Guid>(), "Room", 2)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);

        _repository.GetByIdAsync(bookingId).Returns((BookingAggregate?)null);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Verify warning was logged
        _logger.ReceivedWithAnyArgs(1).LogWarning(default(string)!, Array.Empty<object>());
    }

    [Theory]
    [InlineData(1)]
    [InlineData(3)]
    [InlineData(5)]
    public async Task Handle_WithDifferentNumberOfItems_ShouldHandleCorrectly(int itemCount)
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var bookingItems = new List<BookingItemDto>();

        for (int i = 0; i < itemCount; i++)
        {
            bookingItems.Add(new BookingItemDto(
                _fixture.Create<Guid>(),
                $"Room {i + 1}",
                i + 1
            ));
        }

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        // Verify correct number of items were passed
        aggregate.Received(1).ChangeAccommodations(Arg.Is<List<BookingItem>>(items => items.Count == itemCount));
    }

    [Fact]
    public async Task Handle_ShouldConvertDtosToBookingItemsCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var accommodationId1 = Guid.NewGuid();
        var accommodationId2 = Guid.NewGuid();

        var bookingItems = new List<BookingItemDto>
        {
            new(accommodationId1, "Room 1", 2),
            new(accommodationId2, "Room 2", 4)
        };

        var command = new ChangeAccommodationsCommand(bookingId, bookingItems);
        var aggregate = _fixture.Create<BookingAggregate>();

        _repository.GetByIdAsync(bookingId).Returns(aggregate);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Verify exact mapping from DTOs to domain objects
        aggregate.Received(1).ChangeAccommodations(Arg.Is<List<BookingItem>>(items =>
            items.Count == 2 &&
            items[0].SleepingAccommodationId == accommodationId1 &&
            items[0].PersonCount == 2 &&
            items[1].SleepingAccommodationId == accommodationId2 &&
            items[1].PersonCount == 4
        ));
    }
}