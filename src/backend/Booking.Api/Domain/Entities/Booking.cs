using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.ValueObjects;

namespace Booking.Api.Domain.Entities;

public class Booking : IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ChangedAt { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public List<BookingItem> BookingItems { get; set; } = new();
    
    public void AddBookingItem(Guid sleepingAccommodationId, int personCount)
    {
        var existingItem = BookingItems.FirstOrDefault(x => x.SleepingAccommodationId == sleepingAccommodationId);
        if (existingItem != null)
        {
            throw new InvalidOperationException($"Sleeping accommodation {sleepingAccommodationId} is already booked");
        }
        
        BookingItems.Add(new BookingItem(sleepingAccommodationId, personCount));
    }
    
    public void RemoveBookingItem(Guid sleepingAccommodationId)
    {
        var item = BookingItems.FirstOrDefault(x => x.SleepingAccommodationId == sleepingAccommodationId);
        if (item != null)
        {
            BookingItems.Remove(item);
        }
    }
    
    public void UpdateBookingItemPersonCount(Guid sleepingAccommodationId, int personCount)
    {
        var item = BookingItems.FirstOrDefault(x => x.SleepingAccommodationId == sleepingAccommodationId);
        if (item == null)
        {
            throw new InvalidOperationException($"Booking item for sleeping accommodation {sleepingAccommodationId} not found");
        }
        
        if (personCount <= 0)
        {
            throw new ArgumentException("Person count must be greater than zero", nameof(personCount));
        }
        
        item.PersonCount = personCount;
    }
    
    public int GetTotalPersonCount()
    {
        return BookingItems.Sum(x => x.PersonCount);
    }
}