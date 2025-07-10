using System.Threading.Channels;
using Booking.Api.Configuration;
using Booking.Api.Domain.Common;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;

namespace Booking.Api.Services.Projections;

public class ProjectionBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ProjectionBackgroundService> _logger;
    private readonly ProjectionRetryOptions _retryOptions;
    private readonly Channel<(DomainEvent Event, Guid AggregateId, string AggregateType)> _eventChannel;
    private readonly AsyncRetryPolicy _retryPolicy;

    public ProjectionBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<ProjectionBackgroundService> logger,
        IOptions<ProjectionRetryOptions> retryOptions)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _retryOptions = retryOptions.Value;
        
        // Create an unbounded channel for event processing
        _eventChannel = Channel.CreateUnbounded<(DomainEvent, Guid, string)>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
        
        // Configure retry policy with exponential backoff
        _retryPolicy = Policy
            .Handle<Exception>(ex => !(ex is OperationCanceledException))
            .WaitAndRetryAsync(
                _retryOptions.MaxRetryAttempts,
                retryAttempt => TimeSpan.FromMilliseconds(
                    Math.Min(
                        _retryOptions.InitialDelayMilliseconds * Math.Pow(_retryOptions.BackoffMultiplier, retryAttempt - 1),
                        _retryOptions.MaxDelayMilliseconds)),
                onRetry: (exception, timeSpan, retryCount, context) =>
                {
                    var aggregateId = context.TryGetValue("AggregateId", out var aggId) ? aggId : "Unknown";
                    var eventType = context.TryGetValue("EventType", out var evtType) ? evtType : "Unknown";
                    
                    _logger.LogWarning(exception,
                        "Retry {RetryCount} after {DelayMs}ms for event {EventType} on aggregate {AggregateId}",
                        retryCount, timeSpan.TotalMilliseconds, eventType, aggregateId);
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
            var context = new Context
            {
                ["AggregateId"] = aggregateId,
                ["EventType"] = domainEvent.EventType,
                ["AggregateType"] = aggregateType
            };
            
            try
            {
                await _retryPolicy.ExecuteAsync(
                    async (ctx, ct) => await ProcessEventAsync(domainEvent, aggregateId, aggregateType, ct),
                    context,
                    stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, 
                    "Failed to process event {EventType} for aggregate {AggregateId} after {MaxRetries} retries",
                    domainEvent.EventType, aggregateId, _retryOptions.MaxRetryAttempts);
                
                // TODO: Consider implementing a dead letter queue for failed events
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
        if (aggregateType == typeof(Domain.Aggregates.SleepingAccommodationAggregate).Name)
        {
            await ProcessSleepingAccommodationEventAsync(scope, domainEvent, aggregateId, cancellationToken);
        }
        else
        {
            _logger.LogWarning("Unknown aggregate type: {AggregateType}", aggregateType);
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