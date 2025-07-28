using Booking.Api.Controllers;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using System.Security.Claims;
using FluentAssertions;

namespace Booking.Api.Tests.Controllers;

public class BookingsControllerStatusFilterTests
{
    private readonly IMediator _mediator;
    private readonly BookingsController _controller;

    public BookingsControllerStatusFilterTests()
    {
        _mediator = Substitute.For<IMediator>();
        _controller = new BookingsController(_mediator);

        // Setup controller context with authenticated user
        var claims = new List<Claim>
        {
            new("user_id", "1"),
            new(ClaimTypes.Role, "Member")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
    }

    [Fact]
    public async Task GetBookings_WithoutStatusParameter_CallsQueryWithNullStatus()
    {
        // Arrange
        var expectedBookings = new List<BookingDto>();
        _mediator.Send(Arg.Any<GetBookingsQuery>()).Returns(expectedBookings);

        // Act
        var result = await _controller.GetBookings();

        // Assert
        await _mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => 
            q.UserId == 1 && q.Status == null));
        
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(expectedBookings);
    }

    [Fact]
    public async Task GetBookings_WithPendingStatus_CallsQueryWithPendingStatus()
    {
        // Arrange
        var expectedBookings = new List<BookingDto>();
        _mediator.Send(Arg.Any<GetBookingsQuery>()).Returns(expectedBookings);

        // Act
        var result = await _controller.GetBookings(null, BookingStatus.Pending);

        // Assert
        await _mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => 
            q.UserId == 1 && q.Status == BookingStatus.Pending));
        
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(expectedBookings);
    }

    [Fact]
    public async Task GetBookings_WithAcceptedStatus_CallsQueryWithAcceptedStatus()
    {
        // Arrange
        var expectedBookings = new List<BookingDto>();
        _mediator.Send(Arg.Any<GetBookingsQuery>()).Returns(expectedBookings);

        // Act
        var result = await _controller.GetBookings(null, BookingStatus.Accepted);

        // Assert
        await _mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => 
            q.UserId == 1 && q.Status == BookingStatus.Accepted));
        
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(expectedBookings);
    }

    [Fact]
    public async Task GetBookings_WithRejectedStatus_CallsQueryWithRejectedStatus()
    {
        // Arrange
        var expectedBookings = new List<BookingDto>();
        _mediator.Send(Arg.Any<GetBookingsQuery>()).Returns(expectedBookings);

        // Act
        var result = await _controller.GetBookings(null, BookingStatus.Rejected);

        // Assert
        await _mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => 
            q.UserId == 1 && q.Status == BookingStatus.Rejected));
        
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(expectedBookings);
    }

    [Fact]
    public async Task GetBookings_AsAdmin_CallsQueryWithNullUserId()
    {
        // Arrange - Setup admin user
        var adminClaims = new List<Claim>
        {
            new("user_id", "1"),
            new(ClaimTypes.Role, "Administrator")
        };
        var adminIdentity = new ClaimsIdentity(adminClaims, "TestAuthType");
        var adminPrincipal = new ClaimsPrincipal(adminIdentity);

        _controller.ControllerContext.HttpContext.User = adminPrincipal;

        var expectedBookings = new List<BookingDto>();
        _mediator.Send(Arg.Any<GetBookingsQuery>()).Returns(expectedBookings);

        // Act
        var result = await _controller.GetBookings(null, BookingStatus.Pending);

        // Assert - Admin should see all bookings (UserId = null)
        await _mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => 
            q.UserId == null && q.Status == BookingStatus.Pending));
        
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(expectedBookings);
    }

    [Theory]
    [InlineData(BookingStatus.Pending)]
    [InlineData(BookingStatus.Confirmed)]
    [InlineData(BookingStatus.Cancelled)]
    [InlineData(BookingStatus.Completed)]
    [InlineData(BookingStatus.Accepted)]
    [InlineData(BookingStatus.Rejected)]
    public async Task GetBookings_WithVariousStatuses_CallsQueryWithCorrectStatus(BookingStatus status)
    {
        // Arrange
        var expectedBookings = new List<BookingDto>();
        _mediator.Send(Arg.Any<GetBookingsQuery>()).Returns(expectedBookings);

        // Act
        var result = await _controller.GetBookings(null, status);

        // Assert
        await _mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => 
            q.UserId == 1 && q.Status == status));
        
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(expectedBookings);
    }
}