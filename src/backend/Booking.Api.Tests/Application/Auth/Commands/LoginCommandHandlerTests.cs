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
            IsActive = true,
            EmailVerified = true,
            IsApprovedForBooking = true
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
        result.ErrorMessage.Should().Be("Ungültige E-Mail-Adresse oder Passwort.");
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
            IsActive = true,
            EmailVerified = true,
            IsApprovedForBooking = true
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
        result.ErrorMessage.Should().Be("Ungültige E-Mail-Adresse oder Passwort.");
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
        result.ErrorMessage.Should().Be("Ungültige E-Mail-Adresse oder Passwort.");
    }

    [Fact]
    public async Task Handle_UnverifiedEmail_ReturnsFailure()
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
            IsActive = true,
            EmailVerified = false, // Email not verified
            IsApprovedForBooking = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new LoginCommand("test@example.com", "password123");
        
        _passwordServiceMock
            .Setup(x => x.VerifyPassword("password123", "hashedPassword"))
            .Returns(true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Token.Should().BeNull();
        result.ErrorMessage.Should().Be("Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Überprüfen Sie Ihr E-Mail-Postfach oder fordern Sie eine neue Bestätigungs-E-Mail an.");
    }

    [Fact]
    public async Task Handle_UnapprovedUser_ReturnsFailure()
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
            IsActive = true,
            EmailVerified = true,
            IsApprovedForBooking = false // User not approved for booking
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new LoginCommand("test@example.com", "password123");
        
        _passwordServiceMock
            .Setup(x => x.VerifyPassword("password123", "hashedPassword"))
            .Returns(true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Token.Should().BeNull();
        result.ErrorMessage.Should().Be("Ihr Konto wartet noch auf die Freigabe durch einen Administrator. Sie werden per E-Mail benachrichtigt, sobald Ihr Konto freigeschaltet wurde.");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}