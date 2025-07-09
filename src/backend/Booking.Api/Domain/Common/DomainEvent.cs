using MediatR;

namespace Booking.Api.Domain.Common;

public abstract record DomainEvent : INotification
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
    public abstract string EventType { get; }
}