using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationDeactivatedEventHandler : INotificationHandler<SleepingAccommodationDeactivatedEvent>
{
    private readonly ISleepingAccommodationReadModelRepository _repository;
    private readonly ILogger<SleepingAccommodationDeactivatedEventHandler> _logger;

    public SleepingAccommodationDeactivatedEventHandler(
        ISleepingAccommodationReadModelRepository repository,
        ILogger<SleepingAccommodationDeactivatedEventHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task Handle(SleepingAccommodationDeactivatedEvent notification, CancellationToken cancellationToken)
    {
        try
        {
            await _repository.UpdateAsync(
                notification.SleepingAccommodationId,
                readModel =>
                {
                    readModel.IsActive = false;
                    readModel.ChangedAt = notification.OccurredAt;
                    readModel.LastEventVersion++;
                },
                cancellationToken);

            _logger.LogInformation(
                "Deactivated read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error deactivating read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
            throw;
        }
    }
}