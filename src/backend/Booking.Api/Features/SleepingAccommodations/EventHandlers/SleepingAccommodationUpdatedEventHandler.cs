using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationUpdatedEventHandler(
    ISleepingAccommodationReadModelRepository repository,
    ILogger<SleepingAccommodationUpdatedEventHandler> logger)
    : INotificationHandler<SleepingAccommodationUpdatedEvent>
{
    public async Task Handle(SleepingAccommodationUpdatedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                notification.SleepingAccommodationId,
                readModel =>
                {
                    readModel.Name = notification.Name;
                    readModel.Type = notification.Type;
                    readModel.MaxCapacity = notification.MaxCapacity;
                    readModel.ChangedAt = notification.OccurredAt;
                    readModel.LastEventVersion++;
                },
                cancellationToken);

            logger.LogInformation(
                "Updated read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error updating read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
            throw;
        }
    }
}