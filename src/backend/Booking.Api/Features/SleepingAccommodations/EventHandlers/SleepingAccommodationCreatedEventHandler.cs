using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationCreatedEventHandler(
    ISleepingAccommodationReadModelRepository repository,
    ILogger<SleepingAccommodationCreatedEventHandler> logger)
    : INotificationHandler<SleepingAccommodationCreatedEvent>
{
    public async Task Handle(SleepingAccommodationCreatedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            var readModel = new SleepingAccommodationReadModel
            {
                Id = notification.SleepingAccommodationId,
                Name = notification.Name,
                Type = notification.Type,
                MaxCapacity = notification.MaxCapacity,
                IsActive = notification.IsActive,
                CreatedAt = notification.OccurredAt,
                LastEventVersion = 0 // First event
            };

            await repository.SaveAsync(readModel, cancellationToken);
            
            logger.LogInformation(
                "Created read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error creating read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
            throw;
        }
    }
}