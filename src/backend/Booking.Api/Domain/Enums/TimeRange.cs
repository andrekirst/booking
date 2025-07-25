namespace Booking.Api.Domain.Enums;

public enum TimeRange
{
    Future = 0,  // Nur aktuelle und zukünftige Buchungen (Standard)
    All = 1,     // Alle Buchungen (inkl. vergangene)
    Past = 2,    // Nur vergangene Buchungen
    Last30Days = 3,  // Letzte 30 Tage
    LastYear = 4     // Letztes Jahr
}