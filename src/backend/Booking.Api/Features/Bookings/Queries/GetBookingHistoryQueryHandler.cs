using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Services.EventSourcing;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.Bookings.Queries;

public class GetBookingHistoryQueryHandler(
    IEventStore eventStore,
    BookingDbContext context) : IRequestHandler<GetBookingHistoryQuery, List<BookingActivityDto>>
{
    public async Task<List<BookingActivityDto>> Handle(GetBookingHistoryQuery request, CancellationToken cancellationToken)
    {
        var events = await eventStore.GetEventsAsync(request.BookingId, 0, cancellationToken);
        var activities = new List<BookingActivityDto>();

        // Get user names for activities that need them
        var userCache = new Dictionary<int, string>();

        foreach (var (domainEvent, version) in events)
        {
            var activity = domainEvent switch
            {
                BookingCreatedEvent createdEvent => new BookingActivityDto(
                    ActivityType: "BookingCreated",
                    Description: "Buchung wurde erstellt",
                    Timestamp: createdEvent.OccurredOn,
                    UserName: await GetUserNameAsync(createdEvent.UserId, userCache, cancellationToken),
                    Metadata: new Dictionary<string, object>
                    {
                        ["StartDate"] = createdEvent.StartDate,
                        ["EndDate"] = createdEvent.EndDate,
                        ["TotalPersons"] = createdEvent.BookingItems.Sum(x => x.PersonCount),
                        ["AccommodationCount"] = createdEvent.BookingItems.Count
                    }
                ),
                BookingUpdatedEvent updatedEvent => new BookingActivityDto(
                    ActivityType: "BookingUpdated",
                    Description: "Buchung wurde geändert",
                    Timestamp: updatedEvent.OccurredOn,
                    UserName: await GetUserNameAsync(updatedEvent.UserId, userCache, cancellationToken),
                    Metadata: new Dictionary<string, object>
                    {
                        ["StartDate"] = updatedEvent.StartDate,
                        ["EndDate"] = updatedEvent.EndDate,
                        ["TotalPersons"] = updatedEvent.BookingItems.Sum(x => x.PersonCount),
                        ["AccommodationCount"] = updatedEvent.BookingItems.Count
                    }
                ),
                BookingAcceptedEvent acceptedEvent => new BookingActivityDto(
                    ActivityType: "BookingAccepted",
                    Description: "Buchung wurde angenommen",
                    Timestamp: acceptedEvent.OccurredOn,
                    UserName: "Administrator",
                    Metadata: null
                ),
                BookingRejectedEvent rejectedEvent => new BookingActivityDto(
                    ActivityType: "BookingRejected",
                    Description: "Buchung wurde abgelehnt",
                    Timestamp: rejectedEvent.OccurredOn,
                    UserName: "Administrator",
                    Metadata: null
                ),
                BookingConfirmedEvent confirmedEvent => new BookingActivityDto(
                    ActivityType: "BookingConfirmed",
                    Description: "Buchung wurde bestätigt",
                    Timestamp: confirmedEvent.OccurredOn,
                    UserName: "Administrator",
                    Metadata: null
                ),
                BookingCancelledEvent cancelledEvent => new BookingActivityDto(
                    ActivityType: "BookingCancelled",
                    Description: "Buchung wurde storniert",
                    Timestamp: cancelledEvent.OccurredOn,
                    UserName: "System",
                    Metadata: null
                ),
                _ => null
            };

            if (activity != null)
            {
                activities.Add(activity);
            }
        }

        return activities.OrderByDescending(a => a.Timestamp).ToList();
    }

    private async Task<string> GetUserNameAsync(int userId, Dictionary<int, string> cache, CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(userId, out var cachedName))
        {
            return cachedName;
        }

        var user = await context.Users
            .Where(u => u.Id == userId)
            .Select(u => new { u.FirstName, u.LastName })
            .FirstOrDefaultAsync(cancellationToken);

        var name = user != null ? $"{user.FirstName} {user.LastName}" : "Unbekannter Benutzer";
        cache[userId] = name;
        
        return name;
    }
}