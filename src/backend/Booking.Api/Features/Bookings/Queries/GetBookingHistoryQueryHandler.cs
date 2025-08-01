using Booking.Api.Application.Common.Interfaces;
using Booking.Api.Data;
using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Services.EventSourcing;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.Bookings.Queries;

public class GetBookingHistoryQueryHandler(
    BookingDbContext context,
    IEventSerializer eventSerializer) : IQueryHandler<GetBookingHistoryQuery, BookingHistoryDto>
{
    public async Task<BookingHistoryDto> Handle(GetBookingHistoryQuery request, CancellationToken cancellationToken)
    {
        // Verify booking exists and get basic info
        var bookingExists = await context.EventStoreEvents
            .AnyAsync(e => e.AggregateId == request.BookingId && e.AggregateType == "BookingAggregate", cancellationToken);

        if (!bookingExists)
        {
            throw new KeyNotFoundException($"Booking with ID {request.BookingId} not found");
        }

        // Get events with pagination (most recent first)
        var skip = (request.Page - 1) * request.PageSize;
        var eventStoreEvents = await context.EventStoreEvents
            .Where(e => e.AggregateId == request.BookingId && e.AggregateType == "BookingAggregate")
            .OrderByDescending(e => e.Version) // Most recent first
            .Skip(skip)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var historyEntries = new List<BookingHistoryEntryDto>();
        BookingStatus? previousStatus = null;

        // Process events in reverse order to track status changes correctly
        var eventsInOrder = eventStoreEvents.OrderBy(e => e.Version).ToList();
        
        foreach (var eventStoreEvent in eventsInOrder)
        {
            try
            {
                var domainEvent = eventSerializer.DeserializeEvent(eventStoreEvent.EventData, eventStoreEvent.EventType);
                var historyEntry = CreateHistoryEntry(eventStoreEvent, domainEvent, previousStatus);
                
                historyEntries.Add(historyEntry);
                
                // Update previous status for next iteration
                if (historyEntry.StatusAfter.HasValue)
                {
                    previousStatus = historyEntry.StatusAfter;
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the entire request
                // Add a fallback entry for unparseable events
                historyEntries.Add(new BookingHistoryEntryDto
                {
                    EventId = eventStoreEvent.Id,
                    EventType = eventStoreEvent.EventType,
                    Timestamp = eventStoreEvent.Timestamp,
                    Version = eventStoreEvent.Version,
                    Description = "Ereignis konnte nicht verarbeitet werden",
                    Details = $"Fehler beim Deserialisieren: {ex.Message}",
                });
            }
        }

        // Return in descending order (most recent first)
        historyEntries.Reverse();

        return new BookingHistoryDto
        {
            BookingId = request.BookingId,
            History = historyEntries
        };
    }

    private static BookingHistoryEntryDto CreateHistoryEntry(
        Domain.Entities.EventStoreEvent eventStoreEvent, 
        DomainEvent domainEvent, 
        BookingStatus? previousStatus)
    {
        var entry = new BookingHistoryEntryDto
        {
            EventId = eventStoreEvent.Id,
            EventType = eventStoreEvent.EventType,
            Timestamp = eventStoreEvent.Timestamp,
            Version = eventStoreEvent.Version,
            StatusBefore = previousStatus
        };

        // Map event-specific information
        switch (domainEvent)
        {
            case BookingCreatedEvent createdEvent:
                entry.Description = "Buchung erstellt";
                entry.Details = $"Buchung für {createdEvent.BookingItems.Sum(x => x.PersonCount)} Person(en) vom {createdEvent.StartDate:dd.MM.yyyy} bis {createdEvent.EndDate:dd.MM.yyyy}";
                entry.StatusAfter = createdEvent.Status;
                entry.Changes = new Dictionary<string, object>
                {
                    ["startDate"] = createdEvent.StartDate,
                    ["endDate"] = createdEvent.EndDate,
                    ["totalPersons"] = createdEvent.BookingItems.Sum(x => x.PersonCount),
                    ["accommodationCount"] = createdEvent.BookingItems.Count,
                    ["notes"] = createdEvent.Notes ?? string.Empty
                };
                break;

            case BookingUpdatedEvent updatedEvent:
                entry.Description = "Buchung aktualisiert";
                entry.Details = $"Buchung geändert: {updatedEvent.BookingItems.Sum(x => x.PersonCount)} Person(en) vom {updatedEvent.StartDate:dd.MM.yyyy} bis {updatedEvent.EndDate:dd.MM.yyyy}";
                entry.StatusAfter = previousStatus; // Status doesn't change during update
                entry.Changes = new Dictionary<string, object>
                {
                    ["startDate"] = updatedEvent.StartDate,
                    ["endDate"] = updatedEvent.EndDate,
                    ["totalPersons"] = updatedEvent.BookingItems.Sum(x => x.PersonCount),
                    ["accommodationCount"] = updatedEvent.BookingItems.Count,
                    ["notes"] = updatedEvent.Notes ?? string.Empty
                };
                break;

            case BookingCancelledEvent cancelledEvent:
                entry.Description = "Buchung storniert";
                entry.Details = "Buchung wurde storniert";
                entry.StatusAfter = BookingStatus.Cancelled;
                entry.Changes = new Dictionary<string, object>();
                break;

            case BookingConfirmedEvent:
                entry.Description = "Buchung bestätigt";
                entry.Details = "Buchung wurde vom Administrator bestätigt";
                entry.StatusAfter = BookingStatus.Confirmed;
                break;

            case BookingAcceptedEvent:
                entry.Description = "Buchung genehmigt";
                entry.Details = "Buchung wurde vom Administrator genehmigt";
                entry.StatusAfter = BookingStatus.Accepted;
                break;

            case BookingRejectedEvent rejectedEvent:
                entry.Description = "Buchung abgelehnt";
                entry.Details = "Buchung wurde vom Administrator abgelehnt";
                entry.StatusAfter = BookingStatus.Rejected;
                entry.Changes = new Dictionary<string, object>();
                break;

            default:
                entry.Description = $"Unbekanntes Ereignis: {domainEvent.EventType}";
                entry.Details = "Details nicht verfügbar";
                break;
        }

        return entry;
    }
}