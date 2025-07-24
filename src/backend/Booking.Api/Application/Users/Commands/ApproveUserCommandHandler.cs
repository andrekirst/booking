using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Data;
using Booking.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Application.Users.Commands;

public class ApproveUserCommandHandler(
    BookingDbContext context, 
    IEmailService emailService) : ICommandHandler<ApproveUserCommand, ApproveUserResult>
{
    public async Task<ApproveUserResult> Handle(ApproveUserCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.EmailVerified && !u.IsApprovedForBooking, 
                                 cancellationToken);

        if (user == null)
        {
            return new ApproveUserResult(false, "Benutzer nicht gefunden oder bereits freigegeben.");
        }

        var approvedBy = await context.Users
            .FirstOrDefaultAsync(u => u.Id == request.ApprovedByUserId, cancellationToken);

        if (approvedBy == null)
        {
            return new ApproveUserResult(false, "Administrator nicht gefunden.");
        }

        // Approve user for bookings
        user.IsApprovedForBooking = true;
        user.ApprovedForBookingAt = DateTime.UtcNow;
        user.ApprovedById = request.ApprovedByUserId;
        user.ChangedAt = DateTime.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        // Send welcome email
        await emailService.SendWelcomeEmailAsync(user.Email, user.FirstName);

        return new ApproveUserResult(
            true, 
            $"Benutzer {user.FirstName} {user.LastName} wurde erfolgreich für Buchungen freigeschaltet."
        );
    }
}