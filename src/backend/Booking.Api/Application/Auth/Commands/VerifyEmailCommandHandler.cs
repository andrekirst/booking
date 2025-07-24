using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Application.Auth.Commands;

public class VerifyEmailCommandHandler(BookingDbContext context) : ICommandHandler<VerifyEmailCommand, VerifyEmailResult>
{
    public async Task<VerifyEmailResult> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == request.Token 
                                   && u.EmailVerificationTokenExpiry > DateTime.UtcNow
                                   && !u.EmailVerified, 
                                   cancellationToken);
        
        if (user == null)
        {
            return new VerifyEmailResult(false, "Ungültiger oder abgelaufener Verifizierungstoken.");
        }
        
        // Verify email
        user.EmailVerified = true;
        user.EmailVerifiedAt = DateTime.UtcNow;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;
        user.ChangedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync(cancellationToken);
        
        return new VerifyEmailResult(
            true, 
            "E-Mail-Adresse erfolgreich verifiziert. Ihr Konto wartet auf Administrator-Freigabe für Buchungen.",
            RequiresApproval: true
        );
    }
}