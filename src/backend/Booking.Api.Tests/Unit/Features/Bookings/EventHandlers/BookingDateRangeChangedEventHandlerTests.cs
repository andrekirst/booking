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

public class BookingDateRangeChangedEventHandlerTests
{
    private readonly IProjectionService<BookingAggregate, BookingReadModel> _projectionService;
    private readonly ILogger<BookingDateRangeChangedEventHandler> _logger;
    private readonly BookingDateRangeChangedEventHandler _handler;
    private readonly IFixture _fixture;

    public BookingDateRangeChangedEventHandlerTests()
    {
        _projectionService = Substitute.For<IProjectionService<BookingAggregate, BookingReadModel>>();
        _logger = Substitute.For<ILogger<BookingDateRangeChangedEventHandler>>();
        _handler = new BookingDateRangeChangedEventHandler(_projectionService, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithValidEvent_ShouldProjectSuccessfully()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
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
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
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
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        var exception = new InvalidOperationException("Projection failed");
        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .ThrowsAsync(exception);

        // Act & Assert
        var thrownException = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _handler.Handle(@event, CancellationToken.None));

        thrownException.Should().Be(exception);
        
        // Verify error was logged
        _logger.ReceivedWithAnyArgs(1).LogError(default(Exception)!, default(string)!, Array.Empty<object>());
    }

    [Fact]
    public async Task Handle_WithDifferentBookingIds_ShouldProjectCorrectBooking()
    {
        // Arrange
        var bookingId1 = Guid.NewGuid();
        var bookingId2 = Guid.NewGuid();
        
        var event1 = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.BookingId, bookingId1)
            .Create();
            
        var event2 = _fixture.Build<BookingDateRangeChangedEvent>()
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
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
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
    public async Task Handle_WhenProjectionServiceThrowsArgumentException_ShouldLogErrorAndRethrow()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        var exception = new ArgumentException("Invalid booking ID");
        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .ThrowsAsync(exception);

        // Act & Assert
        var thrownException = await Assert.ThrowsAsync<ArgumentException>(
            () => _handler.Handle(@event, CancellationToken.None));

        thrownException.Should().Be(exception);
        
        // Verify error was logged
        _logger.ReceivedWithAnyArgs(1).LogError(default(Exception)!, default(string)!, Array.Empty<object>());
    }

    [Fact]
    public async Task Handle_WithEventContainingAllProperties_ShouldStillOnlyProjectByBookingId()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.PreviousStartDate, DateTime.UtcNow.AddDays(1))
            .With(e => e.PreviousEndDate, DateTime.UtcNow.AddDays(3))
            .With(e => e.NewStartDate, DateTime.UtcNow.AddDays(5))
            .With(e => e.NewEndDate, DateTime.UtcNow.AddDays(8))
            .With(e => e.PreviousNights, 2)
            .With(e => e.NewNights, 3)
            .With(e => e.ChangeReason, "Guest requested different dates")
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert - Only booking ID should be used for projection
        await _projectionService.Received(1).ProjectAsync(bookingId, cancellationToken: CancellationToken.None);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(10)]
    public async Task Handle_WithDifferentNightCounts_ShouldHandleCorrectly(int nightCount)
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = startDate.AddDays(nightCount);
        
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .With(e => e.NewStartDate, startDate)
            .With(e => e.NewEndDate, endDate)
            .With(e => e.NewNights, nightCount)
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
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
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
        var changeReason = "Family emergency required date change";
        
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
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
    public async Task Handle_ShouldLogCorrectBookingIdInMessages()
    {
        // Arrange
        var bookingId = Guid.NewGuid(); // Use specific GUID for verification
        var @event = _fixture.Build<BookingDateRangeChangedEvent>()
            .With(e => e.BookingId, bookingId)
            .Create();

        _projectionService.ProjectAsync(bookingId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        // Act
        await _handler.Handle(@event, CancellationToken.None);

        // Assert - Verify both log messages include the correct booking ID
        _logger.Received(1).LogInformation("Handling BookingDateRangeChangedEvent for booking {BookingId}", bookingId);
        _logger.Received(1).LogInformation("Successfully projected booking date range change {BookingId}", bookingId);
    }
}