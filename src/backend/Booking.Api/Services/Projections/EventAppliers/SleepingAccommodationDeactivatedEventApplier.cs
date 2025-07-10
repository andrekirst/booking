using Booking.Api.Domain.Common;
using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;

namespace Booking.Api.Services.Projections.EventAppliers;

public class SleepingAccommodationDeactivatedEventApplier : IEventApplier<SleepingAccommodationReadModel>
{
    public Type EventType => typeof(SleepingAccommodationDeactivatedEvent);
    
    public void Apply(SleepingAccommodationReadModel readModel, DomainEvent domainEvent)
    {
        var deactivatedEvent = (SleepingAccommodationDeactivatedEvent)domainEvent;
        
        readModel.IsActive = false;
        readModel.ChangedAt = deactivatedEvent.OccurredAt;
    }
}