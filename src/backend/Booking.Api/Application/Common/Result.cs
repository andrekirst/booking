namespace Booking.Api.Application.Common;

public record Result(bool Success, string Message)
{
    public static Result Ok(string message = "Operation completed successfully") => new(true, message);
    public static Result Fail(string message) => new(false, message);
}