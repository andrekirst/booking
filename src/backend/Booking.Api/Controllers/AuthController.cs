using Booking.Api.Application.Auth.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Controllers;

public class AuthController : BaseApiController
{
    [HttpPost("login")]
    [AllowAnonymous]
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

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request)
    {
        var command = new RegisterCommand(request.Email, request.Password, request.FirstName, request.LastName);
        var result = await Mediator.Send(command);

        if (!result.Success)
        {
            return BadRequest(new ErrorResponse(result.Message));
        }

        return Ok(new RegisterResponse(result.Message, result.UserId));
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<ActionResult<VerifyEmailResponse>> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        var command = new VerifyEmailCommand(request.Token);
        var result = await Mediator.Send(command);

        if (!result.Success)
        {
            return BadRequest(new ErrorResponse(result.Message));
        }

        return Ok(new VerifyEmailResponse(result.Message, result.RequiresApproval));
    }

    [HttpPost("resend-verification")]
    [AllowAnonymous]
    public async Task<ActionResult<ResendVerificationResponse>> ResendVerification([FromBody] ResendVerificationRequest request)
    {
        var command = new ResendVerificationCommand(request.Email);
        var result = await Mediator.Send(command);

        if (!result.Success)
        {
            return BadRequest(new ErrorResponse(result.Message));
        }

        return Ok(new ResendVerificationResponse(result.Message));
    }
}

public record LoginRequest(string Email, string Password);
public record LoginSuccessResponse(string Token, string Message);
public record RegisterRequest(string Email, string Password, string FirstName, string LastName);
public record RegisterResponse(string Message, int? UserId);
public record VerifyEmailRequest(string Token);
public record VerifyEmailResponse(string Message, bool RequiresApproval);
public record ResendVerificationRequest(string Email);
public record ResendVerificationResponse(string Message);
public record ErrorResponse(string Message);