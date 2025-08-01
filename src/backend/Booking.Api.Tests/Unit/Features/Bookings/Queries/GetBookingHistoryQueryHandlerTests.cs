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

        _context.Users.Add(new User
        {
            Id = 2,
            Email = "admin@example.com",
            FirstName = "Admin",
            LastName = "User",
            Role = Domain.Enums.UserRole.Administrator,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            EmailVerified = true,
            PasswordHash = "hash"
        });

        _context.SaveChanges();
    }

    [Fact]
    public async Task Handle_WithBookingEvents_ShouldReturnActivitiesInDescendingOrder()
    {
        // Arrange
        var events = new List<(DomainEvent Event, int Version)>
        {
            (new BookingCreatedEvent(
                _bookingId,
                1,
                DateTime.Parse("2025-02-01"),
                DateTime.Parse("2025-02-03"),
                "Test notes",
                new List<Domain.ValueObjects.BookingItem>
                {
                    new(Guid.NewGuid(), 2)
                }
            ) { OccurredOn = DateTime.Parse("2025-01-01T10:00:00Z") }, 1),
            
            (new BookingAcceptedEvent(_bookingId) 
            { OccurredOn = DateTime.Parse("2025-01-01T11:00:00Z") }, 2)
        };

        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(events);

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(2);
        
        // Should be ordered by timestamp descending (newest first)
        result[0].ActivityType.Should().Be("BookingAccepted");
        result[0].Description.Should().Be("Buchung wurde angenommen");
        result[0].Timestamp.Should().Be(DateTime.Parse("2025-01-01T11:00:00Z"));
        result[0].UserName.Should().Be("Administrator");
        result[0].Metadata.Should().BeNull();

        result[1].ActivityType.Should().Be("BookingCreated");
        result[1].Description.Should().Be("Buchung wurde erstellt");
        result[1].Timestamp.Should().Be(DateTime.Parse("2025-01-01T10:00:00Z"));
        result[1].UserName.Should().Be("Test User");
        result[1].Metadata.Should().NotBeNull();
        result[1].Metadata!["TotalPersons"].Should().Be(2);
        result[1].Metadata["AccommodationCount"].Should().Be(1);
    }

    [Fact]
    public async Task Handle_WithBookingUpdatedEvent_ShouldIncludeUpdateActivity()
    {
        // Arrange
        var events = new List<(DomainEvent Event, int Version)>
        {
            (new BookingUpdatedEvent(
                _bookingId,
                1,
                DateTime.Parse("2025-02-01"),
                DateTime.Parse("2025-02-04"), // Changed end date
                "Updated notes",
                new List<Domain.ValueObjects.BookingItem>
                {
                    new(Guid.NewGuid(), 3) // Changed person count
                }
            ) { OccurredOn = DateTime.Parse("2025-01-01T12:00:00Z") }, 2)
        };

        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(events);

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].ActivityType.Should().Be("BookingUpdated");
        result[0].Description.Should().Be("Buchung wurde geändert");
        result[0].UserName.Should().Be("Test User");
        result[0].Metadata.Should().NotBeNull();
        result[0].Metadata!["TotalPersons"].Should().Be(3);
        result[0].Metadata["AccommodationCount"].Should().Be(1);
    }

    [Fact]
    public async Task Handle_WithBookingRejectedEvent_ShouldIncludeRejectedActivity()
    {
        // Arrange
        var events = new List<(DomainEvent Event, int Version)>
        {
            (new BookingRejectedEvent(_bookingId) 
            { OccurredOn = DateTime.Parse("2025-01-01T11:00:00Z") }, 2)
        };

        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(events);

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].ActivityType.Should().Be("BookingRejected");
        result[0].Description.Should().Be("Buchung wurde abgelehnt");
        result[0].UserName.Should().Be("Administrator");
        result[0].Metadata.Should().BeNull();
    }

    [Fact]
    public async Task Handle_WithBookingConfirmedEvent_ShouldIncludeConfirmedActivity()
    {
        // Arrange
        var events = new List<(DomainEvent Event, int Version)>
        {
            (new BookingConfirmedEvent(_bookingId) 
            { OccurredOn = DateTime.Parse("2025-01-01T11:00:00Z") }, 2)
        };

        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(events);

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].ActivityType.Should().Be("BookingConfirmed");
        result[0].Description.Should().Be("Buchung wurde bestätigt");
        result[0].UserName.Should().Be("Administrator");
    }

    [Fact]
    public async Task Handle_WithBookingCancelledEvent_ShouldIncludeCancelledActivity()
    {
        // Arrange
        var events = new List<(DomainEvent Event, int Version)>
        {
            (new BookingCancelledEvent(_bookingId) 
            { OccurredOn = DateTime.Parse("2025-01-01T11:00:00Z") }, 2)
        };

        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(events);

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].ActivityType.Should().Be("BookingCancelled");
        result[0].Description.Should().Be("Buchung wurde storniert");
        result[0].UserName.Should().Be("System");
    }

    [Fact]
    public async Task Handle_WithUnknownUser_ShouldReturnUnknownUserName()
    {
        // Arrange
        var events = new List<(DomainEvent Event, int Version)>
        {
            (new BookingCreatedEvent(
                _bookingId,
                999, // Non-existent user ID
                DateTime.Parse("2025-02-01"),
                DateTime.Parse("2025-02-03"),
                "Test notes",
                new List<Domain.ValueObjects.BookingItem>
                {
                    new(Guid.NewGuid(), 2)
                }
            ) { OccurredOn = DateTime.Parse("2025-01-01T10:00:00Z") }, 1)
        };

        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(events);

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1);
        result[0].UserName.Should().Be("Unbekannter Benutzer");
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
    public async Task Handle_WithMixedEvents_ShouldOnlyIncludeBookingEvents()
    {
        // Arrange - Mix booking events with other event types that should be ignored
        var events = new List<(DomainEvent Event, int Version)>
        {
            (new BookingCreatedEvent(
                _bookingId,
                1,
                DateTime.Parse("2025-02-01"),
                DateTime.Parse("2025-02-03"),
                "Test notes",
                new List<Domain.ValueObjects.BookingItem>
                {
                    new(Guid.NewGuid(), 2)
                }
            ) { OccurredOn = DateTime.Parse("2025-01-01T10:00:00Z") }, 1),
            
            // This would be a different type of event that shouldn't be included
            (new TestUnknownEvent() { OccurredOn = DateTime.Parse("2025-01-01T09:00:00Z") }, 0)
        };

        _eventStore.GetEventsAsync(_bookingId, 0, Arg.Any<CancellationToken>())
            .Returns(events);

        var query = new GetBookingHistoryQuery(_bookingId);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().HaveCount(1); // Only the BookingCreatedEvent should be included
        result[0].ActivityType.Should().Be("BookingCreated");
    }

    // Helper class for testing unknown event types
    private class TestUnknownEvent : DomainEvent
    {
        public TestUnknownEvent() : base(Guid.NewGuid()) { }
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}