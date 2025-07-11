using System.ComponentModel.DataAnnotations;

namespace Booking.Api.Attributes;

/// <summary>
/// Validates that a date is not in the past
/// </summary>
public class FutureDateAttribute : ValidationAttribute
{
    public bool AllowToday { get; set; } = true;

    public override bool IsValid(object? value)
    {
        if (value == null) return true;

        if (value is not DateTime date)
        {
            return false;
        }

        var today = DateTime.UtcNow.Date;

        if (AllowToday)
        {
            return date.Date >= today;
        }
        else
        {
            return date.Date > today;
        }
    }

    public override string FormatErrorMessage(string name)
    {
        return AllowToday 
            ? $"{name} kann nicht vor heute liegen"
            : $"{name} kann nicht in der Vergangenheit liegen";
    }
}