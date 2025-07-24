using Booking.Api.Application.Common.Interfaces;

namespace Booking.Api.Application.Users.Queries;

public record GetPendingUsersQuery : IQuery<IEnumerable<PendingUserDto>>;

public record PendingUserDto(
    int Id,
    string Email,
    string FirstName,
    string LastName,
    DateTime RegistrationDate,
    DateTime? EmailVerifiedAt,
    bool EmailVerified
);