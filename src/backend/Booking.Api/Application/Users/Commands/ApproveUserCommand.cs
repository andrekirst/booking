using Booking.Api.Application.Common.Interfaces;

namespace Booking.Api.Application.Users.Commands;

public record ApproveUserCommand(int UserId, int ApprovedByUserId) : ICommand<ApproveUserResult>;

public record ApproveUserResult(
    bool Success,
    string Message
);