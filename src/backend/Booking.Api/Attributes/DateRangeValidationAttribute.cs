using System.ComponentModel.DataAnnotations;

namespace Booking.Api.Attributes;

/// <summary>
/// Validates that a date range follows the business rules for booking dates
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct)]
public class DateRangeValidationAttribute : ValidationAttribute
{
    public string StartDatePropertyName { get; set; } = "StartDate";
    public string EndDatePropertyName { get; set; } = "EndDate";
    public bool AllowSameDay { get; set; } = true;
    public bool AllowToday { get; set; } = true;

    public override bool IsValid(object? value)
    {
        if (value == null) return true;

        var startDateProperty = value.GetType().GetProperty(StartDatePropertyName);
        var endDateProperty = value.GetType().GetProperty(EndDatePropertyName);

        if (startDateProperty == null || endDateProperty == null)
        {
            return false;
        }

        if (startDateProperty.GetValue(value) is not DateTime startDate ||
            endDateProperty.GetValue(value) is not DateTime endDate)
        {
            return false;
        }

        // Validate date range rules
        var validationResult = ValidateDateRange(startDate, endDate);
        if (!validationResult.IsValid)
        {
            ErrorMessage = validationResult.ErrorMessage;
            return false;
        }

        return true;
    }

    public static (bool IsValid, string? ErrorMessage) ValidateDateRange(DateTime startDate, DateTime endDate, bool allowSameDay = true, bool allowToday = true)
    {
        var today = DateTime.UtcNow.Date;

        // Rule 1: Start date cannot be in the past (unless today is allowed)
        if (!allowToday && startDate.Date < today)
        {
            return (false, "Das Anreisedatum kann nicht in der Vergangenheit liegen");
        }
        
        if (allowToday && startDate.Date < today)
        {
            return (false, "Das Anreisedatum kann nicht vor heute liegen");
        }

        // Rule 2: End date must be after start date (or same day if allowed)
        if (allowSameDay)
        {
            if (endDate.Date < startDate.Date)
            {
                return (false, "Das Abreisedatum muss nach dem Anreisedatum liegen");
            }
        }
        else
        {
            if (endDate.Date <= startDate.Date)
            {
                return (false, "Das Abreisedatum muss nach dem Anreisedatum liegen");
            }
        }

        // Rule 3: Maximum booking duration (configurable, default 30 days)
        var maxBookingDays = 30;
        var totalDays = (endDate.Date - startDate.Date).Days;
        if (totalDays > maxBookingDays)
        {
            return (false, $"Die maximale Buchungsdauer beträgt {maxBookingDays} Tage");
        }

        // Rule 4: Minimum booking duration (1 night for overnight stays)
        if (!allowSameDay && totalDays < 1)
        {
            return (false, "Eine Buchung muss mindestens eine Nacht umfassen");
        }

        return (true, null);
    }

    public override string FormatErrorMessage(string name)
    {
        return ErrorMessage ?? "Ungültiger Datumsbereich";
    }
}