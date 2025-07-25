using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Data;
using Booking.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Application.Auth.Commands;

public class LoginCommandHandler : ICommandHandler<LoginCommand, LoginResponse>
{
    private readonly BookingDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(
        BookingDbContext context,
        IPasswordService passwordService,
        IJwtService jwtService)
    {
        _context = context;
        _passwordService = passwordService;
        _jwtService = jwtService;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Find user by email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive, cancellationToken);

            if (user == null)
            {
                return new LoginResponse(false, null, "Ungültige E-Mail-Adresse oder Passwort.");
            }

            // Verify password
            if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
            {
                return new LoginResponse(false, null, "Ungültige E-Mail-Adresse oder Passwort.");
            }

            // Check if email is verified
            if (!user.EmailVerified)
            {
                return new LoginResponse(false, null, "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Überprüfen Sie Ihr E-Mail-Postfach oder fordern Sie eine neue Bestätigungs-E-Mail an.");
            }

            // Check if user is approved for booking by administrator
            if (!user.IsApprovedForBooking)
            {
                return new LoginResponse(false, null, "Ihr Konto wartet noch auf die Freigabe durch einen Administrator. Sie werden per E-Mail benachrichtigt, sobald Ihr Konto freigeschaltet wurde.");
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            // Generate JWT token
            var token = _jwtService.GenerateToken(user);

            return new LoginResponse(true, token, null);
        }
        catch (Exception)
        {
            // Log the exception here in a real application
            return new LoginResponse(false, null, "An error occurred during login");
        }
    }
}