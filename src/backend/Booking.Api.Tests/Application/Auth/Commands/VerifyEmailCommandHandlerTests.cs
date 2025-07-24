using AutoFixture;
using AutoFixture.Kernel;
using Booking.Api.Application.Auth.Commands;
using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Tests.Application.Auth.Commands;

public class VerifyEmailCommandHandlerTests : IDisposable
{
    private readonly BookingDbContext _context;
    private readonly VerifyEmailCommandHandler _handler;
    private readonly Fixture _fixture;

    public VerifyEmailCommandHandlerTests()
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
        
        _handler = new VerifyEmailCommandHandler(_context);
    }

    [Fact]
    public async Task Handle_WithValidToken_ShouldVerifyEmail()
    {
        // Arrange
        var verificationToken = "valid_token_123";
        var user = _fixture.Build<User>()
            .With(u => u.EmailVerified, false)
            .With(u => u.EmailVerificationToken, verificationToken)
            .With(u => u.EmailVerificationTokenExpiry, DateTime.UtcNow.AddHours(1))
            .Create();
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new VerifyEmailCommand(verificationToken);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("erfolgreich verifiziert");
        result.RequiresApproval.Should().BeTrue();

        // Verify user was updated
        var updatedUser = await _context.Users.FirstAsync(u => u.Id == user.Id);
        updatedUser.EmailVerified.Should().BeTrue();
        updatedUser.EmailVerifiedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
        updatedUser.EmailVerificationToken.Should().BeNull();
        updatedUser.EmailVerificationTokenExpiry.Should().BeNull();
        updatedUser.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task Handle_WithInvalidToken_ShouldReturnFailure()
    {
        // Arrange
        var command = new VerifyEmailCommand("invalid_token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Ungültiger oder abgelaufener Verifizierungstoken");
        result.RequiresApproval.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WithExpiredToken_ShouldReturnFailure()
    {
        // Arrange
        var expiredToken = "expired_token_123";
        var user = _fixture.Build<User>()
            .With(u => u.EmailVerified, false)
            .With(u => u.EmailVerificationToken, expiredToken)
            .With(u => u.EmailVerificationTokenExpiry, DateTime.UtcNow.AddHours(-1)) // Expired
            .Create();
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new VerifyEmailCommand(expiredToken);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Ungültiger oder abgelaufener Verifizierungstoken");
        
        // Verify user was not updated
        var unchangedUser = await _context.Users.FirstAsync(u => u.Id == user.Id);
        unchangedUser.EmailVerified.Should().BeFalse();
        unchangedUser.EmailVerificationToken.Should().Be(expiredToken);
    }

    [Fact]
    public async Task Handle_WithAlreadyVerifiedUser_ShouldReturnFailure()
    {
        // Arrange
        var token = "some_token";
        var user = _fixture.Build<User>()
            .With(u => u.EmailVerified, true) // Already verified
            .With(u => u.EmailVerificationToken, token)
            .With(u => u.EmailVerificationTokenExpiry, DateTime.UtcNow.AddHours(1))
            .Create();
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var command = new VerifyEmailCommand(token);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Ungültiger oder abgelaufener Verifizierungstoken");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}