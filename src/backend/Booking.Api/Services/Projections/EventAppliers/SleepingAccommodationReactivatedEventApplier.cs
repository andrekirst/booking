using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;

namespace Booking.Api.Services.Projections.EventAppliers;

public class SleepingAccommodationReactivatedEventApplier : IEventApplier<SleepingAccommodationReadModel>
{
    public Type EventType => typeof(SleepingAccommodationReactivatedEvent);
    
    public void Apply(SleepingAccommodationReadModel readModel, DomainEvent domainEvent)
    {
        var reactivatedEvent = (SleepingAccommodationReactivatedEvent)domainEvent;
        
        readModel.IsActive = true;
        readModel.ChangedAt = reactivatedEvent.OccurredAt;
    }
}