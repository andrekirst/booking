using Booking.Api.Application.Auth.Commands;
using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Booking.Api.Tests.Application.Auth.Commands;

public class LoginCommandHandlerTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly Mock<IPasswordService> _passwordServiceMock;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BookingDbContext(options);
        _passwordServiceMock = new Mock<IPasswordService>();
        _jwtServiceMock = new Mock<IJwtService>();
        _handler = new LoginCommandHandler(_context, _passwordServiceMock.Object, _jwtServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsSuccessWithToken()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            PasswordHash = "hashedPassword",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new LoginCommand("test@example.com", "password123");
        
        _passwordServiceMock
            .Setup(x => x.VerifyPassword("password123", "hashedPassword"))
            .Returns(true);
            
        _jwtServiceMock
            .Setup(x => x.GenerateToken(It.IsAny<User>()))
            .Returns("jwt-token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Token.Should().Be("jwt-token");
        result.ErrorMessage.Should().BeNull();
        
        // Verify LastLoginAt was updated
        var updatedUser = await _context.Users.FindAsync(1);
        updatedUser!.LastLoginAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_InvalidEmail_ReturnsFailure()
    {
        // Arrange
        var command = new LoginCommand("nonexistent@example.com", "password123");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Token.Should().BeNull();
        result.ErrorMessage.Should().Be("Invalid email or password");
    }

    [Fact]
    public async Task Handle_InvalidPassword_ReturnsFailure()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            PasswordHash = "hashedPassword",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new LoginCommand("test@example.com", "wrongPassword");
        
        _passwordServiceMock
            .Setup(x => x.VerifyPassword("wrongPassword", "hashedPassword"))
            .Returns(false);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Token.Should().BeNull();
        result.ErrorMessage.Should().Be("Invalid email or password");
    }

    [Fact]
    public async Task Handle_InactiveUser_ReturnsFailure()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            PasswordHash = "hashedPassword",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member,
            IsActive = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new LoginCommand("test@example.com", "password123");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Token.Should().BeNull();
        result.ErrorMessage.Should().Be("Invalid email or password");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}