using Booking.Api.Application.Users.Commands;
using Booking.Api.Application.Users.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Booking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("users/pending")]
    public async Task<ActionResult<IEnumerable<PendingUserDto>>> GetPendingUsers()
    {
        var query = new GetPendingUsersQuery();
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("users/{userId:int}/approve")]
    public async Task<ActionResult<ApproveUserResponse>> ApproveUser(int userId)
    {
        // Get current user ID from JWT claims
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out var currentUserId))
        {
            return BadRequest(new ErrorResponse("Invalid user authentication."));
        }

        var command = new ApproveUserCommand(userId, currentUserId);
        var result = await _mediator.Send(command);

        if (!result.Success)
        {
            return BadRequest(new ErrorResponse(result.Message));
        }

        return Ok(new ApproveUserResponse(result.Message));
    }
}

public record ApproveUserResponse(string Message);
public record ErrorResponse(string Message);