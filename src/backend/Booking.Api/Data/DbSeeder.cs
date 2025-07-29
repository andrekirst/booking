using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ReadModels;
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

        var adminRegistrationDate = DateTime.UtcNow;
        var oneWeekAgo = DateTime.UtcNow.AddDays(-7);
        var twoWeeksAgo = DateTime.UtcNow.AddDays(-14);
        var oneMonthAgo = DateTime.UtcNow.AddDays(-30);
        var twoMonthsAgo = DateTime.UtcNow.AddDays(-60);
        
        var users = new[]
        {
            // ========== ADMINISTRATOR ==========
            new User
            {
                Email = "admin@booking.com",
                PasswordHash = passwordService.HashPassword("admin123"),
                FirstName = "Admin",
                LastName = "User",
                Role = UserRole.Administrator,
                IsActive = true,
                // Email verification - admin account is pre-verified
                EmailVerified = true,
                EmailVerifiedAt = adminRegistrationDate,
                RegistrationDate = adminRegistrationDate,
                // Booking approval - admin account is automatically approved
                IsApprovedForBooking = true,
                ApprovedForBookingAt = adminRegistrationDate,
                // Admin approves themselves for seeding purposes
                ApprovedById = null // Will be set after user is created
            },

            // ========== FULLY APPROVED & VERIFIED MEMBERS (Ready to book) ==========
            
            // Family Member 1: Senior family member, fully approved and active
            new User
            {
                Email = "maria.mueller@familie-mueller.de",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Maria",
                LastName = "Müller",
                Role = UserRole.Member,
                IsActive = true,
                // Email verified 2 months ago
                EmailVerified = true,
                EmailVerifiedAt = twoMonthsAgo.AddHours(2),
                RegistrationDate = twoMonthsAgo,
                // Approved for booking 1 month ago
                IsApprovedForBooking = true,
                ApprovedForBookingAt = oneMonthAgo,
                ApprovedById = null, // Will be set to admin after creation
                LastLoginAt = DateTime.UtcNow.AddDays(-2) // Recently active
            },
            
            // Family Member 2: Adult family member, recently approved
            new User
            {
                Email = "thomas.schmidt@gmail.com",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Thomas",
                LastName = "Schmidt",
                Role = UserRole.Member,
                IsActive = true,
                // Email verified 2 weeks ago
                EmailVerified = true,
                EmailVerifiedAt = twoWeeksAgo.AddHours(6),
                RegistrationDate = twoWeeksAgo,
                // Recently approved for booking
                IsApprovedForBooking = true,
                ApprovedForBookingAt = oneWeekAgo,
                ApprovedById = null, // Will be set to admin after creation
                LastLoginAt = DateTime.UtcNow.AddHours(-12) // Very recently active
            },
            
            // Family Member 3: Young adult, established member
            new User
            {
                Email = "anna.weber@web.de",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Anna",
                LastName = "Weber",
                Role = UserRole.Member,
                IsActive = true,
                // Email verified 1 month ago
                EmailVerified = true,
                EmailVerifiedAt = oneMonthAgo.AddDays(3),
                RegistrationDate = oneMonthAgo.AddDays(3),
                // Approved shortly after verification
                IsApprovedForBooking = true,
                ApprovedForBookingAt = oneMonthAgo.AddDays(5),
                ApprovedById = null, // Will be set to admin after creation
                LastLoginAt = DateTime.UtcNow.AddDays(-1)
            },

            // ========== PENDING APPROVAL MEMBERS (Email verified, waiting for admin) ==========
            
            // Family Member 4: Recently registered, email verified but awaiting approval
            new User
            {
                Email = "lisa.hoffmann@hotmail.de",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Lisa",
                LastName = "Hoffmann",
                Role = UserRole.Member,
                IsActive = true,
                // Email verified 3 days ago
                EmailVerified = true,
                EmailVerifiedAt = DateTime.UtcNow.AddDays(-3).AddHours(4),
                RegistrationDate = DateTime.UtcNow.AddDays(-3),
                // NOT approved for booking yet - pending admin approval
                IsApprovedForBooking = false,
                ApprovedForBookingAt = null,
                ApprovedById = null,
                LastLoginAt = DateTime.UtcNow.AddHours(-8) // Checking back regularly
            },
            
            // Family Member 5: Older registration, verified but still pending approval
            new User
            {
                Email = "michael.bauer@t-online.de",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Michael",
                LastName = "Bauer",
                Role = UserRole.Member,
                IsActive = true,
                // Email verified 1 week ago
                EmailVerified = true,
                EmailVerifiedAt = oneWeekAgo.AddDays(1),
                RegistrationDate = oneWeekAgo.AddDays(1),
                // NOT approved for booking - shows admin needs to process approvals
                IsApprovedForBooking = false,
                ApprovedForBookingAt = null,
                ApprovedById = null,
                LastLoginAt = DateTime.UtcNow.AddDays(-1).AddHours(6)
            },

            // ========== UNVERIFIED EMAIL MEMBERS (Registered but haven't verified email) ==========
            
            // Family Member 6: Very recent registration, email not verified yet
            new User
            {
                Email = "sarah.koch@gmail.com",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Sarah",
                LastName = "Koch",
                Role = UserRole.Member,
                IsActive = true,
                // Email NOT verified - recently registered
                EmailVerified = false,
                EmailVerificationToken = Guid.NewGuid().ToString(),
                EmailVerificationTokenExpiry = DateTime.UtcNow.AddDays(7), // 7 days to verify
                EmailVerifiedAt = null,
                RegistrationDate = DateTime.UtcNow.AddDays(-1),
                // Cannot be approved for booking without email verification
                IsApprovedForBooking = false,
                ApprovedForBookingAt = null,
                ApprovedById = null,
                LastLoginAt = DateTime.UtcNow.AddHours(-18)
            },
            
            // Family Member 7: Older registration with expired verification token
            new User
            {
                Email = "peter.zimmermann@yahoo.de",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Peter",
                LastName = "Zimmermann",
                Role = UserRole.Member,
                IsActive = true,
                // Email NOT verified - token expired (registered 2 weeks ago)
                EmailVerified = false,
                EmailVerificationToken = Guid.NewGuid().ToString(),
                EmailVerificationTokenExpiry = DateTime.UtcNow.AddDays(-7), // Expired token
                EmailVerifiedAt = null,
                RegistrationDate = twoWeeksAgo,
                // Cannot be approved without email verification
                IsApprovedForBooking = false,
                ApprovedForBookingAt = null,
                ApprovedById = null,
                LastLoginAt = DateTime.UtcNow.AddDays(-5) // Hasn't logged in recently
            },

            // ========== BLOCKED/INACTIVE MEMBER (Edge case testing) ==========
            
            // Family Member 8: Blocked/inactive member for testing edge cases
            new User
            {
                Email = "blocked.user@example.de",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Gesperrt",
                LastName = "Benutzer",
                Role = UserRole.Member,
                IsActive = false, // BLOCKED/INACTIVE
                // Was previously verified and approved but now blocked
                EmailVerified = true,
                EmailVerifiedAt = twoMonthsAgo.AddDays(5),
                RegistrationDate = twoMonthsAgo.AddDays(5),
                IsApprovedForBooking = false, // Approval revoked when blocked
                ApprovedForBookingAt = null,
                ApprovedById = null,
                LastLoginAt = DateTime.UtcNow.AddDays(-30) // Long time since last login
            },

            // ========== ADDITIONAL DIVERSE SCENARIOS ==========
            
            // Family Member 9: Teen/young family member (recently approved)
            new User
            {
                Email = "julia.klein@student.de",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Julia",
                LastName = "Klein",
                Role = UserRole.Member,
                IsActive = true,
                // Recently verified and approved
                EmailVerified = true,
                EmailVerifiedAt = DateTime.UtcNow.AddDays(-5),
                RegistrationDate = DateTime.UtcNow.AddDays(-5),
                IsApprovedForBooking = true,
                ApprovedForBookingAt = DateTime.UtcNow.AddDays(-2),
                ApprovedById = null, // Will be set to admin after creation
                LastLoginAt = DateTime.UtcNow.AddHours(-3) // Very active
            },
            
            // Family Member 10: Another verified but pending approval case
            new User
            {
                Email = "robert.fischer@gmx.de",
                PasswordHash = passwordService.HashPassword("member123"),
                FirstName = "Robert",
                LastName = "Fischer",
                Role = UserRole.Member,
                IsActive = true,
                // Verified but awaiting approval
                EmailVerified = true,
                EmailVerifiedAt = DateTime.UtcNow.AddDays(-6).AddHours(8),
                RegistrationDate = DateTime.UtcNow.AddDays(-6),
                IsApprovedForBooking = false, // Pending approval
                ApprovedForBookingAt = null,
                ApprovedById = null,
                LastLoginAt = DateTime.UtcNow.AddHours(-4)
            }
        };

        context.Users.AddRange(users);
        await context.SaveChangesAsync();
        
        // Set the admin user as their own approver for booking rights
        var adminUser = await context.Users.FirstAsync(u => u.Email == "admin@booking.com");
        adminUser.ApprovedById = adminUser.Id;
        
        // Set admin as the approver for all approved family members
        var approvedMembers = await context.Users
            .Where(u => u.IsApprovedForBooking && u.Role == UserRole.Member && u.ApprovedById == null)
            .ToListAsync();
            
        foreach (var member in approvedMembers)
        {
            member.ApprovedById = adminUser.Id;
        }
        
        await context.SaveChangesAsync();
        
        // ========== SLEEPING ACCOMMODATIONS SEEDING ==========
        await SeedSleepingAccommodationsAsync(context);
        
        // ========== BOOKING SCENARIOS SEEDING ==========
        await SeedBookingScenariosAsync(context);
    }

    private static async Task SeedSleepingAccommodationsAsync(BookingDbContext context)
    {
        // Check if sleeping accommodations already exist
        if (await context.SleepingAccommodations.AnyAsync())
        {
            return;
        }

        var baseTime = DateTime.UtcNow;
        var oneMonthAgo = baseTime.AddDays(-30);
        var twoWeeksAgo = baseTime.AddDays(-14);
        var oneWeekAgo = baseTime.AddDays(-7);

        var sleepingAccommodations = new[]
        {
            // ========== MAIN BEDROOM (Room type, 2-person capacity) ==========
            // Primary accommodation for couples or married family members
            new SleepingAccommodation
            {
                Name = "Hauptschlafzimmer",
                Type = AccommodationType.Room,
                MaxCapacity = 2,
                IsActive = true,
                CreatedAt = oneMonthAgo,
                ChangedAt = null
            },

            // ========== GUEST ROOM (Room type, 1-person capacity) ==========
            // Single room for individual family members or guests
            new SleepingAccommodation
            {
                Name = "Gästezimmer",
                Type = AccommodationType.Room,
                MaxCapacity = 1,
                IsActive = true,
                CreatedAt = oneMonthAgo.AddHours(2),
                ChangedAt = null
            },

            // ========== LIVING ROOM SOFA (Room type, 1-person capacity) ==========
            // Flexible accommodation option using the living room sofa bed
            new SleepingAccommodation
            {
                Name = "Wohnzimmer Schlafsofa",
                Type = AccommodationType.Room,
                MaxCapacity = 1,
                IsActive = true,
                CreatedAt = twoWeeksAgo,
                ChangedAt = null
            },

            // ========== GARDEN TENT/CAMPING AREA (Tent type, 4-person capacity) ==========
            // Large camping area for families or groups who prefer outdoor accommodation
            new SleepingAccommodation
            {
                Name = "Garten Zeltplatz",
                Type = AccommodationType.Tent,
                MaxCapacity = 4,
                IsActive = true,
                CreatedAt = twoWeeksAgo.AddDays(2),
                ChangedAt = null
            },

            // ========== CHILDREN'S ROOM (Room type, 2-person capacity) ==========
            // Room designed for children or young family members with bunk beds
            new SleepingAccommodation
            {
                Name = "Kinderzimmer",
                Type = AccommodationType.Room,
                MaxCapacity = 2,
                IsActive = true,
                CreatedAt = oneWeekAgo,
                ChangedAt = null
            }
        };

        context.SleepingAccommodations.AddRange(sleepingAccommodations);
        await context.SaveChangesAsync();
    }

    private static async Task SeedBookingScenariosAsync(BookingDbContext context)
    {
        // Check if bookings already exist
        if (await context.BookingReadModels.AnyAsync())
        {
            return;
        }

        // Get reference data needed for booking scenarios
        var users = await context.Users.Where(u => u.IsActive).ToListAsync();
        var accommodations = await context.SleepingAccommodations.Where(a => a.IsActive).ToListAsync();

        if (!users.Any() || !accommodations.Any())
        {
            return; // Cannot seed bookings without users and accommodations
        }

        // Get specific users for realistic scenario assignment
        var adminUser = users.FirstOrDefault(u => u.Role == UserRole.Administrator);
        var approvedMembers = users.Where(u => u.IsApprovedForBooking && u.Role == UserRole.Member).ToList();
        var pendingMembers = users.Where(u => !u.IsApprovedForBooking && u.Role == UserRole.Member).ToList();

        // Get specific accommodations
        var hauptschlafzimmer = accommodations.FirstOrDefault(a => a.Name == "Hauptschlafzimmer");
        var gaestezimmer = accommodations.FirstOrDefault(a => a.Name == "Gästezimmer");
        var wohnzimmerSofa = accommodations.FirstOrDefault(a => a.Name == "Wohnzimmer Schlafsofa");
        var gartenZelt = accommodations.FirstOrDefault(a => a.Name == "Garten Zeltplatz");
        var kinderzimmer = accommodations.FirstOrDefault(a => a.Name == "Kinderzimmer");

        // Time references for realistic booking scenarios
        var now = DateTime.UtcNow;
        var baseTime = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc); // Start of today

        // ========== COMPREHENSIVE BOOKING SCENARIOS ==========
        var bookings = new List<BookingReadModel>();

        // ========== PAST BOOKINGS (5 scenarios) ==========
        
        // Past Booking 1: Completed family weekend (2 months ago)
        if (hauptschlafzimmer != null && approvedMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(-60); // 2 months ago
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[0],
                startDate,
                startDate.AddDays(2),
                BookingStatus.Completed,
                "Wunderschönes Wochenende mit der Familie verbracht",
                new[] { new { AccommodationId = hauptschlafzimmer.Id, PersonCount = 2 } },
                baseTime.AddDays(-62)
            ));
        }

        // Past Booking 2: Cancelled camping trip (1.5 months ago)
        if (gartenZelt != null && approvedMembers.Count >= 2)
        {
            var startDate = baseTime.AddDays(-45);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[1 % approvedMembers.Count],
                startDate,
                startDate.AddDays(3),
                BookingStatus.Cancelled,
                "Wetterbedingt storniert - Regenwetter",
                new[] { new { AccommodationId = gartenZelt.Id, PersonCount = 3 } },
                baseTime.AddDays(-50)
            ));
        }

        // Past Booking 3: Completed single stay (1 month ago)
        if (gaestezimmer != null && approvedMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(-30);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[0],
                startDate,
                startDate.AddDays(1),
                BookingStatus.Completed,
                "Entspannter Kurzbesuch",
                new[] { new { AccommodationId = gaestezimmer.Id, PersonCount = 1 } },
                baseTime.AddDays(-35)
            ));
        }

        // Past Booking 4: Completed children's visit (3 weeks ago)
        if (kinderzimmer != null && approvedMembers.Count >= 2)
        {
            var startDate = baseTime.AddDays(-21);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[1 % approvedMembers.Count],
                startDate,
                startDate.AddDays(2),
                BookingStatus.Completed,
                "Kinder hatten viel Spaß im Kinderzimmer",
                new[] { new { AccommodationId = kinderzimmer.Id, PersonCount = 2 } },
                baseTime.AddDays(-25)
            ));
        }

        // Past Booking 5: Cancelled sofa booking (2 weeks ago)
        if (wohnzimmerSofa != null && approvedMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(-14);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[2 % approvedMembers.Count],
                startDate,
                startDate.AddDays(1),
                BookingStatus.Cancelled,
                "Kurzfristig abgesagt wegen Krankheit",
                new[] { new { AccommodationId = wohnzimmerSofa.Id, PersonCount = 1 } },
                baseTime.AddDays(-16)
            ));
        }

        // ========== CURRENT/RECENT BOOKINGS (4 scenarios) ==========

        // Current Booking 1: Active booking this week (confirmed)
        if (hauptschlafzimmer != null && approvedMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(-2); // Started 2 days ago
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[0],
                startDate,
                startDate.AddDays(4), // Ends in 2 days
                BookingStatus.Confirmed,
                "Aktuelle Buchung - Familie im Haus",
                new[] { new { AccommodationId = hauptschlafzimmer.Id, PersonCount = 2 } },
                baseTime.AddDays(-10)
            ));
        }

        // Current Booking 2: Recently confirmed booking
        if (gaestezimmer != null && approvedMembers.Count >= 2)
        {
            var startDate = baseTime.AddDays(1); // Tomorrow
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[1 % approvedMembers.Count],
                startDate,
                startDate.AddDays(2),
                BookingStatus.Confirmed,
                "Kurzfristiger Besuch - gerade bestätigt",
                new[] { new { AccommodationId = gaestezimmer.Id, PersonCount = 1 } },
                baseTime.AddHours(-6)
            ));
        }

        // Current Booking 3: Pending approval booking
        if (kinderzimmer != null && pendingMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(3);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                pendingMembers[0],
                startDate,
                startDate.AddDays(2),
                BookingStatus.Pending,
                "Familienbesuch mit Kindern geplant",
                new[] { new { AccommodationId = kinderzimmer.Id, PersonCount = 2 } },
                baseTime.AddHours(-12)
            ));
        }

        // Current Booking 4: Conflicting booking scenario (overlapping dates)
        if (hauptschlafzimmer != null && approvedMembers.Count >= 2)
        {
            var startDate = baseTime.AddDays(2); // Overlaps with booking ending tomorrow
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[2 % approvedMembers.Count],
                startDate,
                startDate.AddDays(2),
                BookingStatus.Pending,
                "Eventuell Konflikt mit anderer Buchung",
                new[] { new { AccommodationId = hauptschlafzimmer.Id, PersonCount = 2 } },
                baseTime.AddHours(-4)
            ));
        }

        // ========== FUTURE BOOKINGS (6+ scenarios) ==========

        // Future Booking 1: Confirmed summer vacation (next month)
        if (gartenZelt != null && approvedMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(30);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[0],
                startDate,
                startDate.AddDays(7), // Week-long camping
                BookingStatus.Confirmed,
                "Sommerferien Camping mit der ganzen Familie",
                new[] { new { AccommodationId = gartenZelt.Id, PersonCount = 4 } },
                baseTime.AddDays(-5)
            ));
        }

        // Future Booking 2: Pending weekend booking
        if (hauptschlafzimmer != null && approvedMembers.Count >= 2)
        {
            var startDate = baseTime.AddDays(14); // Next weekend
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[1 % approvedMembers.Count],
                startDate,
                startDate.AddDays(2),
                BookingStatus.Pending,
                "Wochenendbesuch - warten auf Bestätigung",
                new[] { new { AccommodationId = hauptschlafzimmer.Id, PersonCount = 2 } },
                baseTime.AddDays(-1)
            ));
        }

        // Future Booking 3: Accepted longer stay
        if (gaestezimmer != null && approvedMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(45);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[2 % approvedMembers.Count],
                startDate,
                startDate.AddDays(5),
                BookingStatus.Accepted,
                "Längerer Besuch - bereits akzeptiert",
                new[] { new { AccommodationId = gaestezimmer.Id, PersonCount = 1 } },
                baseTime.AddDays(-3)
            ));
        }

        // Future Booking 4: Rejected booking (overbooking scenario)
        if (hauptschlafzimmer != null && approvedMembers.Count >= 2)
        {
            var startDate = baseTime.AddDays(31); // Same weekend as confirmed camping
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[1 % approvedMembers.Count],
                startDate,
                startDate.AddDays(2),
                BookingStatus.Rejected,
                "Leider abgelehnt - bereits ausgebucht",
                new[] { new { AccommodationId = hauptschlafzimmer.Id, PersonCount = 2 } },
                baseTime.AddDays(-4)
            ));
        }

        // Future Booking 5: Multi-accommodation booking (family gathering)
        if (hauptschlafzimmer != null && kinderzimmer != null && approvedMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(60);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[0],
                startDate,
                startDate.AddDays(3),
                BookingStatus.Confirmed,
                "Großes Familientreffen - mehrere Zimmer",
                new[] { 
                    new { AccommodationId = hauptschlafzimmer.Id, PersonCount = 2 },
                    new { AccommodationId = kinderzimmer.Id, PersonCount = 2 }
                },
                baseTime.AddDays(-7)
            ));
        }

        // Future Booking 6: Same-day booking edge case
        if (wohnzimmerSofa != null && approvedMembers.Count >= 1)
        {
            var startDate = baseTime.AddDays(7);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[2 % approvedMembers.Count],
                startDate,
                startDate, // Same day booking
                BookingStatus.Pending,
                "Kurzfristige Anfrage - nur eine Nacht",
                new[] { new { AccommodationId = wohnzimmerSofa.Id, PersonCount = 1 } },
                baseTime.AddHours(-2)
            ));
        }

        // Future Booking 7: Holiday season booking
        if (gartenZelt != null && approvedMembers.Count >= 2)
        {
            var startDate = baseTime.AddDays(90); // 3 months ahead
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                approvedMembers[1 % approvedMembers.Count],
                startDate,
                startDate.AddDays(4),
                BookingStatus.Confirmed,
                "Herbstferien Zelten - lange im Voraus geplant",
                new[] { new { AccommodationId = gartenZelt.Id, PersonCount = 3 } },
                baseTime.AddDays(-15)
            ));
        }

        // Future Booking 8: Admin booking (edge case)
        if (adminUser != null && gaestezimmer != null)
        {
            var startDate = baseTime.AddDays(21);
            bookings.Add(CreateBookingScenario(
                Guid.NewGuid(),
                adminUser,
                startDate,
                startDate.AddDays(1),
                BookingStatus.Confirmed,
                "Administrative Überprüfung der Unterkunft",
                new[] { new { AccommodationId = gaestezimmer.Id, PersonCount = 1 } },
                baseTime.AddDays(-2)
            ));
        }

        // Add all bookings to context
        if (bookings.Any())
        {
            context.BookingReadModels.AddRange(bookings);
            await context.SaveChangesAsync();
        }
    }

    private static BookingReadModel CreateBookingScenario(
        Guid bookingId,
        User user,
        DateTime startDate,
        DateTime endDate,
        BookingStatus status,
        string notes,
        IEnumerable<dynamic> accommodationItems,
        DateTime createdAt)
    {
        // Convert accommodation items to BookingItem format for JSON serialization
        var bookingItems = accommodationItems.Select(item => new
        {
            SleepingAccommodationId = item.AccommodationId,
            PersonCount = item.PersonCount
        }).ToList();

        var totalPersons = bookingItems.Sum(bi => bi.PersonCount);

        return new BookingReadModel
        {
            Id = bookingId,
            UserId = user.Id,
            StartDate = startDate,
            EndDate = endDate,
            Status = status,
            Notes = notes,
            CreatedAt = createdAt,
            ChangedAt = status != BookingStatus.Pending ? createdAt.AddMinutes(30) : null,
            LastEventVersion = 1,
            BookingItemsJson = System.Text.Json.JsonSerializer.Serialize(bookingItems),
            UserName = $"{user.FirstName} {user.LastName}".Trim(),
            UserEmail = user.Email,
            TotalPersons = totalPersons
        };
    }
}