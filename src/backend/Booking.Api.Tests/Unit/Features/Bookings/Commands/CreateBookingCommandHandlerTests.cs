using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoFixture;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.Enums;
using Booking.Api.Features.Bookings.Commands;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Services.EventSourcing;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Booking.Api.Tests.Unit.Features.Bookings.Commands;

public class CreateBookingCommandHandlerTests
{
    private readonly IEventSourcedRepository<BookingAggregate> _repository;
    private readonly ILogger<CreateBookingCommandHandler> _logger;
    private readonly CreateBookingCommandHandler _handler;
    private readonly IFixture _fixture;

    public CreateBookingCommandHandlerTests()
    {
        _repository = Substitute.For<IEventSourcedRepository<BookingAggregate>>();
        _logger = Substitute.For<ILogger<CreateBookingCommandHandler>>();
        _handler = new CreateBookingCommandHandler(_repository, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithValidRequest_ShouldCreateBookingAndReturnDto()
    {
        // Arrange
        var userId = _fixture.Create<int>();
        var accommodationId = _fixture.Create<Guid>();
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = DateTime.UtcNow.AddDays(3);
        var notes = _fixture.Create<string>();
        var personCount = _fixture.Create<int>();

        var bookingDto = new CreateBookingDto(
            startDate,
            endDate,
            notes,
            new List<CreateBookingItemDto>
            {
                new(accommodationId, personCount)
            }
        );

        var command = new CreateBookingCommand(userId, bookingDto);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(userId);
        result.StartDate.Should().Be(startDate);
        result.EndDate.Should().Be(endDate);
        result.Status.Should().Be(BookingStatus.Pending);
        result.Notes.Should().Be(notes);
        result.BookingItems.Should().HaveCount(1);
        result.BookingItems.First().SleepingAccommodationId.Should().Be(accommodationId);
        result.BookingItems.First().PersonCount.Should().Be(personCount);
        result.TotalPersons.Should().Be(personCount);
        result.NumberOfNights.Should().Be(2);
        result.Id.Should().NotBeEmpty();

        // Verify repository was called
        await _repository.Received(1).SaveAsync(Arg.Any<BookingAggregate>());
    }

    [Fact]
    public async Task Handle_WithMultipleBookingItems_ShouldCalculateTotalPersonsCorrectly()
    {
        // Arrange
        var userId = _fixture.Create<int>();
        var accommodationId1 = _fixture.Create<Guid>();
        var accommodationId2 = _fixture.Create<Guid>();
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = DateTime.UtcNow.AddDays(3);

        var bookingDto = new CreateBookingDto(
            startDate,
            endDate,
            null,
            new List<CreateBookingItemDto>
            {
                new(accommodationId1, 2),
                new(accommodationId2, 3)
            }
        );

        var command = new CreateBookingCommand(userId, bookingDto);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.TotalPersons.Should().Be(5);
        result.BookingItems.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_WhenRepositoryThrows_ShouldPropagateException()
    {
        // Arrange
        var command = new CreateBookingCommand(
            _fixture.Create<int>(),
            new CreateBookingDto(
                DateTime.UtcNow.AddDays(1),
                DateTime.UtcNow.AddDays(3),
                null,
                new List<CreateBookingItemDto>
                {
                    new(_fixture.Create<Guid>(), 2)
                }
            )
        );

        _repository.SaveAsync(Arg.Any<BookingAggregate>())
            .Returns(Task.FromException(new InvalidOperationException("Repository error")));

        // Act & Assert
        await _handler.Invoking(h => h.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Repository error");
    }

    [Fact]
    public async Task Handle_ShouldLogInformationMessages()
    {
        // Arrange
        var userId = _fixture.Create<int>();
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = DateTime.UtcNow.AddDays(3);

        var command = new CreateBookingCommand(
            userId,
            new CreateBookingDto(
                startDate,
                endDate,
                null,
                new List<CreateBookingItemDto>
                {
                    new(_fixture.Create<Guid>(), 2)
                }
            )
        );

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert - Just verify that some logging occurred
        _logger.ReceivedWithAnyArgs(2).LogInformation(default(string)!, Array.Empty<object>());
    }
}