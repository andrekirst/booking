using Booking.Api.Application.Common.Interfaces;

namespace Booking.Api.Application.Auth.Commands;

public record VerifyEmailCommand(string Token) : ICommand<VerifyEmailResult>;

public record VerifyEmailResult(
    bool Success,
    string Message,
    bool RequiresApproval = false
);