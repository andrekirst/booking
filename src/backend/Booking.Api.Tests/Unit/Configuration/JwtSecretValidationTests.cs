using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace Booking.Api.Tests.Unit.Configuration;

public class JwtSecretValidationTests
{
    [Fact]
    public void Program_ShouldValidateJwtSecretIsNotEmpty()
    {
        // This test verifies that our Program.cs contains the JWT secret validation logic
        // The actual runtime validation is tested in the integration tests
        
        // Arrange
        var programFile = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "../../../../Booking.Api/Program.cs"));
        
        // Assert
        programFile.Should().Contain("if (string.IsNullOrEmpty(secret))");
        programFile.Should().Contain("JWT Secret is not configured");
        programFile.Should().Contain("InvalidOperationException");
    }
}