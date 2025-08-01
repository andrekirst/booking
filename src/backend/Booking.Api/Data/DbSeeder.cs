using Booking.Api.Domain.Entities;
using Booking.Api.Services;
using Booking.Api.Features.Bookings.Commands;
using Booking.Api.Features.Bookings.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(BookingDbContext context, IPasswordService passwordService, IMediator mediator)
    {
        // Clear existing data in development to ensure clean seeding with Events
        await ClearExistingDataAsync(context);
        
        await SeedUsersAsync(context, passwordService);
        await SeedSleepingAccommodationsAsync(context);
        await SeedBookingsAsync(context, mediator);
    }

    private static async Task ClearExistingDataAsync(BookingDbContext context)
    {
        // Only clear in development to get fresh data with proper Events
        try
        {
            // Clear in dependency order
            await context.Database.ExecuteSqlRawAsync("DELETE FROM \"BookingReadModels\"");
            await context.Database.ExecuteSqlRawAsync("DELETE FROM \"EventStoreEvents\"");
            await context.Database.ExecuteSqlRawAsync("DELETE FROM \"EventStoreSnapshots\"");
            await context.Database.ExecuteSqlRawAsync("DELETE FROM \"SleepingAccommodationReadModels\"");
            await context.Database.ExecuteSqlRawAsync("DELETE FROM \"Users\"");
            
            Console.WriteLine("✅ Existing data cleared for fresh seeding with Events");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Could not clear existing data: {ex.Message}");
        }
    }

    private static async Task SeedUsersAsync(BookingDbContext context, IPasswordService passwordService)
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
                IsActive = true,
                EmailVerified = true,
                IsApprovedForBooking = true
            },
            new User
            {
                Email = "member@booking.com",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Familie",
                LastName = "Mitglied",
                Role = UserRole.Member,
                IsActive = true,
                EmailVerified = true,
                IsApprovedForBooking = true
            },
            new User
            {
                Email = "test@example.com",
                PasswordHash = passwordService.HashPassword("test123"),
                FirstName = "Test",
                LastName = "User",
                Role = UserRole.Member,
                IsActive = true,
                EmailVerified = true,
                IsApprovedForBooking = true
            }
        };

        context.Users.AddRange(users);
        await context.SaveChangesAsync();
    }

    private static async Task SeedSleepingAccommodationsAsync(BookingDbContext context)
    {
        // Check if sleeping accommodations already exist
        if (await context.SleepingAccommodationReadModels.AnyAsync())
        {
            return;
        }

        var accommodations = new[]
        {
            new Domain.ReadModels.SleepingAccommodationReadModel
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000001"),
                Name = "Großes Schlafzimmer",
                Type = Domain.Enums.AccommodationType.Room,
                MaxCapacity = 4,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Domain.ReadModels.SleepingAccommodationReadModel
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000002"),
                Name = "Kleines Schlafzimmer",
                Type = Domain.Enums.AccommodationType.Room,
                MaxCapacity = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Domain.ReadModels.SleepingAccommodationReadModel
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000003"),
                Name = "Gartenzelt",
                Type = Domain.Enums.AccommodationType.Tent,
                MaxCapacity = 3,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        context.SleepingAccommodationReadModels.AddRange(accommodations);
        await context.SaveChangesAsync();
    }

    private static async Task SeedBookingsAsync(BookingDbContext context, IMediator mediator)
    {
        // Check if bookings already exist
        if (await context.BookingReadModels.AnyAsync())
        {
            return;
        }

        var users = await context.Users.ToListAsync();
        var accommodations = await context.SleepingAccommodationReadModels.ToListAsync();

        if (!users.Any() || !accommodations.Any())
        {
            return;
        }

        var memberUser = users.First(u => u.Email == "member@booking.com");
        var testUser = users.First(u => u.Email == "test@example.com");

        // Sample bookings with different statuses
        var sampleBookings = new[]
        {
            new CreateBookingDto
            {
                StartDate = DateTime.UtcNow.AddDays(30),
                EndDate = DateTime.UtcNow.AddDays(33),
                Notes = "Familienwochenende im Garten",
                BookingItems = new List<CreateBookingItemDto>
                {
                    new() { SleepingAccommodationId = accommodations[0].Id, PersonCount = 2 },
                    new() { SleepingAccommodationId = accommodations[2].Id, PersonCount = 1 }
                }
            },
            new CreateBookingDto
            {
                StartDate = DateTime.UtcNow.AddDays(45),
                EndDate = DateTime.UtcNow.AddDays(47),
                Notes = "Kurzurlaub mit den Kindern",
                BookingItems = new List<CreateBookingItemDto>
                {
                    new() { SleepingAccommodationId = accommodations[1].Id, PersonCount = 2 }
                }
            },
            new CreateBookingDto
            {
                StartDate = DateTime.UtcNow.AddDays(60),
                EndDate = DateTime.UtcNow.AddDays(62),
                Notes = "Entspannung im Grünen",
                BookingItems = new List<CreateBookingItemDto>
                {
                    new() { SleepingAccommodationId = accommodations[0].Id, PersonCount = 1 }
                }
            }
        };

        try
        {
            // Create bookings using Commands (generates Events!)
            var booking1 = await mediator.Send(new CreateBookingCommand(memberUser.Id, sampleBookings[0]));
            var booking2 = await mediator.Send(new CreateBookingCommand(testUser.Id, sampleBookings[1]));
            var booking3 = await mediator.Send(new CreateBookingCommand(memberUser.Id, sampleBookings[2]));

            // Accept some bookings to create more history
            await mediator.Send(new AcceptBookingCommand(booking1.Id));
            await mediator.Send(new AcceptBookingCommand(booking3.Id));

            // Confirm one booking
            await mediator.Send(new ConfirmBookingCommand(booking1.Id));
        }
        catch (Exception ex)
        {
            // Log error but don't fail startup
            Console.WriteLine($"Warning: Could not seed bookings: {ex.Message}");
        }
    }
}