using System.ComponentModel.DataAnnotations;

namespace Booking.Api.Configuration;

/// <summary>
/// Configuration settings for database seeding behavior.
/// Controls when and what type of data is seeded based on environment.
/// 
/// Environment Variable Mapping:
/// - SEEDING__ENABLESEEDING: Master switch for all seeding (true/false)
/// - SEEDING__ENABLEBASICSEEDING: Control admin user seeding (true/false)
/// - SEEDING__ENABLECOMPREHENSIVESEEDING: Control test data seeding (true/false)
/// - SEEDING__FORCECOMPREHENSIVESEEDING: Override environment restrictions (true/false)
/// - SEEDING__ENABLESEEDINGLOGS: Control logging verbosity (true/false)
/// </summary>
public class SeedingSettings
{
    public const string SectionName = "SeedingSettings";
    
    /// <summary>
    /// Whether seeding is enabled at all (default: true)
    /// Environment Variable: SEEDING__ENABLESEEDING
    /// </summary>
    public bool EnableSeeding { get; set; } = true;
    
    /// <summary>
    /// Whether to seed basic data (admin user, essential data) in all environments (default: true)
    /// Environment Variable: SEEDING__ENABLEBASICSEEDING
    /// </summary>
    public bool EnableBasicSeeding { get; set; } = true;
    
    /// <summary>
    /// Whether to seed comprehensive test data (users, accommodations, bookings) (default: false for safety)
    /// Only runs in Development environment unless ForceComprehensiveSeeding is true
    /// Environment Variable: SEEDING__ENABLECOMPREHENSIVESEEDING
    /// </summary>
    public bool EnableComprehensiveSeeding { get; set; } = false;
    
    /// <summary>
    /// Force comprehensive seeding even in non-development environments (default: false for safety)
    /// This is a safety override that should be used with extreme caution
    /// Environment Variable: SEEDING__FORCECOMPREHENSIVESEEDING
    /// </summary>
    public bool ForceComprehensiveSeeding { get; set; } = false;
    
    /// <summary>
    /// Whether to log detailed seeding operations (default: true)
    /// Environment Variable: SEEDING__ENABLESEEDINGLOGS
    /// </summary>
    public bool EnableSeedingLogs { get; set; } = true;
    
    /// <summary>
    /// Validates the configuration settings and provides detailed error messages.
    /// </summary>
    /// <returns>A collection of validation errors, empty if configuration is valid.</returns>
    public IEnumerable<string> Validate()
    {
        var errors = new List<string>();
        
        // Warn about dangerous configurations
        if (ForceComprehensiveSeeding && EnableComprehensiveSeeding)
        {
            errors.Add("WARNING: ForceComprehensiveSeeding is enabled. This will seed test data in production environments.");
        }
        
        // Check for logical inconsistencies
        if (!EnableSeeding && (EnableBasicSeeding || EnableComprehensiveSeeding))
        {
            errors.Add("EnableSeeding is disabled but specific seeding options are enabled. No seeding will occur.");
        }
        
        return errors;
    }
    
    /// <summary>
    /// Returns a summary of the current configuration for logging purposes.
    /// </summary>
    /// <returns>A formatted string describing the current seeding configuration.</returns>
    public string GetConfigurationSummary()
    {
        var summary = new List<string>
        {
            $"EnableSeeding: {EnableSeeding}",
            $"EnableBasicSeeding: {EnableBasicSeeding}",
            $"EnableComprehensiveSeeding: {EnableComprehensiveSeeding}",
            $"ForceComprehensiveSeeding: {ForceComprehensiveSeeding}",
            $"EnableSeedingLogs: {EnableSeedingLogs}"
        };
        
        return $"SeedingSettings Configuration: [{string.Join(", ", summary)}]";
    }
}