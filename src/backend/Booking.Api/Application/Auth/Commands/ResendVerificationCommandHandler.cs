using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Data;
using Booking.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Booking.Api.Application.Auth.Commands;

public class ResendVerificationCommandHandler(BookingDbContext context, IEmailService emailService) : ICommandHandler<ResendVerificationCommand, ResendVerificationResult>
{
    public async Task<ResendVerificationResult> Handle(ResendVerificationCommand request, CancellationToken cancellationToken)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        
        if (user == null)
        {
            return new ResendVerificationResult(false, "Benutzer nicht gefunden.");
        }
        
        if (user.EmailVerified)
        {
            return new ResendVerificationResult(false, "E-Mail-Adresse ist bereits verifiziert.");
        }
        
        // Generate new verification token
        var verificationToken = GenerateSecureToken();
        var tokenExpiry = DateTime.UtcNow.AddHours(24);
        
        user.EmailVerificationToken = verificationToken;
        user.EmailVerificationTokenExpiry = tokenExpiry;
        user.ChangedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync(cancellationToken);
        
        // Send new verification email
        await emailService.SendEmailVerificationAsync(user.Email, user.FirstName, verificationToken);
        
        return new ResendVerificationResult(
            true, 
            "Neuer Verifizierungslink wurde an Ihre E-Mail-Adresse gesendet."
        );
    }
    
    private static string GenerateSecureToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var tokenBytes = new byte[32];
        rng.GetBytes(tokenBytes);
        return Convert.ToBase64String(tokenBytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}