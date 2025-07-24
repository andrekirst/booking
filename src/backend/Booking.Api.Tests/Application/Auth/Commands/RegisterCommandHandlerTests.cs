using AutoFixture;
using AutoFixture.Kernel;
using Booking.Api.Application.Auth.Commands;
using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Booking.Api.Tests.Application.Auth.Commands;

public class RegisterCommandHandlerTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IEmailService _emailService;
    private readonly RegisterCommandHandler _handler;
    private readonly Fixture _fixture;

    public RegisterCommandHandlerTests()
    {
        _fixture = new Fixture();
        
        // Configure AutoFixture to handle circular references
        _fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
            .ForEach(b => _fixture.Behaviors.Remove(b));
        _fixture.Behaviors.Add(new OmitOnRecursionBehavior());
        
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new BookingDbContext(options);
        
        // Setup mocks
        _passwordService = Substitute.For<IPasswordService>();
        _emailService = Substitute.For<IEmailService>();
        
        _handler = new RegisterCommandHandler(_context, _passwordService, _emailService);
    }

    [Fact]
    public async Task Handle_WithValidData_ShouldCreateUser()
    {
        // Arrange
        var command = new RegisterCommand("test@example.com", "password123", "John", "Doe");
        var hashedPassword = "hashed_password_123";
        
        _passwordService.HashPassword(command.Password).Returns(hashedPassword);
        _emailService.SendEmailVerificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));
        _emailService.SendAdminNotificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("Registrierung erfolgreich");
        result.UserId.Should().NotBeNull();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == command.Email);
        user.Should().NotBeNull();
        user!.Email.Should().Be(command.Email);
        user.PasswordHash.Should().Be(hashedPassword);
        user.FirstName.Should().Be(command.FirstName);
        user.LastName.Should().Be(command.LastName);
        user.EmailVerified.Should().BeFalse();
        user.IsApprovedForBooking.Should().BeFalse();
        user.EmailVerificationToken.Should().NotBeNullOrEmpty();
        user.EmailVerificationTokenExpiry.Should().BeAfter(DateTime.UtcNow);
        user.RegistrationDate.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task Handle_WithExistingEmail_ShouldReturnFailure()
    {
        // Arrange
        var existingUser = _fixture.Build<User>()
            .With(u => u.Email, "test@example.com")
            .Create();
        
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var command = new RegisterCommand("test@example.com", "password123", "John", "Doe");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Be("E-Mail-Adresse ist bereits registriert.");
        result.UserId.Should().BeNull();
    }

    [Fact]
    public async Task Handle_ShouldCallPasswordService()
    {
        // Arrange
        var command = new RegisterCommand("test@example.com", "password123", "John", "Doe");
        var hashedPassword = "hashed_password_123";
        
        _passwordService.HashPassword(command.Password).Returns(hashedPassword);
        _emailService.SendEmailVerificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));
        _emailService.SendAdminNotificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _passwordService.Received(1).HashPassword(command.Password);
    }

    [Fact]
    public async Task Handle_ShouldSendVerificationEmail()
    {
        // Arrange
        var command = new RegisterCommand("test@example.com", "password123", "John", "Doe");
        
        _passwordService.HashPassword(Arg.Any<string>()).Returns("hashed_password");
        _emailService.SendEmailVerificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));
        _emailService.SendAdminNotificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        await _emailService.Received(1).SendEmailVerificationAsync(
            command.Email, 
            command.FirstName, 
            Arg.Any<string>());
    }

    [Fact]
    public async Task Handle_ShouldSendAdminNotification()
    {
        // Arrange
        var command = new RegisterCommand("test@example.com", "password123", "John", "Doe");
        
        _passwordService.HashPassword(Arg.Any<string>()).Returns("hashed_password");
        _emailService.SendEmailVerificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));
        _emailService.SendAdminNotificationAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(true));

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        await _emailService.Received(1).SendAdminNotificationAsync(
            command.Email,
            command.FirstName,
            command.LastName);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}