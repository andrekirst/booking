using Booking.Api.Domain.Events.SleepingAccommodations;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.EventHandlers;

public class SleepingAccommodationCreatedEventHandler : INotificationHandler<SleepingAccommodationCreatedEvent>
{
    private readonly ISleepingAccommodationReadModelRepository _repository;
    private readonly ILogger<SleepingAccommodationCreatedEventHandler> _logger;

    public SleepingAccommodationCreatedEventHandler(
        ISleepingAccommodationReadModelRepository repository,
        ILogger<SleepingAccommodationCreatedEventHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

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

            await _repository.SaveAsync(readModel, cancellationToken);
            
            _logger.LogInformation(
                "Created read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error creating read model for SleepingAccommodation {AggregateId} from event {EventId}",
                notification.SleepingAccommodationId,
                notification.Id);
            throw;
        }
    }
}