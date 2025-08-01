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

        // If no events exist, create synthetic activities from ReadModel data
        if (!events.Any())
        {
            var booking = await context.BookingReadModels
                .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

            if (booking != null)
            {
                // Create a basic activity based on current booking status
                var statusActivity = booking.Status switch
                {
                    Domain.Enums.BookingStatus.Pending => new BookingActivityDto(
                        ActivityType: "BookingCreated",
                        Description: "Buchung wurde erstellt",
                        Timestamp: booking.CreatedAt,
                        UserName: await GetUserNameAsync(booking.UserId, userCache, cancellationToken),
                        Metadata: new Dictionary<string, object>
                        {
                            ["StartDate"] = booking.StartDate,
                            ["EndDate"] = booking.EndDate,
                            ["TotalPersons"] = booking.TotalPersons,
                            ["NumberOfNights"] = booking.NumberOfNights
                        }
                    ),
                    Domain.Enums.BookingStatus.Confirmed => new BookingActivityDto(
                        ActivityType: "BookingConfirmed",
                        Description: "Buchung wurde bestätigt",
                        Timestamp: booking.ChangedAt ?? booking.CreatedAt,
                        UserName: "Administrator",
                        Metadata: null
                    ),
                    Domain.Enums.BookingStatus.Cancelled => new BookingActivityDto(
                        ActivityType: "BookingCancelled",
                        Description: "Buchung wurde storniert",
                        Timestamp: booking.ChangedAt ?? booking.CreatedAt,
                        UserName: "System",
                        Metadata: null
                    ),
                    Domain.Enums.BookingStatus.Completed => new BookingActivityDto(
                        ActivityType: "BookingCompleted",
                        Description: "Buchung wurde abgeschlossen",
                        Timestamp: booking.ChangedAt ?? booking.CreatedAt,
                        UserName: "System",
                        Metadata: null
                    ),
                    Domain.Enums.BookingStatus.Accepted => new BookingActivityDto(
                        ActivityType: "BookingAccepted",
                        Description: "Buchung wurde angenommen",
                        Timestamp: booking.ChangedAt ?? booking.CreatedAt,
                        UserName: "Administrator",
                        Metadata: null
                    ),
                    Domain.Enums.BookingStatus.Rejected => new BookingActivityDto(
                        ActivityType: "BookingRejected",
                        Description: "Buchung wurde abgelehnt",
                        Timestamp: booking.ChangedAt ?? booking.CreatedAt,
                        UserName: "Administrator",
                        Metadata: null
                    ),
                    _ => new BookingActivityDto(
                        ActivityType: "BookingCreated",
                        Description: "Buchung wurde erstellt",
                        Timestamp: booking.CreatedAt,
                        UserName: await GetUserNameAsync(booking.UserId, userCache, cancellationToken),
                        Metadata: new Dictionary<string, object>
                        {
                            ["StartDate"] = booking.StartDate,
                            ["EndDate"] = booking.EndDate,
                            ["TotalPersons"] = booking.TotalPersons,
                            ["NumberOfNights"] = booking.NumberOfNights
                        }
                    )
                };

                activities.Add(statusActivity);

                // Add creation activity if status activity is not creation
                if (statusActivity.ActivityType != "BookingCreated")
                {
                    activities.Add(new BookingActivityDto(
                        ActivityType: "BookingCreated",
                        Description: "Buchung wurde erstellt",
                        Timestamp: booking.CreatedAt,
                        UserName: await GetUserNameAsync(booking.UserId, userCache, cancellationToken),
                        Metadata: new Dictionary<string, object>
                        {
                            ["StartDate"] = booking.StartDate,
                            ["EndDate"] = booking.EndDate,
                            ["TotalPersons"] = booking.TotalPersons,
                            ["NumberOfNights"] = booking.NumberOfNights
                        }
                    ));
                }
            }
        }
        else
        {
            // Process events as before
            foreach (var (domainEvent, version) in events)
            {
                var activity = domainEvent switch
                {
                    BookingCreatedEvent createdEvent => new BookingActivityDto(
                        ActivityType: "BookingCreated",
                        Description: "Buchung wurde erstellt",
                        Timestamp: createdEvent.OccurredAt,
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
                        Timestamp: updatedEvent.OccurredAt,
                        UserName: "System", // BookingUpdatedEvent hat keine UserId
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
                        Timestamp: acceptedEvent.OccurredAt,
                        UserName: "Administrator",
                        Metadata: null
                    ),
                    BookingRejectedEvent rejectedEvent => new BookingActivityDto(
                        ActivityType: "BookingRejected",
                        Description: "Buchung wurde abgelehnt",
                        Timestamp: rejectedEvent.OccurredAt,
                        UserName: "Administrator",
                        Metadata: null
                    ),
                    BookingConfirmedEvent confirmedEvent => new BookingActivityDto(
                        ActivityType: "BookingConfirmed",
                        Description: "Buchung wurde bestätigt",
                        Timestamp: confirmedEvent.OccurredAt,
                        UserName: "Administrator",
                        Metadata: null
                    ),
                    BookingCancelledEvent cancelledEvent => new BookingActivityDto(
                        ActivityType: "BookingCancelled",
                        Description: "Buchung wurde storniert",
                        Timestamp: cancelledEvent.OccurredAt,
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