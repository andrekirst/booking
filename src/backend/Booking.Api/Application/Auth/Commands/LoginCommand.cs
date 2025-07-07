using Booking.Api.Application.Common.Interfaces;

namespace Booking.Api.Application.Auth.Commands;

public record LoginCommand(string Email, string Password) : ICommand<LoginResponse>;

public record LoginResponse(bool Success, string? Token, string? ErrorMessage);