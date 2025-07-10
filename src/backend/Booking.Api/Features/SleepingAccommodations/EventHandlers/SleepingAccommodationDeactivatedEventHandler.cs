using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationDeactivatedEventHandler(
    ISleepingAccommodationReadModelRepository repository,
    ILogger<SleepingAccommodationDeactivatedEventHandler> logger)
    : INotificationHandler<SleepingAccommodationDeactivatedEvent>
{
    public async Task Handle(SleepingAccommodationDeactivatedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                notification.SleepingAccommodationId,
                readModel =>
                {
                    readModel.IsActive = false;
                    readModel.ChangedAt = notification.OccurredAt;
                    readModel.LastEventVersion++;
                },
                cancellationToken);

            logger.LogInformation(
                "Deactivated read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error deactivating read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
            throw;
        }
    }
}