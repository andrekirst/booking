using Booking.Api.Application.Common.Interfaces;

namespace Booking.Api.Application.Auth.Commands;

public record ResendVerificationCommand(string Email) : ICommand<ResendVerificationResult>;

public record ResendVerificationResult(
    bool Success,
    string Message
);