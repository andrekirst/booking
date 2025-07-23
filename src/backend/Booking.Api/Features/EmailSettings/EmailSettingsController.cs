using Booking.Api.Data;
using Booking.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace Booking.Api.Features.EmailSettings;

[ApiController]
[Route("api/admin/email-settings")]
[Authorize(Roles = "Administrator")]
public class EmailSettingsController(
    BookingDbContext context,
    IEncryptionService encryptionService,
    ILogger<EmailSettingsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<EmailSettingsDto>> GetEmailSettings()
    {
        var settings = await context.EmailSettings.FirstOrDefaultAsync();
        
        if (settings == null)
        {
            // Return default settings if none exist
            return Ok(new EmailSettingsDto
            {
                SmtpHost = "",
                SmtpPort = 587,
                SmtpUsername = "",
                SmtpPassword = "",
                FromName = "Booking System",
                FromEmail = "",
                UseTls = true,
                IsConfigured = false
            });
        }
        
        // Decrypt password for display (masked)
        return Ok(new EmailSettingsDto
        {
            SmtpHost = settings.SmtpHost,
            SmtpPort = settings.SmtpPort,
            SmtpUsername = settings.SmtpUsername,
            SmtpPassword = string.IsNullOrEmpty(settings.SmtpPassword) ? "" : "********", // Mask password
            FromName = settings.FromName,
            FromEmail = settings.FromEmail,
            UseTls = settings.UseTls,
            IsConfigured = settings.IsConfigured
        });
    }
    
    [HttpPut]
    public async Task<ActionResult<EmailSettingsResponse>> UpdateEmailSettings([FromBody] UpdateEmailSettingsRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        var settings = await context.EmailSettings.FirstOrDefaultAsync();
        
        if (settings == null)
        {
            // Create new settings
            settings = new Domain.Entities.EmailSettings
            {
                CreatedAt = DateTime.UtcNow
            };
            context.EmailSettings.Add(settings);
        }
        
        // Update settings
        settings.SmtpHost = request.SmtpHost;
        settings.SmtpPort = request.SmtpPort;
        settings.SmtpUsername = request.SmtpUsername;
        
        // Only update password if a new one is provided (not masked)
        if (!string.IsNullOrEmpty(request.SmtpPassword) && request.SmtpPassword != "********")
        {
            settings.SmtpPassword = encryptionService.Encrypt(request.SmtpPassword);
        }
        
        settings.FromName = request.FromName;
        settings.FromEmail = request.FromEmail;
        settings.UseTls = request.UseTls;
        settings.IsConfigured = true;
        settings.UpdatedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync();
        
        logger.LogInformation("Email settings updated successfully");
        
        return Ok(new EmailSettingsResponse
        {
            Message = "E-Mail-Einstellungen wurden erfolgreich gespeichert.",
            Settings = new EmailSettingsDto
            {
                SmtpHost = settings.SmtpHost,
                SmtpPort = settings.SmtpPort,
                SmtpUsername = settings.SmtpUsername,
                SmtpPassword = "********", // Always mask in response
                FromName = settings.FromName,
                FromEmail = settings.FromEmail,
                UseTls = settings.UseTls,
                IsConfigured = settings.IsConfigured
            }
        });
    }
    
    [HttpPost("test")]
    public async Task<ActionResult<TestEmailResponse>> TestEmailSettings([FromBody] TestEmailRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        var settings = await context.EmailSettings.FirstOrDefaultAsync();
        
        if (settings == null || !settings.IsConfigured)
        {
            return BadRequest(new TestEmailResponse
            {
                Message = "E-Mail-Einstellungen müssen erst konfiguriert werden.",
                Success = false
            });
        }
        
        try
        {
            // Decrypt password
            var password = encryptionService.Decrypt(settings.SmtpPassword);
            
            // Create SMTP client
            using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
            {
                EnableSsl = settings.UseTls,
                Credentials = new NetworkCredential(settings.SmtpUsername, password)
            };
            
            // Create test email
            var message = new MailMessage
            {
                From = new MailAddress(settings.FromEmail, settings.FromName),
                Subject = request.Subject ?? "Test E-Mail vom Booking System",
                Body = request.Body ?? "Dies ist eine Test-E-Mail zur Überprüfung der E-Mail-Konfiguration.",
                IsBodyHtml = false
            };
            
            message.To.Add(request.ToEmail);
            
            // Send email
            await client.SendMailAsync(message);
            
            logger.LogInformation("Test email sent successfully to {Email}", request.ToEmail);
            
            return Ok(new TestEmailResponse
            {
                Message = $"Test-E-Mail wurde erfolgreich an {request.ToEmail} gesendet.",
                Success = true
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send test email");
            
            return BadRequest(new TestEmailResponse
            {
                Message = $"Fehler beim Senden der Test-E-Mail: {ex.Message}",
                Success = false
            });
        }
    }
}