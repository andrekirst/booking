using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Data;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using FluentAssertions;
using System.Text.Json;
using Booking.Api.Domain.ValueObjects;

namespace Booking.Api.Tests.Features.Bookings.Queries;

public class GetBookingsQueryTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly ILogger<GetBookingsQueryHandler> _logger;
    private readonly GetBookingsQueryHandler _handler;

    public GetBookingsQueryTests()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BookingDbContext(options);
        _logger = Substitute.For<ILogger<GetBookingsQueryHandler>>();
        _handler = new GetBookingsQueryHandler(_context, _logger);

        SeedTestData();
    }

    private void SeedTestData()
    {
        var bookingItems = new List<BookingItem>
        {
            new(Guid.NewGuid(), 2)
        };
        var bookingItemsJson = JsonSerializer.Serialize(bookingItems);

        var bookings = new List<BookingReadModel>
        {
            new()
            {
                Id = Guid.NewGuid(),
                UserId = 1,
                UserName = "User 1",
                UserEmail = "user1@test.com",
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(3),
                Status = BookingStatus.Pending,
                Notes = "Test booking 1",
                BookingItemsJson = bookingItemsJson,
                TotalPersons = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                ChangedAt = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = 2,
                UserName = "User 2",
                UserEmail = "user2@test.com",
                StartDate = DateTime.Today.AddDays(5),
                EndDate = DateTime.Today.AddDays(7),
                Status = BookingStatus.Accepted,
                Notes = "Test booking 2",
                BookingItemsJson = bookingItemsJson,
                TotalPersons = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                ChangedAt = DateTime.UtcNow.AddDays(-2)
            },
            new()
            {
                Id = Guid.NewGuid(),
                UserId = 1,
                UserName = "User 1",
                UserEmail = "user1@test.com",
                StartDate = DateTime.Today.AddDays(10),
                EndDate = DateTime.Today.AddDays(12),
                Status = BookingStatus.Rejected,
                Notes = "Test booking 3",
                BookingItemsJson = bookingItemsJson,
                TotalPersons = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                ChangedAt = DateTime.UtcNow.AddDays(-3)
            }
        };

        _context.BookingReadModels.AddRange(bookings);
        _context.SaveChanges();
    }

    [Fact]
    public async Task Handle_WithoutStatusFilter_ReturnsAllBookings()
    {
        // Arrange
        var query = new GetBookingsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(b => b.Status == BookingStatus.Pending);
        result.Should().Contain(b => b.Status == BookingStatus.Accepted);
        result.Should().Contain(b => b.Status == BookingStatus.Rejected);
    }

    [Fact]
    public async Task Handle_WithPendingStatusFilter_ReturnsOnlyPendingBookings()
    {
        // Arrange
        var query = new GetBookingsQuery(Status: BookingStatus.Pending);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().AllSatisfy(b => b.Status.Should().Be(BookingStatus.Pending));
    }

    [Fact]
    public async Task Handle_WithAcceptedStatusFilter_ReturnsOnlyAcceptedBookings()
    {
        // Arrange
        var query = new GetBookingsQuery(Status: BookingStatus.Accepted);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().AllSatisfy(b => b.Status.Should().Be(BookingStatus.Accepted));
    }

    [Fact]
    public async Task Handle_WithRejectedStatusFilter_ReturnsOnlyRejectedBookings()
    {
        // Arrange
        var query = new GetBookingsQuery(Status: BookingStatus.Rejected);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().AllSatisfy(b => b.Status.Should().Be(BookingStatus.Rejected));
    }

    [Fact]
    public async Task Handle_WithNonExistentStatusFilter_ReturnsEmptyList()
    {
        // Arrange
        var query = new GetBookingsQuery(Status: BookingStatus.Completed);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WithUserIdAndStatusFilter_ReturnsCombinedFilteredBookings()
    {
        // Arrange
        var query = new GetBookingsQuery(UserId: 1, Status: BookingStatus.Pending);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().AllSatisfy(b => 
        {
            b.UserId.Should().Be(1);
            b.Status.Should().Be(BookingStatus.Pending);
        });
    }

    [Fact]
    public async Task Handle_WithUserIdAndNonMatchingStatus_ReturnsEmptyList()
    {
        // Arrange
        var query = new GetBookingsQuery(UserId: 1, Status: BookingStatus.Accepted);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_BookingsAreOrderedByStartDate()
    {
        // Arrange
        var query = new GetBookingsQuery();

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeInAscendingOrder(b => b.StartDate);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}