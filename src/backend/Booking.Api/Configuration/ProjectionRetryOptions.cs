namespace Booking.Api.Configuration;

public class ProjectionRetryOptions
{
    public const string SectionName = "ProjectionRetry";
    
    public int MaxRetryAttempts { get; set; } = 3;
    public int InitialDelayMilliseconds { get; set; } = 1000;
    public int MaxDelayMilliseconds { get; set; } = 30000;
    public double BackoffMultiplier { get; set; } = 2.0;
}