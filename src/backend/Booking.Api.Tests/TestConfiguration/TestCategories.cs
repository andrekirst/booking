namespace Booking.Api.Tests.TestConfiguration;

/// <summary>
/// Test-Kategorien für verschiedene Test-Arten
/// Ermöglicht selektive Test-Ausführung basierend auf Kategorien
/// </summary>
public static class TestCategories
{
    /// <summary>
    /// Unit Tests - Schnelle, isolierte Tests einzelner Komponenten
    /// </summary>
    public const string Unit = "Unit";

    /// <summary>
    /// Integration Tests - Tests mit echter Datenbank und Services
    /// </summary>
    public const string Integration = "Integration";

    /// <summary>
    /// Performance Tests - Load, Stress und Response-Time Tests
    /// </summary>
    public const string Performance = "Performance";

    /// <summary>
    /// Concurrency Tests - Multi-Threading und Race-Condition Tests
    /// </summary>
    public const string Concurrency = "Concurrency";

    /// <summary>
    /// Memory Tests - Memory-Leaks und Resource-Management Tests
    /// </summary>
    public const string Memory = "Memory";

    /// <summary>
    /// Edge Case Tests - Seltene Szenarien und Grenzfälle
    /// </summary>
    public const string EdgeCase = "EdgeCase";

    /// <summary>
    /// End-to-End Tests - Vollständige API-Workflows
    /// </summary>
    public const string EndToEnd = "EndToEnd";

    /// <summary>
    /// Slow Tests - Tests die länger als 10 Sekunden dauern
    /// </summary>
    public const string Slow = "Slow";

    /// <summary>
    /// Fast Tests - Tests die unter 1 Sekunde dauern
    /// </summary>
    public const string Fast = "Fast";

    /// <summary>
    /// Database Tests - Tests die eine Datenbank benötigen
    /// </summary>
    public const string Database = "Database";

    /// <summary>
    /// Network Tests - Tests mit Netzwerk-Operationen
    /// </summary>
    public const string Network = "Network";

    /// <summary>
    /// Security Tests - Sicherheits- und Autorisierungs-Tests
    /// </summary>
    public const string Security = "Security";
}

/// <summary>
/// Trait-Attribute für einfache Test-Kategorisierung
/// </summary>
public static class TestTraits
{
    public static class Category
    {
        public const string Name = "Category";
    }

    public static class Performance
    {
        public const string Name = "Performance";
        public const string Load = "Load";
        public const string Stress = "Stress";
        public const string Memory = "Memory";
        public const string Response = "ResponseTime";
    }

    public static class Complexity
    {
        public const string Name = "Complexity";
        public const string Simple = "Simple";
        public const string Medium = "Medium";
        public const string Complex = "Complex";
    }

    public static class Duration
    {
        public const string Name = "Duration";
        public const string Fast = "Fast";      // < 1s
        public const string Medium = "Medium";  // 1-10s
        public const string Slow = "Slow";     // > 10s
    }
}