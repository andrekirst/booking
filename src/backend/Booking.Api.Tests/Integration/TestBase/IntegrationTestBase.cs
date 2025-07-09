using System.Net.Http.Headers;
using Booking.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
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
                    
                    // Apply migrations
                    var sp = services.BuildServiceProvider();
                    using var scope = sp.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
                    db.Database.Migrate();
                });
            });
            
        Client = Factory.CreateClient();
        Services = Factory.Services;
        TokenProvider = new TestJwtTokenProvider(TestJwtSecret, "TestApi", "TestApp");
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
}