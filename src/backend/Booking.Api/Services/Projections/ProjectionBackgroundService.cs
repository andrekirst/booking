using System.Threading.Channels;
using Booking.Api.Domain.Common;

namespace Booking.Api.Services.Projections;

public class ProjectionBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ProjectionBackgroundService> _logger;
    private readonly Channel<(DomainEvent Event, Guid AggregateId, string AggregateType)> _eventChannel;

    public ProjectionBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<ProjectionBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        
        // Create an unbounded channel for event processing
        _eventChannel = Channel.CreateUnbounded<(DomainEvent, Guid, string)>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
    }

    public async Task QueueEventForProjectionAsync(DomainEvent domainEvent, Guid aggregateId, string aggregateType)
    {
        await _eventChannel.Writer.WriteAsync((domainEvent, aggregateId, aggregateType));
        _logger.LogDebug("Queued event {EventType} for aggregate {AggregateId} for projection", 
            domainEvent.EventType, aggregateId);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Projection Background Service started");

        await foreach (var (domainEvent, aggregateId, aggregateType) in _eventChannel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessEventAsync(domainEvent, aggregateId, aggregateType, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, 
                    "Error processing event {EventType} for aggregate {AggregateId}",
                    domainEvent.EventType, aggregateId);
                
                // In production, you might want to implement retry logic or dead letter queue
            }
        }

        _logger.LogInformation("Projection Background Service stopped");
    }

    private async Task ProcessEventAsync(
        DomainEvent domainEvent, 
        Guid aggregateId, 
        string aggregateType, 
        CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        
        // Determine which projection service to use based on aggregate type
        switch (aggregateType)
        {
            case "SleepingAccommodationAggregate":
                await ProcessSleepingAccommodationEventAsync(scope, domainEvent, aggregateId, cancellationToken);
                break;
            default:
                _logger.LogWarning("Unknown aggregate type: {AggregateType}", aggregateType);
                break;
        }
    }

    private async Task ProcessSleepingAccommodationEventAsync(
        IServiceScope scope,
        DomainEvent domainEvent,
        Guid aggregateId,
        CancellationToken cancellationToken)
    {
        var projectionService = scope.ServiceProvider
            .GetRequiredService<IProjectionService<Domain.Aggregates.SleepingAccommodationAggregate, Domain.ReadModels.SleepingAccommodationReadModel>>();
        
        // Get the version from the event (this would need to be tracked)
        // For now, we'll rebuild the entire projection
        await projectionService.ProjectAsync(aggregateId, 0, cancellationToken);
        
        _logger.LogInformation(
            "Processed {EventType} for SleepingAccommodation {AggregateId}",
            domainEvent.EventType, aggregateId);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Projection Background Service is stopping");
        
        // Signal that no more events will be written
        _eventChannel.Writer.TryComplete();
        
        await base.StopAsync(cancellationToken);
    }
}