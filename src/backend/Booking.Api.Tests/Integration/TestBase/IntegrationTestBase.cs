using System.Net.Http.Headers;
using System.Text;
using Booking.Api.Configuration;
using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ReadModels;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Testcontainers.PostgreSql;

namespace Booking.Api.Tests.Integration.TestBase;

public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected WebApplicationFactory<Program> Factory { get; private set; } = null!;
    protected HttpClient Client { get; private set; } = null!;
    protected IServiceProvider Services { get; private set; } = null!;
    protected TestJwtTokenProvider TokenProvider { get; private set; } = null!;
    
    private PostgreSqlContainer _postgres = null!;
    private const string TestJwtSecret = "ThisIsATestSecretForIntegrationTestsThatIsLongEnough123!";
    
    public async Task InitializeAsync()
    {
        // Start PostgreSQL container
        _postgres = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase("booking_test")
            .WithUsername("test_user")
            .WithPassword("test_password")
            .Build();
            
        await _postgres.StartAsync();
        
        // Create WebApplicationFactory
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    // Clear any existing configuration to ensure our test configuration takes precedence
                    config.Sources.Clear();
                    
                    // Override configuration for tests
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:DefaultConnection"] = _postgres.GetConnectionString(),
                        ["JwtSettings:Secret"] = TestJwtSecret,
                        ["JwtSettings:Issuer"] = "TestApi",
                        ["JwtSettings:Audience"] = "TestApp",
                        ["JwtSettings:ExpirationMinutes"] = "60"
                    });
                });
                
                builder.ConfigureServices(services =>
                {
                    // Remove the existing DbContext configuration
                    services.RemoveAll<DbContextOptions<BookingDbContext>>();
                    
                    // Add test database
                    services.AddDbContext<BookingDbContext>(options =>
                    {
                        options.UseNpgsql(_postgres.GetConnectionString());
                    });
                    
                    // Reconfigure JWT authentication with test settings
                    services.Configure<JwtSettings>(options =>
                    {
                        options.Secret = TestJwtSecret;
                        options.Issuer = "TestApi";
                        options.Audience = "TestApp";
                        options.ExpirationMinutes = 60;
                    });
                    
                    // Reconfigure JWT Bearer authentication with test secret
                    services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
                    {
                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            ValidateIssuerSigningKey = true,
                            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtSecret)),
                            ValidateIssuer = true,
                            ValidIssuer = "TestApi",
                            ValidateAudience = true,
                            ValidAudience = "TestApp",
                            ValidateLifetime = true,
                            ClockSkew = TimeSpan.Zero
                        };
                    });
                    
                    // Apply migrations and seed test data
                    var sp = services.BuildServiceProvider();
                    using var scope = sp.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
                    db.Database.Migrate();
                    
                    // Seed test users
                    SeedTestUsers(db);
                });
            });
            
        Client = Factory.CreateClient();
        Services = Factory.Services;
        
        // Get the actual JWT settings from the configured services to ensure consistency
        using var scope = Services.CreateScope();
        var jwtSettings = scope.ServiceProvider.GetRequiredService<IOptions<JwtSettings>>().Value;
        TokenProvider = new TestJwtTokenProvider(jwtSettings.Secret, jwtSettings.Issuer, jwtSettings.Audience);
    }
    
    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }
    
    protected void AddAuthorizationHeader(string token)
    {
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
    
    protected void RemoveAuthorizationHeader()
    {
        Client.DefaultRequestHeaders.Authorization = null;
    }
    
    protected async Task<T> WithScopeAsync<T>(Func<IServiceProvider, Task<T>> action)
    {
        using var scope = Services.CreateScope();
        return await action(scope.ServiceProvider);
    }
    
    protected async Task WithScopeAsync(Func<IServiceProvider, Task> action)
    {
        using var scope = Services.CreateScope();
        await action(scope.ServiceProvider);
    }
    
    protected async Task<Guid> CreateTestSleepingAccommodationAsync(string name = "Test Zimmer", AccommodationType type = AccommodationType.Room, int maxCapacity = 4)
    {
        return await WithScopeAsync(async serviceProvider =>
        {
            var context = serviceProvider.GetRequiredService<BookingDbContext>();
            
            var accommodation = new SleepingAccommodationReadModel
            {
                Id = Guid.NewGuid(),
                Name = name,
                Type = type,
                MaxCapacity = maxCapacity,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                ChangedAt = null,
                LastEventVersion = 1
            };
            
            context.SleepingAccommodationReadModels.Add(accommodation);
            await context.SaveChangesAsync();
            
            return accommodation.Id;
        });
    }
    
    private static void SeedTestUsers(BookingDbContext context)
    {
        // Check if test users already exist
        if (context.Users.Any())
        {
            return;
        }
        
        var testUsers = new[]
        {
            new User
            {
                Id = 1,
                Email = "test@example.com",
                PasswordHash = "dummy_hash", // Not used in JWT tests
                FirstName = "Test",
                LastName = "User",
                Role = UserRole.Member,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Email = "user1@example.com",
                PasswordHash = "dummy_hash",
                FirstName = "User",
                LastName = "One",
                Role = UserRole.Member,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 3,
                Email = "user2@example.com",
                PasswordHash = "dummy_hash",
                FirstName = "User",
                LastName = "Two",
                Role = UserRole.Member,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 4,
                Email = "admin@example.com",
                PasswordHash = "dummy_hash",
                FirstName = "Admin",
                LastName = "User",
                Role = UserRole.Administrator,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 5,
                Email = "user@example.com",
                PasswordHash = "dummy_hash",
                FirstName = "Regular",
                LastName = "User",
                Role = UserRole.Member,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };
        
        context.Users.AddRange(testUsers);
        context.SaveChanges();
    }
}