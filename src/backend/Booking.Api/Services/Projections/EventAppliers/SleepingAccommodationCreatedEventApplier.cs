using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;

namespace Booking.Api.Services.Projections.EventAppliers;

public class SleepingAccommodationCreatedEventApplier : IEventApplier<SleepingAccommodationReadModel>
{
    public Type EventType => typeof(SleepingAccommodationCreatedEvent);
    
    public void Apply(SleepingAccommodationReadModel readModel, DomainEvent domainEvent)
    {
        var createdEvent = (SleepingAccommodationCreatedEvent)domainEvent;
        
        readModel.Id = createdEvent.SleepingAccommodationId;
        readModel.Name = createdEvent.Name;
        readModel.Type = createdEvent.Type;
        readModel.MaxCapacity = createdEvent.MaxCapacity;
        readModel.IsActive = createdEvent.IsActive;
        readModel.CreatedAt = createdEvent.OccurredAt;
        readModel.ChangedAt = createdEvent.OccurredAt;
    }
}