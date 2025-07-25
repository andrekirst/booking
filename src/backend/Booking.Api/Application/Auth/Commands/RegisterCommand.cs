using Booking.Api.Application.Common.Interfaces;

namespace Booking.Api.Application.Auth.Commands;

public record RegisterCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName
) : ICommand<RegisterResult>;

public record RegisterResult(
    bool Success,
    string Message,
    int? UserId = null
);