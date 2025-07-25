using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using Booking.Api.Data;
using System.Net.Mail;
using System.Net;

namespace Booking.Api.Services;

public class EmailService(
    ILogger<EmailService> logger, 
    IOptions<EmailSettings> emailSettings,
    BookingDbContext context,
    IEncryptionService encryptionService) : IEmailService
{
    private readonly EmailSettings _emailSettings = emailSettings.Value;

    private async Task<Domain.Entities.EmailSettings?> GetEmailSettingsAsync()
    {
        return await context.EmailSettings
            .Where(e => e.IsConfigured)
            .FirstOrDefaultAsync();
    }

    private async Task<bool> SendEmailAsync(string toEmail, string subject, string body, string? htmlBody = null)
    {
        try
        {
            var settings = await GetEmailSettingsAsync();
            if (settings == null || !settings.IsConfigured)
            {
                logger.LogWarning("E-Mail-Einstellungen sind nicht konfiguriert. E-Mail wird nur geloggt.");
                logger.LogInformation("E-Mail würde gesendet werden an: {Email}", toEmail);
                logger.LogInformation("Betreff: {Subject}", subject);
                logger.LogInformation("Inhalt: {Body}", body);
                return true; // Als Erfolg betrachten für Entwicklungsumgebung
            }

            // Passwort entschlüsseln
            var password = encryptionService.Decrypt(settings.SmtpPassword);

            // SMTP-Client erstellen
            using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
            {
                EnableSsl = settings.UseTls,
                Credentials = new NetworkCredential(settings.SmtpUsername, password)
            };

            // E-Mail-Nachricht erstellen
            var message = new MailMessage
            {
                From = new MailAddress(settings.FromEmail, settings.FromName),
                Subject = subject,
                Body = htmlBody ?? body,
                IsBodyHtml = !string.IsNullOrEmpty(htmlBody)
            };

            message.To.Add(toEmail);

            // E-Mail senden
            await client.SendMailAsync(message);

            logger.LogInformation("E-Mail erfolgreich gesendet an {Email}", toEmail);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fehler beim Senden der E-Mail an {Email}", toEmail);
            return false;
        }
    }

    public async Task<bool> SendEmailVerificationAsync(string email, string firstName, string verificationToken)
    {
        try 
        {
            var verificationUrl = $"{_emailSettings.BaseUrl}/verify-email?token={verificationToken}";
            
            // Log für Debugging (bleibt bestehen wie gewünscht)
            logger.LogInformation("Email verification sent to {Email}", email);
            logger.LogInformation("Verification URL: {Url}", verificationUrl);
            logger.LogInformation("First Name: {FirstName}", firstName);
            
            var subject = "E-Mail-Adresse bestätigen - Booking System";
            var body = CreateVerificationEmailBody(firstName, verificationUrl);
            var htmlBody = CreateVerificationEmailHtmlBody(firstName, verificationUrl);
            
            return await SendEmailAsync(email, subject, body, htmlBody);
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
            // Log für Debugging 
            logger.LogInformation("Admin notification sent: New user registered");
            logger.LogInformation("User: {FirstName} {LastName} ({Email})", firstName, lastName, userEmail);
            
            var subject = "Neue Benutzerregistrierung - Booking System";
            var body = CreateAdminNotificationEmailBody(userEmail, firstName, lastName);
            var htmlBody = CreateAdminNotificationEmailHtmlBody(userEmail, firstName, lastName);
            
            // Admin-E-Mail an konfigurierte From-Adresse senden (oder separate Admin-E-Mail falls konfiguriert)
            var settings = await GetEmailSettingsAsync();
            var adminEmail = settings?.FromEmail ?? _emailSettings.FromEmail;
            
            if (string.IsNullOrEmpty(adminEmail))
            {
                logger.LogWarning("Keine Admin-E-Mail-Adresse konfiguriert für Benachrichtigungen");
                return true; // Als Erfolg betrachten
            }
            
            return await SendEmailAsync(adminEmail, subject, body, htmlBody);
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
            // Log für Debugging
            logger.LogInformation("Welcome email sent to {Email}", email);
            logger.LogInformation("First Name: {FirstName}", firstName);
            
            var subject = "Willkommen im Booking System!";
            var body = CreateWelcomeEmailBody(firstName);
            var htmlBody = CreateWelcomeEmailHtmlBody(firstName);
            
            return await SendEmailAsync(email, subject, body, htmlBody);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send welcome email to {Email}", email);
            return false;
        }
    }

    #region Email Templates

    private static string CreateVerificationEmailBody(string firstName, string verificationUrl)
    {
        return $@"Hallo {firstName},

vielen Dank für Ihre Registrierung beim Booking System!

Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:
{verificationUrl}

Der Link ist 24 Stunden gültig.

Falls Sie sich nicht registriert haben, können Sie diese E-Mail ignorieren.

Mit freundlichen Grüßen
Ihr Booking System Team";
    }

    private static string CreateVerificationEmailHtmlBody(string firstName, string verificationUrl)
    {
        return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #007bff; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ padding: 20px; text-align: center; color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>E-Mail-Adresse bestätigen</h1>
        </div>
        <div class='content'>
            <p>Hallo {firstName},</p>
            <p>vielen Dank für Ihre Registrierung beim Booking System!</p>
            <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Button klicken:</p>
            <p style='text-align: center;'>
                <a href='{verificationUrl}' class='button'>E-Mail-Adresse bestätigen</a>
            </p>
            <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
            <p style='word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;'>{verificationUrl}</p>
            <p><strong>Der Link ist 24 Stunden gültig.</strong></p>
            <p>Falls Sie sich nicht registriert haben, können Sie diese E-Mail ignorieren.</p>
        </div>
        <div class='footer'>
            <p>Mit freundlichen Grüßen<br>Ihr Booking System Team</p>
        </div>
    </div>
</body>
</html>";
    }

    private static string CreateAdminNotificationEmailBody(string userEmail, string firstName, string lastName)
    {
        return $@"Neue Benutzerregistrierung im Booking System

Ein neuer Benutzer hat sich registriert und wartet auf Freigabe:

Name: {firstName} {lastName}
E-Mail: {userEmail}
Registrierungsdatum: {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC

Bitte loggen Sie sich in das Admin-Panel ein, um den Benutzer freizugeben.

Booking System";
    }

    private static string CreateAdminNotificationEmailHtmlBody(string userEmail, string firstName, string lastName)
    {
        return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #dc3545; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .user-info {{ background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }}
        .footer {{ padding: 20px; text-align: center; color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Neue Benutzerregistrierung</h1>
        </div>
        <div class='content'>
            <p>Ein neuer Benutzer hat sich registriert und wartet auf Freigabe:</p>
            <div class='user-info'>
                <p><strong>Name:</strong> {firstName} {lastName}</p>
                <p><strong>E-Mail:</strong> {userEmail}</p>
                <p><strong>Registrierungsdatum:</strong> {DateTime.UtcNow:dd.MM.yyyy HH:mm} UTC</p>
            </div>
            <p>Bitte loggen Sie sich in das Admin-Panel ein, um den Benutzer freizugeben.</p>
        </div>
        <div class='footer'>
            <p>Booking System</p>
        </div>
    </div>
</body>
</html>";
    }

    private static string CreateWelcomeEmailBody(string firstName)
    {
        return $@"Hallo {firstName},

herzlich willkommen im Booking System!

Ihre E-Mail-Adresse wurde erfolgreich bestätigt und Ihr Konto wurde freigeschaltet.

Sie können sich jetzt anmelden und das System nutzen.

Wir freuen uns, Sie als neuen Benutzer begrüßen zu dürfen!

Mit freundlichen Grüßen
Ihr Booking System Team";
    }

    private static string CreateWelcomeEmailHtmlBody(string firstName)
    {
        return $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #28a745; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .footer {{ padding: 20px; text-align: center; color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Willkommen!</h1>
        </div>
        <div class='content'>
            <p>Hallo {firstName},</p>
            <p>herzlich willkommen im Booking System!</p>
            <p>Ihre E-Mail-Adresse wurde erfolgreich bestätigt und Ihr Konto wurde freigeschaltet.</p>
            <p>Sie können sich jetzt anmelden und das System nutzen.</p>
            <p><strong>Wir freuen uns, Sie als neuen Benutzer begrüßen zu dürfen!</strong></p>
        </div>
        <div class='footer'>
            <p>Mit freundlichen Grüßen<br>Ihr Booking System Team</p>
        </div>
    </div>
</body>
</html>";
    }

    #endregion
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