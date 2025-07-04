using System.ComponentModel.DataAnnotations;

namespace Booking.Api.Models;

public class Booking
{
    public int Id { get; set; }
    
    [Required]
    public string CustomerName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string CustomerEmail { get; set; } = string.Empty;
    
    [Required]
    public string ServiceType { get; set; } = string.Empty;
    
    [Required]
    public DateTime BookingDate { get; set; }
    
    [Required]
    public DateTime StartTime { get; set; }
    
    [Required]
    public DateTime EndTime { get; set; }
    
    public string? Notes { get; set; }
    
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
}

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled,
    Completed
}
