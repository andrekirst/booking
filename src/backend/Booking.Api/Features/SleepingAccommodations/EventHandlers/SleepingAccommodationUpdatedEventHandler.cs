using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationUpdatedEventHandler : INotificationHandler<SleepingAccommodationUpdatedEvent>
{
    private readonly ISleepingAccommodationReadModelRepository _repository;
    private readonly ILogger<SleepingAccommodationUpdatedEventHandler> _logger;

    public SleepingAccommodationUpdatedEventHandler(
        ISleepingAccommodationReadModelRepository repository,
        ILogger<SleepingAccommodationUpdatedEventHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task Handle(SleepingAccommodationUpdatedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _repository.UpdateAsync(
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

            _logger.LogInformation(
                "Updated read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error updating read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
            throw;
        }
    }
}