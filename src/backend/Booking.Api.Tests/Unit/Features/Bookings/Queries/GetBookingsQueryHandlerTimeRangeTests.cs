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

public class GetBookingsQueryHandlerTimeRangeTests : IDisposable
{
    private readonly DbContextOptions<BookingDbContext> _options;
    private readonly BookingDbContext _context;
    private readonly ILogger<GetBookingsQueryHandler> _logger;
    private readonly GetBookingsQueryHandler _handler;
    private readonly Fixture _fixture;

    public GetBookingsQueryHandlerTimeRangeTests()
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
    public async Task Handle_WithTimeRangeFuture_ShouldReturnOnlyFutureBookings()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var pastBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3));
        var currentBooking = CreateBookingReadModel(today.AddDays(-1), today.AddDays(1));
        var futureBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3));

        await _context.BookingReadModels.AddRangeAsync(pastBooking, currentBooking, futureBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(TimeRange: TimeRange.Future);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.Id == currentBooking.Id);
        result.Should().Contain(b => b.Id == futureBooking.Id);
        result.Should().NotContain(b => b.Id == pastBooking.Id);
    }

    [Fact]
    public async Task Handle_WithTimeRangeAll_ShouldReturnAllBookings()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var pastBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3));
        var currentBooking = CreateBookingReadModel(today.AddDays(-1), today.AddDays(1));
        var futureBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3));

        await _context.BookingReadModels.AddRangeAsync(pastBooking, currentBooking, futureBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(TimeRange: TimeRange.All);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(b => b.Id == pastBooking.Id);
        result.Should().Contain(b => b.Id == currentBooking.Id);
        result.Should().Contain(b => b.Id == futureBooking.Id);
    }

    [Fact]
    public async Task Handle_WithTimeRangePast_ShouldReturnOnlyPastBookings()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var pastBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3));
        var currentBooking = CreateBookingReadModel(today.AddDays(-1), today.AddDays(1));
        var futureBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3));

        await _context.BookingReadModels.AddRangeAsync(pastBooking, currentBooking, futureBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(TimeRange: TimeRange.Past);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(b => b.Id == pastBooking.Id);
        result.Should().NotContain(b => b.Id == currentBooking.Id);
        result.Should().NotContain(b => b.Id == futureBooking.Id);
    }

    [Fact]
    public async Task Handle_WithTimeRangeLast30Days_ShouldReturnBookingsFromLast30Days()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var oldBooking = CreateBookingReadModel(today.AddDays(-40), today.AddDays(-38));
        var recentBooking = CreateBookingReadModel(today.AddDays(-20), today.AddDays(-18));
        var futureBooking = CreateBookingReadModel(today.AddDays(5), today.AddDays(7));

        await _context.BookingReadModels.AddRangeAsync(oldBooking, recentBooking, futureBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(TimeRange: TimeRange.Last30Days);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.Id == recentBooking.Id);
        result.Should().Contain(b => b.Id == futureBooking.Id);
        result.Should().NotContain(b => b.Id == oldBooking.Id);
    }

    [Fact]
    public async Task Handle_WithTimeRangeLastYear_ShouldReturnBookingsFromLastYear()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var veryOldBooking = CreateBookingReadModel(today.AddYears(-2), today.AddYears(-2).AddDays(2));
        var lastYearBooking = CreateBookingReadModel(today.AddDays(-200), today.AddDays(-198));
        var recentBooking = CreateBookingReadModel(today.AddDays(-20), today.AddDays(-18));

        await _context.BookingReadModels.AddRangeAsync(veryOldBooking, lastYearBooking, recentBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(TimeRange: TimeRange.LastYear);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.Id == lastYearBooking.Id);
        result.Should().Contain(b => b.Id == recentBooking.Id);
        result.Should().NotContain(b => b.Id == veryOldBooking.Id);
    }

    [Fact]
    public async Task Handle_WithNoTimeRange_ShouldDefaultToFuture()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var pastBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3));
        var futureBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3));

        await _context.BookingReadModels.AddRangeAsync(pastBooking, futureBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(); // No TimeRange specified

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(b => b.Id == futureBooking.Id);
        result.Should().NotContain(b => b.Id == pastBooking.Id);
    }

    [Fact]
    public async Task Handle_WithTimeRangeAndUserId_ShouldApplyBothFilters()
    {
        // Arrange
        var today = DateTime.UtcNow.Date;
        var user1PastBooking = CreateBookingReadModel(today.AddDays(-5), today.AddDays(-3), userId: 1);
        var user1FutureBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3), userId: 1);
        var user2FutureBooking = CreateBookingReadModel(today.AddDays(1), today.AddDays(3), userId: 2);

        await _context.BookingReadModels.AddRangeAsync(user1PastBooking, user1FutureBooking, user2FutureBooking);
        await _context.SaveChangesAsync();

        var query = new GetBookingsQuery(UserId: 1, TimeRange: TimeRange.Future);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result.Should().Contain(b => b.Id == user1FutureBooking.Id);
        result.Should().NotContain(b => b.Id == user1PastBooking.Id);
        result.Should().NotContain(b => b.Id == user2FutureBooking.Id);
    }

    private BookingReadModel CreateBookingReadModel(DateTime startDate, DateTime endDate, int userId = 1)
    {
        return new BookingReadModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserName = _fixture.Create<string>(),
            UserEmail = _fixture.Create<string>(),
            StartDate = startDate,
            EndDate = endDate,
            Status = BookingStatus.Pending,
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