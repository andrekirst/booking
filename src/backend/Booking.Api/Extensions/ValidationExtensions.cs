using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Booking.Api.Attributes;
using MediatR;

namespace Booking.Api.Extensions;

public static class ValidationExtensions
{
    /// <summary>
    /// Performs comprehensive validation including async availability checks
    /// </summary>
    public static async Task<IActionResult?> ValidateAsync<T>(
        this ControllerBase controller,
        T model,
        IMediator mediator,
        string? excludeBookingId = null) where T : class
    {
        // First check model state for basic validations
        if (!controller.ModelState.IsValid)
        {
            return controller.ValidationProblem(controller.ModelState);
        }

        // Perform async availability validation if the model has the attribute
        var availabilityAttribute = typeof(T).GetCustomAttributes(typeof(AvailabilityValidationAttribute), true)
            .FirstOrDefault() as AvailabilityValidationAttribute;

        if (availabilityAttribute != null)
        {
            var validationResult = await ValidateAvailabilityAsync(model, mediator, availabilityAttribute, excludeBookingId);
            if (validationResult != null)
            {
                return validationResult;
            }
        }

        return null; // Validation passed
    }

    private static async Task<IActionResult?> ValidateAvailabilityAsync<T>(
        T model,
        IMediator mediator,
        AvailabilityValidationAttribute attribute,
        string? excludeBookingId) where T : class
    {
        try
        {
            var startDateProperty = typeof(T).GetProperty(attribute.StartDatePropertyName);
            var endDateProperty = typeof(T).GetProperty(attribute.EndDatePropertyName);
            var bookingItemsProperty = typeof(T).GetProperty(attribute.BookingItemsPropertyName);

            if (startDateProperty?.GetValue(model) is DateTime startDate &&
                endDateProperty?.GetValue(model) is DateTime endDate &&
                bookingItemsProperty?.GetValue(model) is IEnumerable<object> bookingItems)
            {
                var (isValid, errorMessage) = await AvailabilityValidationAttribute.ValidateAvailabilityAsync(
                    startDate, endDate, bookingItems, mediator, excludeBookingId);

                if (!isValid)
                {
                    var modelState = new ModelStateDictionary();
                    modelState.AddModelError("Availability", errorMessage ?? "Verfügbarkeitsprüfung fehlgeschlagen");
                    return new BadRequestObjectResult(new ValidationProblemDetails(modelState));
                }
            }
        }
        catch (Exception)
        {
            var modelState = new ModelStateDictionary();
            modelState.AddModelError("Availability", "Verfügbarkeitsprüfung konnte nicht durchgeführt werden");
            return new BadRequestObjectResult(new ValidationProblemDetails(modelState));
        }

        return null;
    }

    /// <summary>
    /// Creates a structured validation problem response
    /// </summary>
    public static ValidationProblemDetails CreateValidationProblem(
        string field,
        string message,
        string? title = null)
    {
        var modelState = new ModelStateDictionary();
        modelState.AddModelError(field, message);
        
        return new ValidationProblemDetails(modelState)
        {
            Title = title ?? "Validation Error",
            Status = 400
        };
    }

    /// <summary>
    /// Creates a structured validation problem response for multiple errors
    /// </summary>
    public static ValidationProblemDetails CreateValidationProblem(
        Dictionary<string, string[]> errors,
        string? title = null)
    {
        var modelState = new ModelStateDictionary();
        foreach (var error in errors)
        {
            foreach (var message in error.Value)
            {
                modelState.AddModelError(error.Key, message);
            }
        }
        
        return new ValidationProblemDetails(modelState)
        {
            Title = title ?? "Validation Error",
            Status = 400
        };
    }
}