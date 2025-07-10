using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;

namespace Booking.Api.Services.Projections.EventAppliers;

public class SleepingAccommodationUpdatedEventApplier : IEventApplier<SleepingAccommodationReadModel>
{
    public Type EventType => typeof(SleepingAccommodationUpdatedEvent);
    
    public void Apply(SleepingAccommodationReadModel readModel, DomainEvent domainEvent)
    {
        var updatedEvent = (SleepingAccommodationUpdatedEvent)domainEvent;
        
        readModel.Name = updatedEvent.Name;
        readModel.Type = updatedEvent.Type;
        readModel.MaxCapacity = updatedEvent.MaxCapacity;
        readModel.ChangedAt = updatedEvent.OccurredAt;
    }
}