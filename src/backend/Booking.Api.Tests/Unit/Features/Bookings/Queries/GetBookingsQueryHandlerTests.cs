using AutoFixture;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Booking.Api.Data;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Tests.Unit.Features.Bookings.Queries;

public sealed class GetBookingsQueryHandlerTests : IDisposable
{
    private readonly BookingDbContext context;
    private readonly ILogger<GetBookingsQueryHandler> logger;
    private readonly GetBookingsQueryHandler handler;
    private readonly Fixture fixture;

    public GetBookingsQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        context = new BookingDbContext(options);
        logger = Substitute.For<ILogger<GetBookingsQueryHandler>>();
        handler = new GetBookingsQueryHandler(context, logger);
        fixture = new Fixture();
    }

    public void Dispose()
    {
        context.Dispose();
    }

    [Fact]
    public async Task Handle_ShouldReturnBookingsSortedByStartDateDescending()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var olderBooking = CreateBookingReadModel(userId, startDate: new DateTime(2024, 1, 15));
        var newerBooking = CreateBookingReadModel(userId, startDate: new DateTime(2024, 3, 20));
        var newestBooking = CreateBookingReadModel(userId, startDate: new DateTime(2024, 4, 10));

        context.BookingReadModels.AddRange(olderBooking, newerBooking, newestBooking);
        await context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            UserId: userId,
            StartDate: null,
            EndDate: null,
            PageNumber: 1,
            PageSize: 10
        );

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(3);
        result[0].StartDate.Should().Be(newestBooking.StartDate);
        result[1].StartDate.Should().Be(newerBooking.StartDate);
        result[2].StartDate.Should().Be(olderBooking.StartDate);
    }

    [Fact]
    public async Task Handle_ShouldFilterByUserId_WhenUserIdProvided()
    {
        // Arrange
        var targetUserId = fixture.Create<int>();
        var otherUserId = fixture.Create<int>();

        var targetUserBooking = CreateBookingReadModel(targetUserId, startDate: new DateTime(2024, 2, 15));
        var otherUserBooking = CreateBookingReadModel(otherUserId, startDate: new DateTime(2024, 2, 20));

        context.BookingReadModels.AddRange(targetUserBooking, otherUserBooking);
        await context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            UserId: targetUserId,
            StartDate: null,
            EndDate: null,
            PageNumber: 1,
            PageSize: 10
        );

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].UserId.Should().Be(targetUserId);
        result[0].Id.Should().Be(targetUserBooking.Id);
    }

    [Fact]
    public async Task Handle_ShouldReturnAllBookings_WhenUserIdIsNull()
    {
        // Arrange
        var user1Id = fixture.Create<int>();
        var user2Id = fixture.Create<int>();

        var user1Booking = CreateBookingReadModel(user1Id, startDate: new DateTime(2024, 2, 15));
        var user2Booking = CreateBookingReadModel(user2Id, startDate: new DateTime(2024, 2, 20));

        context.BookingReadModels.AddRange(user1Booking, user2Booking);
        await context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            UserId: null, // Admin query - should see all bookings
            StartDate: null,
            EndDate: null,
            PageNumber: 1,
            PageSize: 10
        );

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.UserId == user1Id);
        result.Should().Contain(b => b.UserId == user2Id);
    }

    [Fact]
    public async Task Handle_ShouldFilterByStartDate_WhenStartDateProvided()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var filterDate = new DateTime(2024, 3, 1);

        var beforeFilterBooking = CreateBookingReadModel(userId, 
            startDate: new DateTime(2024, 2, 15), 
            endDate: new DateTime(2024, 2, 20)); // Ends before filter

        var overlapFilterBooking = CreateBookingReadModel(userId,
            startDate: new DateTime(2024, 2, 25),
            endDate: new DateTime(2024, 3, 5)); // Ends after filter

        var afterFilterBooking = CreateBookingReadModel(userId,
            startDate: new DateTime(2024, 3, 10),
            endDate: new DateTime(2024, 3, 15)); // Starts after filter

        context.BookingReadModels.AddRange(beforeFilterBooking, overlapFilterBooking, afterFilterBooking);
        await context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            UserId: userId,
            StartDate: filterDate,
            EndDate: null,
            PageNumber: 1,
            PageSize: 10
        );

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().NotContain(b => b.Id == beforeFilterBooking.Id);
        result.Should().Contain(b => b.Id == overlapFilterBooking.Id);
        result.Should().Contain(b => b.Id == afterFilterBooking.Id);
    }

    [Fact]
    public async Task Handle_ShouldFilterByEndDate_WhenEndDateProvided()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var filterDate = new DateTime(2024, 3, 1);

        var beforeFilterBooking = CreateBookingReadModel(userId,
            startDate: new DateTime(2024, 2, 15),
            endDate: new DateTime(2024, 2, 20)); // Starts and ends before filter

        var overlapFilterBooking = CreateBookingReadModel(userId,
            startDate: new DateTime(2024, 2, 25),
            endDate: new DateTime(2024, 3, 5)); // Starts before filter

        var afterFilterBooking = CreateBookingReadModel(userId,
            startDate: new DateTime(2024, 3, 10),
            endDate: new DateTime(2024, 3, 15)); // Starts after filter

        context.BookingReadModels.AddRange(beforeFilterBooking, overlapFilterBooking, afterFilterBooking);
        await context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            UserId: userId,
            StartDate: null,
            EndDate: filterDate,
            PageNumber: 1,
            PageSize: 10
        );

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.Id == beforeFilterBooking.Id);
        result.Should().Contain(b => b.Id == overlapFilterBooking.Id);
        result.Should().NotContain(b => b.Id == afterFilterBooking.Id);
    }

    [Fact]
    public async Task Handle_ShouldSupportPagination()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var bookings = new List<BookingReadModel>();

        for (int i = 1; i <= 5; i++)
        {
            bookings.Add(CreateBookingReadModel(userId, startDate: new DateTime(2024, 1, i)));
        }

        context.BookingReadModels.AddRange(bookings);
        await context.SaveChangesAsync();

        var query = new GetBookingsQuery(
            UserId: userId,
            StartDate: null,
            EndDate: null,
            PageNumber: 2,
            PageSize: 2
        );

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        // Should be sorted by StartDate descending, so page 2 (items 3-4) should be Jan 3 and Jan 2
        result[0].StartDate.Should().Be(new DateTime(2024, 1, 3));
        result[1].StartDate.Should().Be(new DateTime(2024, 1, 2));
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoBookingsFound()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var query = new GetBookingsQuery(
            UserId: userId,
            StartDate: null,
            EndDate: null,
            PageNumber: 1,
            PageSize: 10
        );

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ShouldMaintainSortOrderAcrossPages()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var bookings = new List<BookingReadModel>();

        // Create bookings with random order but predictable dates
        var dates = new[]
        {
            new DateTime(2024, 5, 1), // Newest
            new DateTime(2024, 4, 1),
            new DateTime(2024, 3, 1),
            new DateTime(2024, 2, 1),
            new DateTime(2024, 1, 1)  // Oldest
        };

        foreach (var date in dates.Reverse()) // Add in reverse order to test sorting
        {
            bookings.Add(CreateBookingReadModel(userId, startDate: date));
        }

        context.BookingReadModels.AddRange(bookings);
        await context.SaveChangesAsync();

        var page1Query = new GetBookingsQuery(userId, null, null, 1, 2);
        var page2Query = new GetBookingsQuery(userId, null, null, 2, 2);
        var page3Query = new GetBookingsQuery(userId, null, null, 3, 2);

        // Act
        var page1 = await handler.Handle(page1Query, CancellationToken.None);
        var page2 = await handler.Handle(page2Query, CancellationToken.None);
        var page3 = await handler.Handle(page3Query, CancellationToken.None);

        // Assert
        page1.Should().HaveCount(2);
        page1[0].StartDate.Should().Be(new DateTime(2024, 5, 1)); // Newest first
        page1[1].StartDate.Should().Be(new DateTime(2024, 4, 1));

        page2.Should().HaveCount(2);
        page2[0].StartDate.Should().Be(new DateTime(2024, 3, 1));
        page2[1].StartDate.Should().Be(new DateTime(2024, 2, 1));

        page3.Should().HaveCount(1);
        page3[0].StartDate.Should().Be(new DateTime(2024, 1, 1)); // Oldest last
    }

    private BookingReadModel CreateBookingReadModel(int userId, DateTime startDate, DateTime? endDate = null)
    {
        var actualEndDate = endDate ?? startDate.AddDays(2);
        return new BookingReadModel
        {
            Id = fixture.Create<Guid>(),
            UserId = userId,
            StartDate = startDate,
            EndDate = actualEndDate,
            Status = fixture.Create<BookingStatus>(),
            Notes = fixture.Create<string>(),
            CreatedAt = fixture.Create<DateTime>(),
            ChangedAt = fixture.Create<DateTime?>(),
            LastEventVersion = fixture.Create<int>(),
            BookingItemsJson = "[]",
            UserName = fixture.Create<string>(),
            UserEmail = fixture.Create<string>(),
            TotalPersons = fixture.Create<int>()
        };
    }
}