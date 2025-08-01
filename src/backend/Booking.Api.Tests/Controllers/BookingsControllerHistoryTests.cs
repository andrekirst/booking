using Booking.Api.Controllers;
using Booking.Api.Domain.Enums;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Features.Bookings.Queries;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using System.Security.Claims;
using Xunit;

namespace Booking.Api.Tests.Controllers;

public class BookingsControllerHistoryTests
{
    private readonly IMediator _mediator;
    private readonly BookingsController _controller;

    public BookingsControllerHistoryTests()
    {
        _mediator = Substitute.For<IMediator>();
        _controller = new BookingsController(_mediator);
    }

    [Fact]
    public async Task GetBookingHistory_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        var bookingDto = new BookingDto(
            Id: bookingId,
            UserId: userId,
            UserName: "Test User",
            UserEmail: "test@example.com",
            StartDate: DateTime.UtcNow.AddDays(1),
            EndDate: DateTime.UtcNow.AddDays(3),
            Status: BookingStatus.Pending,
            Notes: null,
            BookingItems: new List<BookingItemDto>(),
            TotalPersons: 2,
            NumberOfNights: 2,
            CreatedAt: DateTime.UtcNow,
            ChangedAt: null
        );
        var historyDto = new BookingHistoryDto { BookingId = bookingId };

        SetupControllerContext(userId.ToString(), false);

        _mediator.Send(Arg.Any<GetBookingByIdQuery>())
            .Returns(bookingDto);
        _mediator.Send(Arg.Any<GetBookingHistoryQuery>())
            .Returns(historyDto);

        // Act
        var result = await _controller.GetBookingHistory(bookingId);

        // Assert
        var okResult = Assert.IsType<ActionResult<BookingHistoryDto>>(result);
        var okObjectResult = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedHistory = Assert.IsType<BookingHistoryDto>(okObjectResult.Value);
        Assert.Equal(bookingId, returnedHistory.BookingId);
    }

    [Fact]
    public async Task GetBookingHistory_BookingNotFound_ReturnsNotFound()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;

        SetupControllerContext(userId.ToString(), false);

        _mediator.Send(Arg.Any<GetBookingByIdQuery>())
            .Returns((BookingDto?)null);

        // Act
        var result = await _controller.GetBookingHistory(bookingId);

        // Assert
        var actionResult = Assert.IsType<ActionResult<BookingHistoryDto>>(result);
        Assert.IsType<NotFoundResult>(actionResult.Result);
    }

    [Fact]
    public async Task GetBookingHistory_UserNotOwner_ReturnsForbid()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        var otherUserId = 2;
        var bookingDto = new BookingDto(
            Id: bookingId,
            UserId: otherUserId,
            UserName: "Other User",
            UserEmail: "other@example.com",
            StartDate: DateTime.UtcNow.AddDays(1),
            EndDate: DateTime.UtcNow.AddDays(3),
            Status: BookingStatus.Pending,
            Notes: null,
            BookingItems: new List<BookingItemDto>(),
            TotalPersons: 2,
            NumberOfNights: 2,
            CreatedAt: DateTime.UtcNow,
            ChangedAt: null
        );

        SetupControllerContext(userId.ToString(), false);

        _mediator.Send(Arg.Any<GetBookingByIdQuery>())
            .Returns(bookingDto);

        // Act
        var result = await _controller.GetBookingHistory(bookingId);

        // Assert
        var actionResult = Assert.IsType<ActionResult<BookingHistoryDto>>(result);
        Assert.IsType<ForbidResult>(actionResult.Result);
    }

    [Fact]
    public async Task GetBookingHistory_AdminUser_CanAccessAnyBooking()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        var otherUserId = 2;
        var bookingDto = new BookingDto(
            Id: bookingId,
            UserId: otherUserId,
            UserName: "Other User",
            UserEmail: "other@example.com",
            StartDate: DateTime.UtcNow.AddDays(1),
            EndDate: DateTime.UtcNow.AddDays(3),
            Status: BookingStatus.Pending,
            Notes: null,
            BookingItems: new List<BookingItemDto>(),
            TotalPersons: 2,
            NumberOfNights: 2,
            CreatedAt: DateTime.UtcNow,
            ChangedAt: null
        );
        var historyDto = new BookingHistoryDto { BookingId = bookingId };

        SetupControllerContext(userId.ToString(), true);

        _mediator.Send(Arg.Any<GetBookingByIdQuery>())
            .Returns(bookingDto);
        _mediator.Send(Arg.Any<GetBookingHistoryQuery>())
            .Returns(historyDto);

        // Act
        var result = await _controller.GetBookingHistory(bookingId);

        // Assert
        var okResult = Assert.IsType<ActionResult<BookingHistoryDto>>(result);
        var okObjectResult = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedHistory = Assert.IsType<BookingHistoryDto>(okObjectResult.Value);
        Assert.Equal(bookingId, returnedHistory.BookingId);
    }

    [Theory]
    [InlineData(0, 20)] // Page 0 is invalid
    [InlineData(-1, 20)] // Negative page is invalid
    public async Task GetBookingHistory_InvalidPage_ReturnsBadRequest(int page, int pageSize)
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        // Act
        var result = await _controller.GetBookingHistory(bookingId, page, pageSize);

        // Assert
        var actionResult = Assert.IsType<ActionResult<BookingHistoryDto>>(result);
        Assert.IsType<BadRequestObjectResult>(actionResult.Result);
    }

    [Theory]
    [InlineData(1, 0)] // PageSize 0 is invalid
    [InlineData(1, -1)] // Negative pageSize is invalid
    [InlineData(1, 101)] // PageSize over 100 is invalid
    public async Task GetBookingHistory_InvalidPageSize_ReturnsBadRequest(int page, int pageSize)
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        // Act
        var result = await _controller.GetBookingHistory(bookingId, page, pageSize);

        // Assert
        var actionResult = Assert.IsType<ActionResult<BookingHistoryDto>>(result);
        Assert.IsType<BadRequestObjectResult>(actionResult.Result);
    }

    [Fact]
    public async Task GetBookingHistory_WithCustomPagination_PassesCorrectParameters()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        var page = 2;
        var pageSize = 10;
        var bookingDto = new BookingDto(
            Id: bookingId,
            UserId: userId,
            UserName: "Test User",
            UserEmail: "test@example.com",
            StartDate: DateTime.UtcNow.AddDays(1),
            EndDate: DateTime.UtcNow.AddDays(3),
            Status: BookingStatus.Pending,
            Notes: null,
            BookingItems: new List<BookingItemDto>(),
            TotalPersons: 2,
            NumberOfNights: 2,
            CreatedAt: DateTime.UtcNow,
            ChangedAt: null
        );
        var historyDto = new BookingHistoryDto { BookingId = bookingId };

        SetupControllerContext(userId.ToString(), false);

        _mediator.Send(Arg.Any<GetBookingByIdQuery>())
            .Returns(bookingDto);
        _mediator.Send(Arg.Any<GetBookingHistoryQuery>())
            .Returns(historyDto);

        // Act
        var result = await _controller.GetBookingHistory(bookingId, page, pageSize);

        // Assert
        await _mediator.Received(1).Send(Arg.Is<GetBookingHistoryQuery>(q => 
            q.BookingId == bookingId && 
            q.Page == page && 
            q.PageSize == pageSize));
    }

    [Fact]
    public async Task GetBookingHistory_KeyNotFoundException_ReturnsNotFound()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        var bookingDto = new BookingDto(
            Id: bookingId,
            UserId: userId,
            UserName: "Test User",
            UserEmail: "test@example.com",
            StartDate: DateTime.UtcNow.AddDays(1),
            EndDate: DateTime.UtcNow.AddDays(3),
            Status: BookingStatus.Pending,
            Notes: null,
            BookingItems: new List<BookingItemDto>(),
            TotalPersons: 2,
            NumberOfNights: 2,
            CreatedAt: DateTime.UtcNow,
            ChangedAt: null
        );

        SetupControllerContext(userId.ToString(), false);

        _mediator.Send(Arg.Any<GetBookingByIdQuery>())
            .Returns(bookingDto);
        _mediator.When(x => x.Send(Arg.Any<GetBookingHistoryQuery>()))
            .Do(x => throw new KeyNotFoundException());

        // Act
        var result = await _controller.GetBookingHistory(bookingId);

        // Assert
        var actionResult = Assert.IsType<ActionResult<BookingHistoryDto>>(result);
        Assert.IsType<NotFoundResult>(actionResult.Result);
    }

    [Fact]
    public async Task GetBookingHistory_UnexpectedException_ReturnsInternalServerError()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var userId = 1;
        var bookingDto = new BookingDto(
            Id: bookingId,
            UserId: userId,
            UserName: "Test User",
            UserEmail: "test@example.com",
            StartDate: DateTime.UtcNow.AddDays(1),
            EndDate: DateTime.UtcNow.AddDays(3),
            Status: BookingStatus.Pending,
            Notes: null,
            BookingItems: new List<BookingItemDto>(),
            TotalPersons: 2,
            NumberOfNights: 2,
            CreatedAt: DateTime.UtcNow,
            ChangedAt: null
        );

        SetupControllerContext(userId.ToString(), false);

        _mediator.Send(Arg.Any<GetBookingByIdQuery>())
            .Returns(bookingDto);
        _mediator.When(x => x.Send(Arg.Any<GetBookingHistoryQuery>()))
            .Do(x => throw new InvalidOperationException("Database error"));

        // Act
        var result = await _controller.GetBookingHistory(bookingId);

        // Assert
        var actionResult = Assert.IsType<ActionResult<BookingHistoryDto>>(result);
        var statusCodeResult = Assert.IsType<ObjectResult>(actionResult.Result);
        Assert.Equal(500, statusCodeResult.StatusCode);
    }

    private void SetupControllerContext(string userId, bool isAdmin)
    {
        var claims = new List<Claim>
        {
            new("user_id", userId)
        };

        if (isAdmin)
        {
            claims.Add(new(ClaimTypes.Role, "Administrator"));
        }

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };
    }
}