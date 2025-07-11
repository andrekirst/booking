using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AutoFixture;
using Booking.Api.Data;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Features.Bookings.Queries;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Booking.Api.Tests.Unit.Features.Bookings.Queries;

public class GetBookingByIdQueryHandlerTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly ILogger<GetBookingByIdQueryHandler> _logger;
    private readonly GetBookingByIdQueryHandler _handler;
    private readonly IFixture _fixture;

    public GetBookingByIdQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BookingDbContext(options);
        _logger = Substitute.For<ILogger<GetBookingByIdQueryHandler>>();
        _handler = new GetBookingByIdQueryHandler(_context, _logger);
        _fixture = new Fixture();
    }

    [Fact]
    public async Task Handle_WithExistingBooking_ShouldReturnBookingDto()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var userId = _fixture.Create<int>();
        var userName = _fixture.Create<string>();
        var userEmail = _fixture.Create<string>();
        var startDate = DateTime.UtcNow.AddDays(1);
        var endDate = DateTime.UtcNow.AddDays(3);
        var notes = _fixture.Create<string>();
        var accommodationId = _fixture.Create<Guid>();
        var personCount = 2;

        var bookingItems = new List<BookingItem>
        {
            new(accommodationId, personCount)
        };

        var bookingReadModel = new BookingReadModel
        {
            Id = bookingId,
            UserId = userId,
            UserName = userName,
            UserEmail = userEmail,
            StartDate = startDate,
            EndDate = endDate,
            Status = BookingStatus.Pending,
            Notes = notes,
            BookingItemsJson = JsonSerializer.Serialize(bookingItems),
            TotalPersons = personCount,
            CreatedAt = DateTime.UtcNow,
            ChangedAt = null,
            LastEventVersion = 1
        };

        _context.BookingReadModels.Add(bookingReadModel);
        await _context.SaveChangesAsync();

        var query = new GetBookingByIdQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(bookingId);
        result.UserId.Should().Be(userId);
        result.UserName.Should().Be(userName);
        result.UserEmail.Should().Be(userEmail);
        result.StartDate.Should().Be(startDate);
        result.EndDate.Should().Be(endDate);
        result.Status.Should().Be(BookingStatus.Pending);
        result.Notes.Should().Be(notes);
        result.TotalPersons.Should().Be(personCount);
        result.NumberOfNights.Should().Be(2);
        result.BookingItems.Should().HaveCount(1);
        result.BookingItems.First().SleepingAccommodationId.Should().Be(accommodationId);
        result.BookingItems.First().PersonCount.Should().Be(personCount);
    }

    [Fact]
    public async Task Handle_WithNonExistentBooking_ShouldReturnNull()
    {
        // Arrange
        var nonExistentBookingId = _fixture.Create<Guid>();
        var query = new GetBookingByIdQuery(nonExistentBookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithNonExistentBooking_ShouldLogWarning()
    {
        // Arrange
        var nonExistentBookingId = _fixture.Create<Guid>();
        var query = new GetBookingByIdQuery(nonExistentBookingId);

        // Act
        await _handler.Handle(query, CancellationToken.None);

        // Assert
        _logger.Received(1).LogWarning("Booking {BookingId} not found", nonExistentBookingId);
    }

    [Fact]
    public async Task Handle_ShouldLogInformationMessage()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var query = new GetBookingByIdQuery(bookingId);

        // Act
        await _handler.Handle(query, CancellationToken.None);

        // Assert
        _logger.Received(1).LogInformation("Getting booking {BookingId}", bookingId);
    }

    [Fact]
    public async Task Handle_WithMultipleBookingItems_ShouldDeserializeCorrectly()
    {
        // Arrange
        var bookingId = _fixture.Create<Guid>();
        var accommodationId1 = _fixture.Create<Guid>();
        var accommodationId2 = _fixture.Create<Guid>();

        var bookingItems = new List<BookingItem>
        {
            new(accommodationId1, 2),
            new(accommodationId2, 3)
        };

        var bookingReadModel = new BookingReadModel
        {
            Id = bookingId,
            UserId = _fixture.Create<int>(),
            UserName = _fixture.Create<string>(),
            UserEmail = _fixture.Create<string>(),
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(3),
            Status = BookingStatus.Confirmed,
            Notes = null,
            BookingItemsJson = JsonSerializer.Serialize(bookingItems),
            TotalPersons = 5,
            CreatedAt = DateTime.UtcNow,
            ChangedAt = null,
            LastEventVersion = 1
        };

        _context.BookingReadModels.Add(bookingReadModel);
        await _context.SaveChangesAsync();

        var query = new GetBookingByIdQuery(bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.BookingItems.Should().HaveCount(2);
        result.BookingItems.Should().Contain(bi => bi.SleepingAccommodationId == accommodationId1 && bi.PersonCount == 2);
        result.BookingItems.Should().Contain(bi => bi.SleepingAccommodationId == accommodationId2 && bi.PersonCount == 3);
        result.TotalPersons.Should().Be(5);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}