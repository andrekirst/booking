using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Booking.Api.Services.Projections.EventAppliers;

public class BookingCreatedEventApplier(BookingDbContext context) : IEventApplier<BookingReadModel>
{
    public Type EventType => typeof(BookingCreatedEvent);

    public void Apply(BookingReadModel readModel, DomainEvent domainEvent)
    {
        if (domainEvent is not BookingCreatedEvent bookingEvent)
        {
            throw new ArgumentException($"Expected {nameof(BookingCreatedEvent)}, got {domainEvent.GetType().Name}");
        }

        // Get user information for the read model
        var user = context.Users.AsNoTracking()
            .FirstOrDefault(u => u.Id == bookingEvent.UserId);

        readModel.Id = bookingEvent.BookingId;
        readModel.UserId = bookingEvent.UserId;
        readModel.StartDate = bookingEvent.StartDate;
        readModel.EndDate = bookingEvent.EndDate;
        readModel.Status = bookingEvent.Status;
        readModel.Notes = bookingEvent.Notes;
        readModel.CreatedAt = bookingEvent.OccurredAt;
        readModel.ChangedAt = null;
        readModel.BookingItemsJson = JsonSerializer.Serialize(bookingEvent.BookingItems);
        readModel.TotalPersons = bookingEvent.BookingItems.Sum(bi => bi.PersonCount);
        
        // Set user information
        readModel.UserName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown User";
        readModel.UserEmail = user?.Email ?? "unknown@example.com";
    }
}