using Booking.Api.Application.Common.Interfaces;

namespace Booking.Api.Application.Users.Commands;

public record RejectUserCommand(int UserId, int RejectedByUserId, string? Reason = null) : ICommand<RejectUserResult>;

public record RejectUserResult(bool Success, string Message);