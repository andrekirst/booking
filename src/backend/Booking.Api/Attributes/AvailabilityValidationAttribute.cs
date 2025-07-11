using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.DependencyInjection;
using Booking.Api.Features.Bookings.Queries;
using MediatR;

namespace Booking.Api.Attributes;

/// <summary>
/// Validates that the requested dates have available accommodation capacity
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct)]
public class AvailabilityValidationAttribute : ValidationAttribute
{
    public string StartDatePropertyName { get; set; } = "StartDate";
    public string EndDatePropertyName { get; set; } = "EndDate";
    public string BookingItemsPropertyName { get; set; } = "BookingItems";

    public override bool IsValid(object? value)
    {
        // Note: This attribute provides the validation interface
        // Actual validation is performed asynchronously in the controller/handler
        // because ValidationAttribute doesn't support async operations
        return true;
    }

    /// <summary>
    /// Performs async availability validation
    /// </summary>
    public static async Task<(bool IsValid, string? ErrorMessage)> ValidateAvailabilityAsync(
        DateTime startDate, 
        DateTime endDate, 
        IEnumerable<object> bookingItems,
        IMediator mediator,
        string? excludeBookingId = null)
    {
        try
        {
            var query = new CheckAvailabilityQuery(startDate, endDate, excludeBookingId);
            var availability = await mediator.Send(query);

            // Check if any requested accommodation is fully booked
            var requestedAccommodations = ExtractAccommodationRequests(bookingItems);
            
            foreach (var request in requestedAccommodations)
            {
                var accommodationAvailability = availability.Accommodations
                    .FirstOrDefault(a => a.Id == request.AccommodationId);

                if (accommodationAvailability == null)
                {
                    return (false, $"Schlafmöglichkeit mit ID {request.AccommodationId} nicht gefunden");
                }

                if (!accommodationAvailability.IsAvailable)
                {
                    return (false, $"Schlafmöglichkeit '{accommodationAvailability.Name}' ist für den gewählten Zeitraum nicht verfügbar");
                }

                if (request.PersonCount > accommodationAvailability.AvailableCapacity)
                {
                    return (false, $"Schlafmöglichkeit '{accommodationAvailability.Name}' hat nur {accommodationAvailability.AvailableCapacity} freie Plätze, {request.PersonCount} wurden angefragt");
                }
            }

            return (true, null);
        }
        catch (Exception ex)
        {
            // Log the exception in a real scenario
            return (false, "Verfügbarkeitsprüfung fehlgeschlagen. Bitte versuchen Sie es später erneut.");
        }
    }

    private static IEnumerable<(string AccommodationId, int PersonCount)> ExtractAccommodationRequests(IEnumerable<object> bookingItems)
    {
        var requests = new List<(string, int)>();

        foreach (var item in bookingItems)
        {
            var accommodationIdProperty = item.GetType().GetProperty("SleepingAccommodationId");
            var personCountProperty = item.GetType().GetProperty("PersonCount");

            if (accommodationIdProperty?.GetValue(item) is string accommodationId &&
                personCountProperty?.GetValue(item) is int personCount)
            {
                requests.Add((accommodationId, personCount));
            }
        }

        return requests;
    }

    public override string FormatErrorMessage(string name)
    {
        return "Die angeforderten Schlafmöglichkeiten sind für den gewählten Zeitraum nicht verfügbar";
    }
}