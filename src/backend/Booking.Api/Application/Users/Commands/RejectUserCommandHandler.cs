using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Application.Users.Commands;

public class RejectUserCommandHandler(BookingDbContext context) : ICommandHandler<RejectUserCommand, RejectUserResult>
{
    public async Task<RejectUserResult> Handle(RejectUserCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.EmailVerified && !u.IsApprovedForBooking, 
                                 cancellationToken);

        if (user == null)
        {
            return new RejectUserResult(false, "Benutzer nicht gefunden oder bereits verarbeitet.");
        }

        var rejectedBy = await context.Users
            .FirstOrDefaultAsync(u => u.Id == request.RejectedByUserId, cancellationToken);

        if (rejectedBy == null)
        {
            return new RejectUserResult(false, "Administrator nicht gefunden.");
        }

        // Mark user as inactive to prevent login attempts
        user.IsActive = false;
        user.ChangedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        // TODO: Send rejection email with reason if provided

        return new RejectUserResult(
            true, 
            $"Benutzer {user.FirstName} {user.LastName} wurde abgelehnt."
        );
    }
}