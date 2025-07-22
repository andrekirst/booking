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
    public async Task Handle_ShouldReturnBookingsSortedByStartDateAscending()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var olderBooking = CreateBookingReadModel(userId, startDate: new DateTime(2024, 1, 15));
        var newerBooking = CreateBookingReadModel(userId, startDate: new DateTime(2024, 3, 20));
        var newestBooking = CreateBookingReadModel(userId, startDate: new DateTime(2024, 4, 10));

        context.BookingReadModels.AddRange(olderBooking, newerBooking, newestBooking);
        await context.SaveChangesAsync();

        var query = new GetBookingsQuery(UserId: userId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(3);
        result[0].StartDate.Should().Be(olderBooking.StartDate);
        result[1].StartDate.Should().Be(newerBooking.StartDate);
        result[2].StartDate.Should().Be(newestBooking.StartDate);
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

        var query = new GetBookingsQuery(UserId: targetUserId);

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

        var query = new GetBookingsQuery(UserId: null); // Admin query - should see all bookings

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(b => b.UserId == user1Id);
        result.Should().Contain(b => b.UserId == user2Id);
    }


    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoBookingsFound()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var query = new GetBookingsQuery(UserId: userId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
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