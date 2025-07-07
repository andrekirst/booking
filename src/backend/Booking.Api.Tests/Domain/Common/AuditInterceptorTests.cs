using Booking.Api.Data;
using Booking.Api.Data.Interceptors;
using Booking.Api.Domain.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Tests.Domain.Common;

public class AuditInterceptorTests : IDisposable
{
    private readonly BookingDbContext _context;

    public AuditInterceptorTests()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .AddInterceptors(new AuditInterceptor())
            .Options;

        _context = new BookingDbContext(options);
    }

    [Fact]
    public async Task SaveChanges_WhenAddingEntity_ShouldSetCreatedAt()
    {
        // Arrange
        var user = new User
        {
            Email = "test@example.com",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member
        };

        // Act
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assert
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        user.ChangedAt.Should().BeNull();
    }

    [Fact]
    public async Task SaveChanges_WhenModifyingEntity_ShouldSetChangedAt()
    {
        // Arrange
        var user = new User
        {
            Email = "test@example.com",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var originalCreatedAt = user.CreatedAt;

        // Act
        user.FirstName = "Updated";
        await _context.SaveChangesAsync();

        // Assert
        user.CreatedAt.Should().Be(originalCreatedAt);
        user.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task QueryFilter_ShouldOnlyReturnActiveUsers()
    {
        // Arrange
        var activeUser = new User
        {
            Email = "active@example.com",
            PasswordHash = "hash",
            FirstName = "Active",
            LastName = "User",
            Role = UserRole.Member,
            IsActive = true
        };

        var inactiveUser = new User
        {
            Email = "inactive@example.com",
            PasswordHash = "hash",
            FirstName = "Inactive",
            LastName = "User",
            Role = UserRole.Member,
            IsActive = false
        };

        _context.Users.AddRange(activeUser, inactiveUser);
        await _context.SaveChangesAsync();

        // Act
        var users = await _context.Users.ToListAsync();

        // Assert
        users.Should().HaveCount(1);
        users.First().Email.Should().Be("active@example.com");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}