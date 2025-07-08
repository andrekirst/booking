namespace Booking.Api.Configuration;

public class CorsSettings
{
    public const string SectionName = "CorsSettings";
    
    public List<string> AllowedOrigins { get; set; } = new();
    public bool AllowCredentials { get; set; } = true;
    public string PolicyName { get; set; } = "Default";
}