using Booking.Api.Domain.Enums;

namespace Booking.Api.Features.Bookings.DTOs;

public record BookingHistoryDto
{
    public Guid BookingId { get; set; }
    public List<BookingHistoryEntryDto> History { get; set; } = new();
}

public record BookingHistoryEntryDto
{
    public Guid EventId { get; set; } 
    public string EventType { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public int Version { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public BookingStatus? StatusBefore { get; set; }
    public BookingStatus? StatusAfter { get; set; }
    public Dictionary<string, object> Changes { get; set; } = new();
}