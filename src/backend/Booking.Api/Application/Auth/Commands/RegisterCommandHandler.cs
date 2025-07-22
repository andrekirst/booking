using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Booking.Api.Application.Auth.Commands;

public class RegisterCommandHandler(
    BookingDbContext context,
    IPasswordService passwordService) : ICommandHandler<RegisterCommand, RegisterResult>
{
    public async Task<RegisterResult> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Check if user already exists
        var existingUser = await context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
            
        if (existingUser != null)
        {
            return new RegisterResult(false, "E-Mail-Adresse ist bereits registriert.");
        }
        
        // Create verification token
        var verificationToken = GenerateSecureToken();
        var tokenExpiry = DateTime.UtcNow.AddHours(24);
        
        // Create new user
        var user = new User
        {
            Email = request.Email,
            PasswordHash = passwordService.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = UserRole.Member,
            IsActive = true,
            EmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiry = tokenExpiry,
            RegistrationDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        
        context.Users.Add(user);
        await context.SaveChangesAsync(cancellationToken);
        
        return new RegisterResult(
            true, 
            "Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mails zur Verifizierung.",
            user.Id
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