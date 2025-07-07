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
                return new LoginResponse(false, null, "Invalid email or password");
            }

            // Verify password
            if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
            {
                return new LoginResponse(false, null, "Invalid email or password");
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            // Generate JWT token
            var token = _jwtService.GenerateToken(user);

            return new LoginResponse(true, token, null);
        }
        catch (Exception ex)
        {
            // Log the exception here in a real application
            return new LoginResponse(false, null, "An error occurred during login");
        }
    }
}