using AutoFixture.Xunit2;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Features.Bookings.EventHandlers;
using Booking.Api.Services.Projections;
using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace Booking.Api.Tests.Unit.Features.Bookings.EventHandlers;

public class BookingCreatedEventHandlerTests
{
    [Theory, AutoData]
    public async Task Handle_ShouldCallProjectionService(BookingCreatedEvent bookingCreatedEvent)
    {
        // Arrange
        var projectionService = Substitute.For<IProjectionService<BookingAggregate, BookingReadModel>>();
        var logger = Substitute.For<ILogger<BookingCreatedEventHandler>>();
        var handler = new BookingCreatedEventHandler(projectionService, logger);

        // Act
        await handler.Handle(bookingCreatedEvent, CancellationToken.None);

        // Assert
        await projectionService.Received(1).ProjectAsync(
            bookingCreatedEvent.BookingId, 
            Arg.Any<int>(), 
            CancellationToken.None);
    }

    [Theory, AutoData]
    public async Task Handle_WhenProjectionServiceThrows_ShouldLogErrorAndRethrow(BookingCreatedEvent bookingCreatedEvent)
    {
        // Arrange
        var projectionService = Substitute.For<IProjectionService<BookingAggregate, BookingReadModel>>();
        var logger = Substitute.For<ILogger<BookingCreatedEventHandler>>();
        var handler = new BookingCreatedEventHandler(projectionService, logger);
        
        var exception = new InvalidOperationException("Projection failed");
        projectionService.ProjectAsync(Arg.Any<Guid>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException(exception));

        // Act & Assert
        var act = () => handler.Handle(bookingCreatedEvent, CancellationToken.None);
        
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Projection failed");
    }
}