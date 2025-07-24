using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Application.Users.Queries;

public class GetPendingUsersQueryHandler(BookingDbContext context) : IQueryHandler<GetPendingUsersQuery, IEnumerable<PendingUserDto>>
{
    public async Task<IEnumerable<PendingUserDto>> Handle(GetPendingUsersQuery request, CancellationToken cancellationToken)
    {
        var pendingUsers = await context.Users
            .Where(u => u.EmailVerified && !u.IsApprovedForBooking)
            .OrderBy(u => u.RegistrationDate)
            .Select(u => new PendingUserDto(
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.RegistrationDate ?? DateTime.MinValue,
                u.EmailVerifiedAt,
                u.EmailVerified
            ))
            .ToListAsync(cancellationToken);

        return pendingUsers;
    }
}