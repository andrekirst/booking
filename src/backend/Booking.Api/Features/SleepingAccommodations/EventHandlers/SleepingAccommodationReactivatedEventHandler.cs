using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationReactivatedEventHandler(
    ISleepingAccommodationReadModelRepository repository,
    ILogger<SleepingAccommodationReactivatedEventHandler> logger)
    : INotificationHandler<SleepingAccommodationReactivatedEvent>
{
    public async Task Handle(SleepingAccommodationReactivatedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                notification.SleepingAccommodationId,
                readModel =>
                {
                    readModel.IsActive = true;
                    readModel.ChangedAt = notification.OccurredAt;
                    readModel.LastEventVersion++;
                },
                cancellationToken);

            logger.LogInformation(
                "Reactivated read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error reactivating read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
            throw;
        }
    }
}