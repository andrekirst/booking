using AutoFixture;
using Booking.Api.Data;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Features.Bookings.Queries;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Booking.Api.Tests.Unit.Features.Bookings.Queries;

public class GetBookingsQueryHandlerCombinedFiltersTests : IDisposable
{
    private readonly DbContextOptions<BookingDbContext> _options;
    private readonly BookingDbContext _context;
    private readonly ILogger<GetBookingsQueryHandler> _logger;
    private readonly GetBookingsQueryHandler _handler;
    private readonly Fixture _fixture;

    public GetBookingsQueryHandlerCombinedFiltersTests()
    {
        _fixture = new Fixture();
        
        _options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
            
        _context = new BookingDbContext(_options);
        _logger = Substitute.For<ILogger<GetBookingsQueryHandler>>();
        _handler = new GetBookingsQueryHandler(_context, _logger);
    }

    [Fact]
    public async Task Handle_WithTimeRangeAndStatusFilter_ShouldReturnMatchingBookings()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        
        // Create test data with different combinations
        var futureAcceptedBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3), BookingStatus.Accepted);
        var futurePendingBooking = CreateBookingReadModel(today.AddDays(2), today.AddDays(4), BookingStatus.Pending);
        var pastAcceptedBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3), BookingStatus.Accepted);
        var pastPendingBooking = CreateBookingReadModel(today.AddDays(-4), today.AddDays(-2), BookingStatus.Pending);

        await _context.BookingReadModels.AddRangeAsync(
            futureAcceptedBooking, futurePendingBooking, pastAcceptedBooking, pastPendingBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            TimeRange: TimeRange.Future,
            Status: BookingStatus.Accepted
        );

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(b => b.Id == futureAcceptedBooking.Id);
        result.Should().NotContain(b => b.Id == futurePendingBooking.Id);
        result.Should().NotContain(b => b.Id == pastAcceptedBooking.Id);
        result.Should().NotContain(b => b.Id == pastPendingBooking.Id);
    }

    [Fact]
    public async Task Handle_WithAllTimeRangeAndSpecificStatus_ShouldReturnAllBookingsWithStatus()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        
        var futureAcceptedBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3), BookingStatus.Accepted);
        var futurePendingBooking = CreateBookingReadModel(today.AddDays(2), today.AddDays(4), BookingStatus.Pending);
        var pastAcceptedBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3), BookingStatus.Accepted);
        var pastPendingBooking = CreateBookingReadModel(today.AddDays(-4), today.AddDays(-2), BookingStatus.Pending);

        await _context.BookingReadModels.AddRangeAsync(
            futureAcceptedBooking, futurePendingBooking, pastAcceptedBooking, pastPendingBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            TimeRange: TimeRange.All,
            Status: BookingStatus.Accepted
        );

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.Id == futureAcceptedBooking.Id);
        result.Should().Contain(b => b.Id == pastAcceptedBooking.Id);
        result.Should().NotContain(b => b.Id == futurePendingBooking.Id);
        result.Should().NotContain(b => b.Id == pastPendingBooking.Id);
    }

    [Fact]
    public async Task Handle_WithUserIdTimeRangeAndStatus_ShouldApplyAllFilters()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        
        // User 1 bookings
        var user1FutureAccepted = CreateBookingReadModel(today.AddDays(1), today.AddDays(3), BookingStatus.Accepted, userId: 1);
        var user1FuturePending = CreateBookingReadModel(today.AddDays(2), today.AddDays(4), BookingStatus.Pending, userId: 1);
        
        // User 2 bookings
        var user2FutureAccepted = CreateBookingReadModel(today.AddDays(1), today.AddDays(3), BookingStatus.Accepted, userId: 2);
        var user2FuturePending = CreateBookingReadModel(today.AddDays(2), today.AddDays(4), BookingStatus.Pending, userId: 2);

        await _context.BookingReadModels.AddRangeAsync(
            user1FutureAccepted, user1FuturePending, user2FutureAccepted, user2FuturePending);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            UserId: 1,
            TimeRange: TimeRange.Future,
            Status: BookingStatus.Accepted
        );

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(b => b.Id == user1FutureAccepted.Id);
        result.Should().NotContain(b => b.Id == user1FuturePending.Id);
        result.Should().NotContain(b => b.Id == user2FutureAccepted.Id);
        result.Should().NotContain(b => b.Id == user2FuturePending.Id);
    }

    [Fact]
    public async Task Handle_WithOnlyStatusFilter_ShouldApplyStatusAndDefaultTimeRange()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        
        var futureAcceptedBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3), BookingStatus.Accepted);
        var pastAcceptedBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3), BookingStatus.Accepted);
        var futurePendingBooking = CreateBookingReadModel(today.AddDays(2), today.AddDays(4), BookingStatus.Pending);

        await _context.BookingReadModels.AddRangeAsync(
            futureAcceptedBooking, pastAcceptedBooking, futurePendingBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(Status: BookingStatus.Accepted);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert - Should apply Status filter AND default TimeRange.Future
        result.Should().HaveCount(1);
        result.Should().Contain(b => b.Id == futureAcceptedBooking.Id);
        result.Should().NotContain(b => b.Id == pastAcceptedBooking.Id); // Filtered out by default TimeRange.Future
        result.Should().NotContain(b => b.Id == futurePendingBooking.Id); // Filtered out by Status
    }

    [Fact]
    public async Task Handle_WithNoMatchingResults_ShouldReturnEmptyList()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        
        var futurePendingBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3), BookingStatus.Pending);
        var pastAcceptedBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3), BookingStatus.Accepted);

        await _context.BookingReadModels.AddRangeAsync(futurePendingBooking, pastAcceptedBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            TimeRange: TimeRange.Future,
            Status: BookingStatus.Confirmed // No confirmed bookings in test data
        );

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    private BookingReadModel CreateBookingReadModel(DateTime startDate, DateTime endDate, BookingStatus status, int userId = 1)
    {
        return new BookingReadModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserName = _fixture.Create<string>(),
            UserEmail = _fixture.Create<string>(),
            StartDate = startDate,
            EndDate = endDate,
            Status = status,
            Notes = _fixture.Create<string>(),
            BookingItemsJson = "[]",
            TotalPersons = _fixture.Create<int>(),
            CreatedAt = DateTime.UtcNow,
            ChangedAt = DateTime.UtcNow
        };
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}