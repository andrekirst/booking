namespace Booking.Api.Domain.Entities;

public class EmailSettings
{
    public int Id { get; set; }
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty; // Will be encrypted
    public string FromName { get; set; } = "Booking System";
    public string FromEmail { get; set; } = string.Empty;
    public bool UseTls { get; set; } = true;
    public bool IsConfigured { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}