using Booking.Api.Domain.Entities;

namespace Booking.Api.Services;

public interface IJwtService
{
    string GenerateToken(User user);
    bool ValidateToken(string token);
}