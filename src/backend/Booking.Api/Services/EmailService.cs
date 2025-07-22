using Microsoft.Extensions.Options;

namespace Booking.Api.Services;

public class EmailService(ILogger<EmailService> logger, IOptions<EmailSettings> emailSettings) : IEmailService
{
    private readonly EmailSettings _emailSettings = emailSettings.Value;

    public async Task<bool> SendEmailVerificationAsync(string email, string firstName, string verificationToken)
    {
        try 
        {
            // For now, just log the verification email
            // TODO: Implement actual SMTP sending
            var verificationUrl = $"{_emailSettings.BaseUrl}/verify-email?token={verificationToken}";
            
            logger.LogInformation("Email verification would be sent to {Email}", email);
            logger.LogInformation("Verification URL: {Url}", verificationUrl);
            logger.LogInformation("First Name: {FirstName}", firstName);
            
            await Task.Delay(100); // Simulate async operation
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send verification email to {Email}", email);
            return false;
        }
    }

    public async Task<bool> SendAdminNotificationAsync(string userEmail, string firstName, string lastName)
    {
        try
        {
            // For now, just log the admin notification
            // TODO: Implement actual SMTP sending
            logger.LogInformation("Admin notification would be sent: New user registered");
            logger.LogInformation("User: {FirstName} {LastName} ({Email})", firstName, lastName, userEmail);
            
            await Task.Delay(100); // Simulate async operation
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send admin notification for user {Email}", userEmail);
            return false;
        }
    }

    public async Task<bool> SendWelcomeEmailAsync(string email, string firstName)
    {
        try
        {
            // For now, just log the welcome email
            // TODO: Implement actual SMTP sending
            logger.LogInformation("Welcome email would be sent to {Email}", email);
            logger.LogInformation("First Name: {FirstName}", firstName);
            
            await Task.Delay(100); // Simulate async operation
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send welcome email to {Email}", email);
            return false;
        }
    }
}

public class EmailSettings
{
    public string BaseUrl { get; set; } = string.Empty;
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
}