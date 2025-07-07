using Booking.Api.Application.Auth.Commands;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Controllers;

public class AuthController : BaseApiController
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var command = new LoginCommand(request.Email, request.Password);
        var response = await Mediator.Send(command);

        if (!response.Success)
        {
            return BadRequest(new { message = response.ErrorMessage });
        }

        return Ok(new 
        { 
            token = response.Token,
            message = "Login successful"
        });
    }
}

public record LoginRequest(string Email, string Password);