using Booking.Api.Configuration;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Booking.Api.Data;

/// <summary>
/// Helper class for defining user properties during seeding (before creating User entity)
/// </summary>
internal class UserDefinition
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Member;
    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; } = false;
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public bool IsApprovedForBooking { get; set; } = false;
    public DateTime? ApprovedForBookingAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

/// <summary>
/// Helper class for defining accommodation properties during seeding
/// </summary>
internal class AccommodationDefinition
{
    public string Name { get; set; } = string.Empty;
    public AccommodationType Type { get; set; }
    public int MaxCapacity { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Helper class for defining booking properties during seeding
/// </summary>
internal class BookingDefinition
{
    public Guid BookingId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public BookingStatus Status { get; set; }
    public string Notes { get; set; } = string.Empty;
    public List<BookingAccommodationItem> AccommodationItems { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Helper class for booking accommodation items
/// </summary>
internal class BookingAccommodationItem
{
    public string AccommodationName { get; set; } = string.Empty;
    public int PersonCount { get; set; }
}

public static class DbSeeder
{
    /// <summary>
    /// Main seeding method with environment detection and configurable seeding behavior.
    /// </summary>
    /// <param name="context">Database context</param>
    /// <param name="passwordService">Password hashing service</param>
    /// <param name="environment">Web host environment for environment detection</param>
    /// <param name="seedingSettings">Seeding configuration settings</param>
    /// <param name="logger">Logger for seeding operations</param>
    public static async Task SeedAsync(
        BookingDbContext context, 
        IPasswordService passwordService, 
        IWebHostEnvironment environment, 
        SeedingSettings seedingSettings, 
        ILogger<object> logger)
    {
        // Early return if seeding is disabled
        if (!seedingSettings.EnableSeeding)
        {
            if (seedingSettings.EnableSeedingLogs)
            {
                logger.LogInformation("Database seeding is disabled in configuration. Skipping all seeding operations.");
            }
            return;
        }

        if (seedingSettings.EnableSeedingLogs)
        {
            logger.LogInformation("Starting database seeding process. Environment: {Environment}", environment.EnvironmentName);
        }

        // ALWAYS perform basic seeding (admin user) if enabled
        if (seedingSettings.EnableBasicSeeding)
        {
            await SeedBasicDataAsync(context, passwordService, logger, seedingSettings.EnableSeedingLogs);
        }
        else if (seedingSettings.EnableSeedingLogs)
        {
            logger.LogWarning("Basic seeding is disabled. Admin user may not be available.");
        }

        // Determine if comprehensive seeding should run
        var shouldRunComprehensiveSeeding = ShouldRunComprehensiveSeeding(environment, seedingSettings, logger);
        
        if (shouldRunComprehensiveSeeding)
        {
            await SeedComprehensiveTestDataAsync(context, passwordService, logger, seedingSettings.EnableSeedingLogs);
        }
        else if (seedingSettings.EnableSeedingLogs)
        {
            logger.LogInformation("Comprehensive test data seeding skipped. Environment: {Environment}, EnableComprehensiveSeeding: {EnableComprehensive}, ForceComprehensiveSeeding: {ForceComprehensive}", 
                environment.EnvironmentName, 
                seedingSettings.EnableComprehensiveSeeding, 
                seedingSettings.ForceComprehensiveSeeding);
        }

        if (seedingSettings.EnableSeedingLogs)
        {
            logger.LogInformation("Database seeding process completed.");
        }
    }

    /// <summary>
    /// Determines whether comprehensive seeding should run based on environment and configuration.
    /// </summary>
    private static bool ShouldRunComprehensiveSeeding(IWebHostEnvironment environment, SeedingSettings seedingSettings, ILogger<object> logger)
    {
        // Must be enabled in configuration
        if (!seedingSettings.EnableComprehensiveSeeding)
        {
            return false;
        }

        // In development environment, always allow if enabled
        if (environment.IsDevelopment())
        {
            if (seedingSettings.EnableSeedingLogs)
            {
                logger.LogInformation("Comprehensive seeding allowed: Development environment detected.");
            }
            return true;
        }

        // In non-development environments, require explicit force flag
        if (seedingSettings.ForceComprehensiveSeeding)
        {
            if (seedingSettings.EnableSeedingLogs)
            {
                logger.LogWarning("Comprehensive seeding FORCED in {Environment} environment. This should be used with extreme caution!", environment.EnvironmentName);
            }
            return true;
        }

        // Safety: Don't run comprehensive seeding in production-like environments
        if (seedingSettings.EnableSeedingLogs)
        {
            logger.LogInformation("Comprehensive seeding blocked: Non-development environment ({Environment}) and ForceComprehensiveSeeding is false. This is a safety measure to prevent test data in production.", environment.EnvironmentName);
        }
        return false;
    }

    /// <summary>
    /// Seeds essential data required for the application to function (admin user only).
    /// This runs in all environments where basic seeding is enabled.
    /// </summary>
    private static async Task SeedBasicDataAsync(BookingDbContext context, IPasswordService passwordService, ILogger<object> logger, bool enableLogs)
    {
        if (enableLogs)
        {
            logger.LogInformation("Starting basic data seeding (admin user only)...");
        }

        // Check if admin user already exists
        var existingAdmin = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Administrator);
        if (existingAdmin != null)
        {
            if (enableLogs)
            {
                logger.LogInformation("Admin user already exists. Skipping basic seeding.");
            }
            return;
        }

        var adminRegistrationDate = DateTime.UtcNow;
        
        // Create only the essential admin user
        var adminUser = new User
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
        };

        context.Users.Add(adminUser);
        await context.SaveChangesAsync();
        
        // Set the admin user as their own approver
        adminUser.ApprovedById = adminUser.Id;
        await context.SaveChangesAsync();

        if (enableLogs)
        {
            logger.LogInformation("Basic data seeding completed. Admin user created: {AdminEmail}", adminUser.Email);
        }
    }

    /// <summary>
    /// Seeds comprehensive test data including multiple users, accommodations, and bookings.
    /// This only runs in Development environment or when explicitly forced.
    /// </summary>
    private static async Task SeedComprehensiveTestDataAsync(BookingDbContext context, IPasswordService passwordService, ILogger<object> logger, bool enableLogs)
    {
        if (enableLogs)
        {
            logger.LogInformation("Starting comprehensive test data seeding...");
        }

        // Note: Removed the all-or-nothing check - now each seeding method handles its own duplicate prevention

        // Get the admin user that should exist from basic seeding
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Administrator);
        if (adminUser == null)
        {
            if (enableLogs)
            {
                logger.LogError("Admin user not found. Basic seeding should run before comprehensive seeding.");
            }
            return;
        }

        await SeedTestUsersAsync(context, passwordService, adminUser, enableLogs, logger);
        await SeedSleepingAccommodationsAsync(context, enableLogs, logger);
        await SeedBookingScenariosAsync(context, enableLogs, logger);

        if (enableLogs)
        {
            logger.LogInformation("Comprehensive test data seeding completed.");
        }
    }

    /// <summary>
    /// Seeds test users with various states for comprehensive testing scenarios.
    /// Uses email-based duplicate prevention for idempotent seeding.
    /// </summary>
    private static async Task SeedTestUsersAsync(BookingDbContext context, IPasswordService passwordService, User adminUser, bool enableLogs, ILogger<object> logger)
    {
        if (enableLogs)
        {
            logger.LogInformation("Seeding test users with idempotent duplicate prevention...");
        }

        // Get existing user emails for duplicate prevention
        var existingEmails = await context.Users
            .Select(u => u.Email.ToLower())
            .ToHashSetAsync();

        var oneWeekAgo = DateTime.UtcNow.AddDays(-7);
        var twoWeeksAgo = DateTime.UtcNow.AddDays(-14);
        var oneMonthAgo = DateTime.UtcNow.AddDays(-30);
        var twoMonthsAgo = DateTime.UtcNow.AddDays(-60);
        
        var testUserDefinitions = new[]
        {
            // ========== FULLY APPROVED & VERIFIED MEMBERS (Ready to book) ==========
            
            // Family Member 1: Senior family member, fully approved and active
            new UserDefinition
            {
                Email = "maria.mueller@familie-mueller.de",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddDays(-2) // Recently active
            },
            
            // Family Member 2: Adult family member, recently approved
            new UserDefinition
            {
                Email = "thomas.schmidt@gmail.com",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddHours(-12) // Very recently active
            },
            
            // Family Member 3: Young adult, established member
            new UserDefinition
            {
                Email = "anna.weber@web.de",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddDays(-1)
            },

            // ========== PENDING APPROVAL MEMBERS (Email verified, waiting for admin) ==========
            
            // Family Member 4: Recently registered, email verified but awaiting approval
            new UserDefinition
            {
                Email = "lisa.hoffmann@hotmail.de",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddHours(-8) // Checking back regularly
            },
            
            // Family Member 5: Older registration, verified but still pending approval
            new UserDefinition
            {
                Email = "michael.bauer@t-online.de",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddDays(-1).AddHours(6)
            },

            // ========== UNVERIFIED EMAIL MEMBERS (Registered but haven't verified email) ==========
            
            // Family Member 6: Very recent registration, email not verified yet
            new UserDefinition
            {
                Email = "sarah.koch@gmail.com",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddHours(-18)
            },
            
            // Family Member 7: Older registration with expired verification token
            new UserDefinition
            {
                Email = "peter.zimmermann@yahoo.de",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddDays(-5) // Hasn't logged in recently
            },

            // ========== BLOCKED/INACTIVE MEMBER (Edge case testing) ==========
            
            // Family Member 8: Blocked/inactive member for testing edge cases
            new UserDefinition
            {
                Email = "blocked.user@example.de",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddDays(-30) // Long time since last login
            },

            // ========== ADDITIONAL DIVERSE SCENARIOS ==========
            
            // Family Member 9: Teen/young family member (recently approved)
            new UserDefinition
            {
                Email = "julia.klein@student.de",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddHours(-3) // Very active
            },
            
            // Family Member 10: Another verified but pending approval case
            new UserDefinition
            {
                Email = "robert.fischer@gmx.de",
                Password = "member123",
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
                LastLoginAt = DateTime.UtcNow.AddHours(-4)
            }
        };

        // Filter out users that already exist and create User entities for new ones
        var usersToCreate = new List<User>();
        var skippedCount = 0;
        
        foreach (var userDef in testUserDefinitions)
        {
            if (existingEmails.Contains(userDef.Email.ToLower()))
            {
                if (enableLogs)
                {
                    logger.LogInformation("User already exists, skipping: {Email}", userDef.Email);
                }
                skippedCount++;
                continue;
            }

            // Create the User entity
            var user = new User
            {
                Email = userDef.Email,
                PasswordHash = passwordService.HashPassword(userDef.Password),
                FirstName = userDef.FirstName,
                LastName = userDef.LastName,
                Role = userDef.Role,
                IsActive = userDef.IsActive,
                EmailVerified = userDef.EmailVerified,
                EmailVerificationToken = userDef.EmailVerificationToken,
                EmailVerificationTokenExpiry = userDef.EmailVerificationTokenExpiry,
                EmailVerifiedAt = userDef.EmailVerifiedAt,
                RegistrationDate = userDef.RegistrationDate,
                IsApprovedForBooking = userDef.IsApprovedForBooking,
                ApprovedForBookingAt = userDef.ApprovedForBookingAt,
                ApprovedById = userDef.IsApprovedForBooking ? adminUser.Id : null,
                LastLoginAt = userDef.LastLoginAt
            };
            
            usersToCreate.Add(user);
        }

        // Add new users to database
        if (usersToCreate.Any())
        {
            context.Users.AddRange(usersToCreate);
            await context.SaveChangesAsync();
        }

        if (enableLogs)
        {
            logger.LogInformation("Test user seeding completed. Created: {CreatedCount}, Skipped: {SkippedCount}, Total Requested: {TotalCount}", 
                usersToCreate.Count, skippedCount, testUserDefinitions.Length);
        }
    }

    /// <summary>
    /// Seeds sleeping accommodations data for comprehensive testing.
    /// Uses name and type-based duplicate prevention for idempotent seeding.
    /// </summary>
    private static async Task SeedSleepingAccommodationsAsync(BookingDbContext context, bool enableLogs, ILogger<object> logger)
    {
        if (enableLogs)
        {
            logger.LogInformation("Seeding sleeping accommodations with idempotent duplicate prevention...");
        }

        // Get existing accommodations for duplicate prevention (name + type combination)
        var existingAccommodations = await context.SleepingAccommodations
            .Select(sa => new { sa.Name, sa.Type })
            .ToHashSetAsync();

        var baseTime = DateTime.UtcNow;
        var oneMonthAgo = baseTime.AddDays(-30);
        var twoWeeksAgo = baseTime.AddDays(-14);
        var oneWeekAgo = baseTime.AddDays(-7);

        var accommodationDefinitions = new[]
        {
            // ========== MAIN BEDROOM (Room type, 2-person capacity) ==========
            // Primary accommodation for couples or married family members
            new AccommodationDefinition
            {
                Name = "Hauptschlafzimmer",
                Type = AccommodationType.Room,
                MaxCapacity = 2,
                IsActive = true,
                CreatedAt = oneMonthAgo
            },

            // ========== GUEST ROOM (Room type, 1-person capacity) ==========
            // Single room for individual family members or guests
            new AccommodationDefinition
            {
                Name = "Gästezimmer",
                Type = AccommodationType.Room,
                MaxCapacity = 1,
                IsActive = true,
                CreatedAt = oneMonthAgo.AddHours(2)
            },

            // ========== LIVING ROOM SOFA (Room type, 1-person capacity) ==========
            // Flexible accommodation option using the living room sofa bed
            new AccommodationDefinition
            {
                Name = "Wohnzimmer Schlafsofa",
                Type = AccommodationType.Room,
                MaxCapacity = 1,
                IsActive = true,
                CreatedAt = twoWeeksAgo
            },

            // ========== GARDEN TENT/CAMPING AREA (Tent type, 4-person capacity) ==========
            // Large camping area for families or groups who prefer outdoor accommodation
            new AccommodationDefinition
            {
                Name = "Garten Zeltplatz",
                Type = AccommodationType.Tent,
                MaxCapacity = 4,
                IsActive = true,
                CreatedAt = twoWeeksAgo.AddDays(2)
            },

            // ========== CHILDREN'S ROOM (Room type, 2-person capacity) ==========
            // Room designed for children or young family members with bunk beds
            new AccommodationDefinition
            {
                Name = "Kinderzimmer",
                Type = AccommodationType.Room,
                MaxCapacity = 2,
                IsActive = true,
                CreatedAt = oneWeekAgo
            }
        };

        // Filter out accommodations that already exist and create SleepingAccommodation entities for new ones
        var accommodationsToCreate = new List<SleepingAccommodation>();
        var skippedCount = 0;
        
        foreach (var accommodationDef in accommodationDefinitions)
        {
            if (existingAccommodations.Contains(new { accommodationDef.Name, accommodationDef.Type }))
            {
                if (enableLogs)
                {
                    logger.LogInformation("Accommodation already exists, skipping: {Name} ({Type})", accommodationDef.Name, accommodationDef.Type);
                }
                skippedCount++;
                continue;
            }

            // Create the SleepingAccommodation entity
            var accommodation = new SleepingAccommodation
            {
                Name = accommodationDef.Name,
                Type = accommodationDef.Type,
                MaxCapacity = accommodationDef.MaxCapacity,
                IsActive = accommodationDef.IsActive,
                CreatedAt = accommodationDef.CreatedAt,
                ChangedAt = null
            };
            
            accommodationsToCreate.Add(accommodation);
        }

        // Add new accommodations to database
        if (accommodationsToCreate.Any())
        {
            context.SleepingAccommodations.AddRange(accommodationsToCreate);
            await context.SaveChangesAsync();
        }

        if (enableLogs)
        {
            logger.LogInformation("Sleeping accommodations seeding completed. Created: {CreatedCount}, Skipped: {SkippedCount}, Total Requested: {TotalCount}", 
                accommodationsToCreate.Count, skippedCount, accommodationDefinitions.Length);
        }
    }

    /// <summary>
    /// Seeds booking scenarios for comprehensive testing.
    /// Uses smart duplicate detection based on user, dates, and accommodation combinations.
    /// </summary>
    private static async Task SeedBookingScenariosAsync(BookingDbContext context, bool enableLogs, ILogger<object> logger)
    {
        if (enableLogs)
        {
            logger.LogInformation("Seeding booking scenarios with idempotent duplicate prevention...");
        }

        // Get reference data needed for booking scenarios
        var users = await context.Users.Where(u => u.IsActive).ToListAsync();
        var accommodations = await context.SleepingAccommodations.Where(a => a.IsActive).ToListAsync();

        if (!users.Any() || !accommodations.Any())
        {
            if (enableLogs)
            {
                logger.LogWarning("Cannot seed bookings without users and accommodations. Users: {UserCount}, Accommodations: {AccommodationCount}", users.Count, accommodations.Count);
            }
            return; // Cannot seed bookings without users and accommodations
        }

        // Get existing bookings for duplicate prevention
        // Use a composite key approach: user email + start date + accommodation names
        var existingBookingKeys = await context.BookingReadModels
            .Select(b => new { 
                UserEmail = b.UserEmail.ToLower(), 
                StartDate = b.StartDate.Date,
                BookingItemsJson = b.BookingItemsJson
            })
            .ToListAsync();

        // Define all booking scenarios
        var bookingDefinitions = GetBookingDefinitions();
        
        // Create a user lookup for easier access
        var userLookup = users.ToDictionary(u => u.Email.ToLower(), u => u);
        var accommodationLookup = accommodations.ToDictionary(a => a.Name, a => a);
        
        var bookingsToCreate = new List<BookingReadModel>();
        var skippedCount = 0;

        // Process each booking definition
        foreach (var bookingDef in bookingDefinitions)
        {
            // Check if user exists
            if (!userLookup.TryGetValue(bookingDef.UserEmail.ToLower(), out var user))
            {
                if (enableLogs)
                {
                    logger.LogWarning("User not found for booking, skipping: {UserEmail}", bookingDef.UserEmail);
                }
                skippedCount++;
                continue;
            }

            // Check if all accommodations exist
            var accommodationIds = new List<Guid>();
            var accommodationMissing = false;
            foreach (var item in bookingDef.AccommodationItems)
            {
                if (!accommodationLookup.TryGetValue(item.AccommodationName, out var accommodation))
                {
                    if (enableLogs)
                    {
                        logger.LogWarning("Accommodation not found for booking, skipping: {AccommodationName}", item.AccommodationName);
                    }
                    accommodationMissing = true;
                    break;
                }
                accommodationIds.Add(accommodation.Id);
            }

            if (accommodationMissing)
            {
                skippedCount++;
                continue;
            }

            // Create booking items JSON for duplicate detection
            var bookingItems = bookingDef.AccommodationItems.Select((item, index) => new
            {
                SleepingAccommodationId = accommodationIds[index],
                PersonCount = item.PersonCount
            }).ToList();
            var bookingItemsJson = System.Text.Json.JsonSerializer.Serialize(bookingItems);

            // Check for duplicates using composite key
            var isDuplicate = existingBookingKeys.Any(existing => 
                existing.UserEmail == user.Email.ToLower() && 
                existing.StartDate == bookingDef.StartDate.Date &&
                existing.BookingItemsJson == bookingItemsJson);

            if (isDuplicate)
            {
                if (enableLogs)
                {
                    logger.LogInformation("Booking already exists, skipping: {UserEmail} from {StartDate} to {EndDate}", 
                        user.Email, bookingDef.StartDate.ToString("yyyy-MM-dd"), bookingDef.EndDate.ToString("yyyy-MM-dd"));
                }
                skippedCount++;
                continue;
            }

            // Create the booking
            var totalPersons = bookingDef.AccommodationItems.Sum(item => item.PersonCount);
            var booking = new BookingReadModel
            {
                Id = bookingDef.BookingId,
                UserId = user.Id,
                StartDate = bookingDef.StartDate,
                EndDate = bookingDef.EndDate,
                Status = bookingDef.Status,
                Notes = bookingDef.Notes,
                CreatedAt = bookingDef.CreatedAt,
                ChangedAt = bookingDef.Status != BookingStatus.Pending ? bookingDef.CreatedAt.AddMinutes(30) : null,
                LastEventVersion = 1,
                BookingItemsJson = bookingItemsJson,
                UserName = $"{user.FirstName} {user.LastName}".Trim(),
                UserEmail = user.Email,
                TotalPersons = totalPersons
            };

            bookingsToCreate.Add(booking);
        }

        // Add new bookings to database
        if (bookingsToCreate.Any())
        {
            context.BookingReadModels.AddRange(bookingsToCreate);
            await context.SaveChangesAsync();
        }

        if (enableLogs)
        {
            logger.LogInformation("Booking scenarios seeding completed. Created: {CreatedCount}, Skipped: {SkippedCount}, Total Requested: {TotalCount}", 
                bookingsToCreate.Count, skippedCount, bookingDefinitions.Count);
        }
    }

    /// <summary>
    /// Defines all the booking scenarios for comprehensive testing.
    /// This method centralizes all booking definitions for easy maintenance.
    /// </summary>
    private static List<BookingDefinition> GetBookingDefinitions()
    {
        var now = DateTime.UtcNow;
        var baseTime = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc); // Start of today

        return new List<BookingDefinition>
        {
            // ========== PAST BOOKINGS ==========
            
            // Past Booking 1: Completed family weekend (2 months ago)
            new BookingDefinition
            {
                BookingId = new Guid("10000000-0000-0000-0000-000000000001"),
                UserEmail = "maria.mueller@familie-mueller.de",
                StartDate = baseTime.AddDays(-60),
                EndDate = baseTime.AddDays(-58),
                Status = BookingStatus.Completed,
                Notes = "Wunderschönes Wochenende mit der Familie verbracht",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Hauptschlafzimmer", PersonCount = 2 }
                },
                CreatedAt = baseTime.AddDays(-62)
            },

            // Past Booking 2: Cancelled camping trip (1.5 months ago)
            new BookingDefinition
            {
                BookingId = new Guid("10000000-0000-0000-0000-000000000002"),
                UserEmail = "thomas.schmidt@gmail.com",
                StartDate = baseTime.AddDays(-45),
                EndDate = baseTime.AddDays(-42),
                Status = BookingStatus.Cancelled,
                Notes = "Wetterbedingt storniert - Regenwetter",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Garten Zeltplatz", PersonCount = 3 }
                },
                CreatedAt = baseTime.AddDays(-50)
            },

            // Past Booking 3: Completed single stay (1 month ago)
            new BookingDefinition
            {
                BookingId = new Guid("10000000-0000-0000-0000-000000000003"),
                UserEmail = "maria.mueller@familie-mueller.de",
                StartDate = baseTime.AddDays(-30),
                EndDate = baseTime.AddDays(-29),
                Status = BookingStatus.Completed,
                Notes = "Entspannter Kurzbesuch",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Gästezimmer", PersonCount = 1 }
                },
                CreatedAt = baseTime.AddDays(-35)
            },

            // Past Booking 4: Completed children's visit (3 weeks ago)
            new BookingDefinition
            {
                BookingId = new Guid("10000000-0000-0000-0000-000000000004"),
                UserEmail = "thomas.schmidt@gmail.com",
                StartDate = baseTime.AddDays(-21),
                EndDate = baseTime.AddDays(-19),
                Status = BookingStatus.Completed,
                Notes = "Kinder hatten viel Spaß im Kinderzimmer",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Kinderzimmer", PersonCount = 2 }
                },
                CreatedAt = baseTime.AddDays(-25)
            },

            // Past Booking 5: Cancelled sofa booking (2 weeks ago)
            new BookingDefinition
            {
                BookingId = new Guid("10000000-0000-0000-0000-000000000005"),
                UserEmail = "anna.weber@web.de",
                StartDate = baseTime.AddDays(-14),
                EndDate = baseTime.AddDays(-13),
                Status = BookingStatus.Cancelled,
                Notes = "Kurzfristig abgesagt wegen Krankheit",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Wohnzimmer Schlafsofa", PersonCount = 1 }
                },
                CreatedAt = baseTime.AddDays(-16)
            },

            // ========== CURRENT/RECENT BOOKINGS ==========

            // Current Booking 1: Active booking this week (confirmed)
            new BookingDefinition
            {
                BookingId = new Guid("20000000-0000-0000-0000-000000000001"),
                UserEmail = "maria.mueller@familie-mueller.de",
                StartDate = baseTime.AddDays(-2),
                EndDate = baseTime.AddDays(2),
                Status = BookingStatus.Confirmed,
                Notes = "Aktuelle Buchung - Familie im Haus",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Hauptschlafzimmer", PersonCount = 2 }
                },
                CreatedAt = baseTime.AddDays(-10)
            },

            // Current Booking 2: Recently confirmed booking
            new BookingDefinition
            {
                BookingId = new Guid("20000000-0000-0000-0000-000000000002"),
                UserEmail = "thomas.schmidt@gmail.com",
                StartDate = baseTime.AddDays(1),
                EndDate = baseTime.AddDays(3),
                Status = BookingStatus.Confirmed,
                Notes = "Kurzfristiger Besuch - gerade bestätigt",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Gästezimmer", PersonCount = 1 }
                },
                CreatedAt = baseTime.AddHours(-6)
            },

            // Current Booking 3: Pending approval booking
            new BookingDefinition
            {
                BookingId = new Guid("20000000-0000-0000-0000-000000000003"),
                UserEmail = "lisa.hoffmann@hotmail.de",
                StartDate = baseTime.AddDays(3),
                EndDate = baseTime.AddDays(5),
                Status = BookingStatus.Pending,
                Notes = "Familienbesuch mit Kindern geplant",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Kinderzimmer", PersonCount = 2 }
                },
                CreatedAt = baseTime.AddHours(-12)
            },

            // Current Booking 4: Conflicting booking scenario (overlapping dates)
            new BookingDefinition
            {
                BookingId = new Guid("20000000-0000-0000-0000-000000000004"),
                UserEmail = "anna.weber@web.de",
                StartDate = baseTime.AddDays(2),
                EndDate = baseTime.AddDays(4),
                Status = BookingStatus.Pending,
                Notes = "Eventuell Konflikt mit anderer Buchung",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Hauptschlafzimmer", PersonCount = 2 }
                },
                CreatedAt = baseTime.AddHours(-4)
            },

            // ========== FUTURE BOOKINGS ==========

            // Future Booking 1: Confirmed summer vacation (next month)
            new BookingDefinition
            {
                BookingId = new Guid("30000000-0000-0000-0000-000000000001"),
                UserEmail = "maria.mueller@familie-mueller.de",
                StartDate = baseTime.AddDays(30),
                EndDate = baseTime.AddDays(37),
                Status = BookingStatus.Confirmed,
                Notes = "Sommerferien Camping mit der ganzen Familie",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Garten Zeltplatz", PersonCount = 4 }
                },
                CreatedAt = baseTime.AddDays(-5)
            },

            // Future Booking 2: Pending weekend booking
            new BookingDefinition
            {
                BookingId = new Guid("30000000-0000-0000-0000-000000000002"),
                UserEmail = "thomas.schmidt@gmail.com",
                StartDate = baseTime.AddDays(14),
                EndDate = baseTime.AddDays(16),
                Status = BookingStatus.Pending,
                Notes = "Wochenendbesuch - warten auf Bestätigung",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Hauptschlafzimmer", PersonCount = 2 }
                },
                CreatedAt = baseTime.AddDays(-1)
            },

            // Future Booking 3: Accepted longer stay
            new BookingDefinition
            {
                BookingId = new Guid("30000000-0000-0000-0000-000000000003"),
                UserEmail = "anna.weber@web.de",
                StartDate = baseTime.AddDays(45),
                EndDate = baseTime.AddDays(50),
                Status = BookingStatus.Accepted,
                Notes = "Längerer Besuch - bereits akzeptiert",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Gästezimmer", PersonCount = 1 }
                },
                CreatedAt = baseTime.AddDays(-3)
            },

            // Future Booking 4: Rejected booking (overbooking scenario)
            new BookingDefinition
            {
                BookingId = new Guid("30000000-0000-0000-0000-000000000004"),
                UserEmail = "thomas.schmidt@gmail.com",
                StartDate = baseTime.AddDays(31),
                EndDate = baseTime.AddDays(33),
                Status = BookingStatus.Rejected,
                Notes = "Leider abgelehnt - bereits ausgebucht",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Hauptschlafzimmer", PersonCount = 2 }
                },
                CreatedAt = baseTime.AddDays(-4)
            },

            // Future Booking 5: Multi-accommodation booking (family gathering)
            new BookingDefinition
            {
                BookingId = new Guid("30000000-0000-0000-0000-000000000005"),
                UserEmail = "maria.mueller@familie-mueller.de",
                StartDate = baseTime.AddDays(60),
                EndDate = baseTime.AddDays(63),
                Status = BookingStatus.Confirmed,
                Notes = "Großes Familientreffen - mehrere Zimmer",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Hauptschlafzimmer", PersonCount = 2 },
                    new BookingAccommodationItem { AccommodationName = "Kinderzimmer", PersonCount = 2 }
                },
                CreatedAt = baseTime.AddDays(-7)
            },

            // Future Booking 6: Same-day booking edge case
            new BookingDefinition
            {
                BookingId = new Guid("30000000-0000-0000-0000-000000000006"),
                UserEmail = "anna.weber@web.de",
                StartDate = baseTime.AddDays(7),
                EndDate = baseTime.AddDays(7),
                Status = BookingStatus.Pending,
                Notes = "Kurzfristige Anfrage - nur eine Nacht",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Wohnzimmer Schlafsofa", PersonCount = 1 }
                },
                CreatedAt = baseTime.AddHours(-2)
            },

            // Future Booking 7: Holiday season booking
            new BookingDefinition
            {
                BookingId = new Guid("30000000-0000-0000-0000-000000000007"),
                UserEmail = "thomas.schmidt@gmail.com",
                StartDate = baseTime.AddDays(90),
                EndDate = baseTime.AddDays(94),
                Status = BookingStatus.Confirmed,
                Notes = "Herbstferien Zelten - lange im Voraus geplant",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Garten Zeltplatz", PersonCount = 3 }
                },
                CreatedAt = baseTime.AddDays(-15)
            },

            // Future Booking 8: Admin booking (edge case)
            new BookingDefinition
            {
                BookingId = new Guid("30000000-0000-0000-0000-000000000008"),
                UserEmail = "admin@booking.com",
                StartDate = baseTime.AddDays(21),
                EndDate = baseTime.AddDays(22),
                Status = BookingStatus.Confirmed,
                Notes = "Administrative Überprüfung der Unterkunft",
                AccommodationItems = new List<BookingAccommodationItem>
                {
                    new BookingAccommodationItem { AccommodationName = "Gästezimmer", PersonCount = 1 }
                },
                CreatedAt = baseTime.AddDays(-2)
            }
        };
    }
}