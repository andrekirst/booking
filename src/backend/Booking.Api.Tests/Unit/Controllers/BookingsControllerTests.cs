using AutoFixture;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using System.Security.Claims;
using Booking.Api.Controllers;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Features.Bookings.Queries;

namespace Booking.Api.Tests.Unit.Controllers;

public sealed class BookingsControllerTests
{
    private readonly IMediator mediator;
    private readonly BookingsController controller;
    private readonly Fixture fixture;

    public BookingsControllerTests()
    {
        mediator = Substitute.For<IMediator>();
        controller = new BookingsController(mediator);
        fixture = new Fixture();
        
        // Setup HttpContext für User Claims
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task GetBookings_ShouldReturnFilteredBookingsForNormalUser()
    {
        // Arrange
        var userId = fixture.Create<int>();
        var userBookings = fixture.CreateMany<BookingDto>(3).ToList();
        
        SetupUserClaims(userId, isAdmin: false);
        
        mediator.Send(Arg.Is<GetBookingsQuery>(q => q.UserId == userId))
               .Returns(userBookings);

        // Act
        var result = await controller.GetBookings();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedBookings = okResult.Value.Should().BeOfType<List<BookingDto>>().Subject;
        returnedBookings.Should().HaveCount(3);
        
        // Verify that mediator was called with the correct user ID
        await mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => q.UserId == userId));
    }

    [Fact]
    public async Task GetBookings_ShouldReturnAllBookingsForAdminUser()
    {
        // Arrange
        var adminUserId = fixture.Create<int>();
        var allBookings = fixture.CreateMany<BookingDto>(5).ToList();
        
        SetupUserClaims(adminUserId, isAdmin: true);
        
        mediator.Send(Arg.Is<GetBookingsQuery>(q => q.UserId == null))
               .Returns(allBookings);

        // Act
        var result = await controller.GetBookings();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedBookings = okResult.Value.Should().BeOfType<List<BookingDto>>().Subject;
        returnedBookings.Should().HaveCount(5);
        
        // Verify that mediator was called with null UserId (admin query)
        await mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => q.UserId == null));
    }

    [Fact]
    public async Task GetBookings_ShouldThrowUnauthorizedAccessException_WhenUserIdClaimMissing()
    {
        // Arrange - Setup user without user_id claim
        SetupUserWithoutIdClaim();

        // Act & Assert
        var act = () => controller.GetBookings();
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage("Invalid user ID in token");
    }

    [Fact]
    public async Task GetBookings_ShouldThrowUnauthorizedAccessException_WhenUserIdClaimInvalid()
    {
        // Arrange - Setup user with invalid user_id claim
        SetupUserWithInvalidIdClaim();

        // Act & Assert
        var act = () => controller.GetBookings();
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage("Invalid user ID in token");
    }

    [Theory]
    [InlineData("user_id")]
    [InlineData("nameidentifier")]
    public async Task GetBookings_ShouldWorkWithDifferentUserIdClaims(string claimType)
    {
        // Arrange
        var userId = fixture.Create<int>();
        var userBookings = fixture.CreateMany<BookingDto>(2).ToList();
        
        SetupUserClaimsWithSpecificClaimType(userId, claimType, isAdmin: false);
        
        mediator.Send(Arg.Any<GetBookingsQuery>())
               .Returns(userBookings);

        // Act
        var result = await controller.GetBookings();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeOfType<List<BookingDto>>();
        
        await mediator.Received(1).Send(Arg.Is<GetBookingsQuery>(q => q.UserId == userId));
    }

    private void SetupUserClaims(int userId, bool isAdmin)
    {
        var claims = new List<Claim>
        {
            new("user_id", userId.ToString())
        };

        if (isAdmin)
        {
            claims.Add(new(ClaimTypes.Role, "Administrator"));
        }

        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);
        
        controller.ControllerContext.HttpContext.User = principal;
    }

    private void SetupUserWithoutIdClaim()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, "testuser")
        };

        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);
        
        controller.ControllerContext.HttpContext.User = principal;
    }

    private void SetupUserWithInvalidIdClaim()
    {
        var claims = new List<Claim>
        {
            new("user_id", "invalid_number")
        };

        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);
        
        controller.ControllerContext.HttpContext.User = principal;
    }

    private void SetupUserClaimsWithSpecificClaimType(int userId, string claimType, bool isAdmin)
    {
        var claims = new List<Claim>();

        // Map claim type to actual claim name
        var actualClaimType = claimType switch
        {
            "user_id" => "user_id",
            "nameidentifier" => ClaimTypes.NameIdentifier,
            _ => claimType
        };

        claims.Add(new(actualClaimType, userId.ToString()));

        if (isAdmin)
        {
            claims.Add(new(ClaimTypes.Role, "Administrator"));
        }

        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);
        
        controller.ControllerContext.HttpContext.User = principal;
    }
}