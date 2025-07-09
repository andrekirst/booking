namespace Booking.Api.Domain.Entities;

public class EventStoreSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AggregateId { get; set; }
    public string AggregateType { get; set; } = string.Empty;
    public string SnapshotData { get; set; } = string.Empty;
    public int Version { get; set; }
    public DateTime Timestamp { get; set; }
}