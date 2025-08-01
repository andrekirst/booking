using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Services.EventSourcing;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.Common;
using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;
using FluentAssertions;

namespace Booking.Api.Tests.Unit.Features.Bookings.Queries;

public class GetBookingHistoryQueryHandlerTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly IEventStore _eventStore;
    private readonly GetBookingHistoryQueryHandler _handler;
    private readonly Guid _bookingId = Guid.NewGuid();

    public GetBookingHistoryQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BookingDbContext(options);
        _eventStore = Substitute.For<IEventStore>();
        _handler = new GetBookingHistoryQueryHandler(_eventStore, _context);

        // Setup test data
        SetupTestData();
    }

    private void SetupTestData()
    {
        _context.Users.Add(new User
        {
            Id = 1,
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            Role = Domain.Enums.UserRole.Member,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            EmailVerified = true,
            PasswordHash = "hash"
        });

        _context.SaveChanges();
    }

    [Fact]
    public async Task Handle_WithNoEvents_ShouldReturnEmptyList()
    {
        // Arrange
        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(new List<(DomainEvent Event, int Version)>());

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WithBookingCreatedEvent_ShouldReturnActivity()
    {
        // Arrange
        var createdEvent = new BookingCreatedEvent
        {
            BookingId = _bookingId,
            UserId = 1,
            StartDate = DateTime.Parse("2025-02-01"),
            EndDate = DateTime.Parse("2025-02-03"),
            Notes = "Test notes",
            BookingItems = new List<Domain.ValueObjects.BookingItem>
            {
                new(Guid.NewGuid(), 2)
            }
        };

        var events = new List<(DomainEvent Event, int Version)>
        {
            (createdEvent, 1)
        };

        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(events);

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].ActivityType.Should().Be("BookingCreated");
        result[0].Description.Should().Be("Buchung wurde erstellt");
        result[0].UserName.Should().Be("Test User");
        result[0].Metadata.Should().NotBeNull();
        result[0].Metadata!["TotalPersons"].Should().Be(2);
        result[0].Metadata["AccommodationCount"].Should().Be(1);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}