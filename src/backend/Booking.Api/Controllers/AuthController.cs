using Booking.Api.Application.Auth.Commands;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Controllers;

public class AuthController : BaseApiController
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginSuccessResponse>> Login([FromBody] LoginRequest request)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var response = await Mediator.Send(command);

        if (!response.Success)
        {
            return BadRequest(new ErrorResponse(response.ErrorMessage ?? "Invalid credentials"));
        }

        return Ok(new LoginSuccessResponse(response.Token!, "Login successful"));
    }
}

public record LoginRequest(string Email, string Password);
public record LoginSuccessResponse(string Token, string Message);
public record ErrorResponse(string Message);