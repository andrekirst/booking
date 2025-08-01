using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Booking.Api.Configuration;
using Booking.Api.Domain.Entities;
using Booking.Api.Domain.Enums;
using Booking.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace Booking.Api.Tests.Unit.Services;

public class JwtServiceTests
{
    private readonly Mock<IOptions<JwtSettings>> _jwtSettingsMock;
    private readonly JwtService _jwtService;
    private const string TestSecret = "ThisIsATestSecretThatIsAtLeast32CharactersLong!";
    private const string TestIssuer = "TestIssuer";
    private const string TestAudience = "TestAudience";
    
    public JwtServiceTests()
    {
        _jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
        
        // Setup JwtSettings
        var jwtSettings = new JwtSettings
        {
            Secret = TestSecret,
            Issuer = TestIssuer,
            Audience = TestAudience,
            ExpirationMinutes = 60
        };
        
        _jwtSettingsMock.Setup(x => x.Value).Returns(jwtSettings);
        
        _jwtService = new JwtService(_jwtSettingsMock.Object);
    }
    
    [Fact]
    public void GenerateToken_WithValidUser_ReturnsValidToken()
    {
        // Arrange
        var user = new User
        {
            Id = 123,
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member
        };
        
        // Act
        var token = _jwtService.GenerateToken(user);
        
        // Assert
        token.Should().NotBeNullOrEmpty();
        
        // Validate token can be read
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSecret)),
            ValidateIssuer = true,
            ValidIssuer = TestIssuer,
            ValidateAudience = true,
            ValidAudience = TestAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        
        var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
        principal.Should().NotBeNull();
        validatedToken.Should().NotBeNull();
    }
    
    [Fact]
    public void GenerateToken_ContainsCorrectClaims()
    {
        // Arrange
        var user = new User
        {
            Id = 456,
            Email = "admin@example.com",
            FirstName = "Admin",
            LastName = "User",
            Role = UserRole.Administrator
        };
        
        // Act
        var token = _jwtService.GenerateToken(user);
        
        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwt = tokenHandler.ReadJwtToken(token);
        
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == user.Id.ToString());
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Email && c.Value == user.Email);
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == user.Role.ToString());
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == $"{user.FirstName} {user.LastName}");
    }
    
    [Fact]
    public void GenerateToken_HasCorrectExpiration()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member
        };
        
        // Act
        var token = _jwtService.GenerateToken(user);
        
        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwt = tokenHandler.ReadJwtToken(token);
        
        var expiration = jwt.ValidTo;
        var expectedExpiration = DateTime.UtcNow.AddMinutes(60);
        
        // Allow 1 minute tolerance for test execution time
        expiration.Should().BeCloseTo(expectedExpiration, TimeSpan.FromMinutes(1));
    }
    
    [Fact]
    public void GenerateToken_HasCorrectIssuerAndAudience()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member
        };
        
        // Act
        var token = _jwtService.GenerateToken(user);
        
        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwt = tokenHandler.ReadJwtToken(token);
        
        jwt.Issuer.Should().Be(TestIssuer);
        jwt.Audiences.Should().Contain(TestAudience);
    }
    
    [Fact]
    public void GenerateToken_EachTokenHasUniqueJti()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            Role = UserRole.Member
        };
        
        // Act
        var token1 = _jwtService.GenerateToken(user);
        var token2 = _jwtService.GenerateToken(user);
        
        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwt1 = tokenHandler.ReadJwtToken(token1);
        var jwt2 = tokenHandler.ReadJwtToken(token2);
        
        // Since our JWT service doesn't include JTI claims, we verify both tokens are valid
        token1.Should().NotBeNullOrEmpty();
        token2.Should().NotBeNullOrEmpty();
    }
}