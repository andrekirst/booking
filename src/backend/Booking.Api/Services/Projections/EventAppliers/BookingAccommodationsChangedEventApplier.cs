using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Domain.ValueObjects;
using System.Text.Json;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingAccommodationsChangedEventApplier : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingAccommodationsChangedEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingAccommodationsChangedEvent accommodationsEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingAccommodationsChangedEvent)}, got {domainEvent.GetType().Name}");
        }

        // Parse current booking items from JSON
        List<BookingItem> currentBookingItems;
        if (!string.IsNullOrEmpty(readModel.BookingItemsJson))
        {
            currentBookingItems = JsonSerializer.Deserialize<List<BookingItem>>(readModel.BookingItemsJson) ?? new List<BookingItem>();
        }
        else
        {
            currentBookingItems = new List<BookingItem>();
        }

        // Apply accommodation changes
        foreach (var change in accommodationsEvent.AccommodationChanges)
        {
            var existingItem = currentBookingItems.FirstOrDefault(bi => bi.SleepingAccommodationId == change.SleepingAccommodationId);
            
            switch (change.ChangeType)
            {
                case ChangeType.Added:
                    if (existingItem == null)
                    {
                        currentBookingItems.Add(new BookingItem(change.SleepingAccommodationId, change.NewPersonCount));
                    }
                    else
                    {
                        existingItem.PersonCount = change.NewPersonCount;
                    }
                    break;
                    
                case ChangeType.Modified:
                    if (existingItem != null)
                    {
                        existingItem.PersonCount = change.NewPersonCount;
                    }
                    break;
                    
                case ChangeType.Removed:
                    if (existingItem != null)
                    {
                        currentBookingItems.Remove(existingItem);
                    }
                    break;
            }
        }

        // Update read model
        readModel.BookingItemsJson = JsonSerializer.Serialize(currentBookingItems);
        readModel.TotalPersons = accommodationsEvent.NewTotalPersons;
        readModel.ChangedAt = accommodationsEvent.OccurredAt;
    }
}