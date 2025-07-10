using Booking.Api.Domain.Entities;
using Booking.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(BookingDbContext context, IPasswordService passwordService)
    {
        // Check if users already exist
        if (await context.Users.AnyAsync())
        {
            return;
        }

        var users = new[]
        {
            new User
            {
                Email = "admin@booking.com",
                PasswordHash = passwordService.HashPassword("admin123"),
                FirstName = "Admin",
                LastName = "User",
                Role = UserRole.Administrator,
                IsActive = true
            },
            new User
            {
                Email = "member@booking.com",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Familie",
                LastName = "Mitglied",
                Role = UserRole.Member,
                IsActive = true
            },
            new User
            {
                Email = "test@example.com",
                PasswordHash = passwordService.HashPassword("test123"),
                FirstName = "Test",
                LastName = "User",
                Role = UserRole.Member,
                IsActive = true
            }
        };

        context.Users.AddRange(users);
        await context.SaveChangesAsync();
    }
}