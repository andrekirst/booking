using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ValueObjects;

namespace Booking.Api.Domain.ReadModels;

public class BookingReadModel
{
    public Guid Id { get; set; }
    public int UserId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public BookingStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ChangedAt { get; set; }
    public int LastEventVersion { get; set; }
    
    // JSON serialized BookingItems for read model
    public string BookingItemsJson { get; set; } = "[]";
    
    // Navigation properties for easier querying
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    
    // Computed properties
    public int TotalPersons { get; set; }
    public int NumberOfNights => (EndDate - StartDate).Days;
}