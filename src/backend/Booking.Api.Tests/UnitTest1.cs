using Booking.Api.Services;
using FluentAssertions;

namespace Booking.Api.Tests;

public class ServiceRegistrationTests
{
    [Fact]
    public void PasswordService_ShouldHashAndVerifyPasswords()
    {
        // Arrange
        var passwordService = new PasswordService();
        const string originalPassword = "testPassword123";

        // Act
        var hashedPassword = passwordService.HashPassword(originalPassword);
        var isValid = passwordService.VerifyPassword(originalPassword, hashedPassword);
        var isInvalid = passwordService.VerifyPassword("wrongPassword", hashedPassword);

        // Assert
        hashedPassword.Should().NotBeNullOrEmpty();
        hashedPassword.Should().NotBe(originalPassword);
        isValid.Should().BeTrue();
        isInvalid.Should().BeFalse();
    }

    [Fact]
    public void PasswordService_ShouldGenerateDifferentHashesForSamePassword()
    {
        // Arrange
        var passwordService = new PasswordService();
        const string password = "testPassword123";

        // Act
        var hash1 = passwordService.HashPassword(password);
        var hash2 = passwordService.HashPassword(password);

        // Assert
        hash1.Should().NotBe(hash2, "BCrypt should generate unique salts");
        passwordService.VerifyPassword(password, hash1).Should().BeTrue();
        passwordService.VerifyPassword(password, hash2).Should().BeTrue();
    }
}