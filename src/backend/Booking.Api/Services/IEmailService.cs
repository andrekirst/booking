namespace Booking.Api.Services;

public interface IEmailService
{
    Task<bool> SendEmailVerificationAsync(string email, string firstName, string verificationToken);
    Task<bool> SendAdminNotificationAsync(string userEmail, string firstName, string lastName);
    Task<bool> SendWelcomeEmailAsync(string email, string firstName);
}