using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationReactivatedEventHandler : INotificationHandler<SleepingAccommodationReactivatedEvent>
{
    private readonly ISleepingAccommodationReadModelRepository _repository;
    private readonly ILogger<SleepingAccommodationReactivatedEventHandler> _logger;

    public SleepingAccommodationReactivatedEventHandler(
        ISleepingAccommodationReadModelRepository repository,
        ILogger<SleepingAccommodationReactivatedEventHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task Handle(SleepingAccommodationReactivatedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _repository.UpdateAsync(
                notification.SleepingAccommodationId,
                readModel =>
                {
                    readModel.IsActive = true;
                    readModel.ChangedAt = notification.OccurredAt;
                    readModel.LastEventVersion++;
                },
                cancellationToken);

            _logger.LogInformation(
                "Reactivated read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error reactivating read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
            throw;
        }
    }
}