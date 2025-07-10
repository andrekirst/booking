using Booking.Api.Domain.Common;
using Booking.Api.Services.Projections;
using MediatR;

namespace Booking.Api.Services.EventSourcing;

public class OptimizedEventDispatcher : IEventDispatcher
{
    private readonly IMediator _mediator;
    private readonly ProjectionBackgroundService? _projectionService;
    private readonly ILogger<OptimizedEventDispatcher> _logger;
    private readonly bool _useAsyncProjections;

    public OptimizedEventDispatcher(
        IMediator mediator,
        IServiceProvider serviceProvider,
        ILogger<OptimizedEventDispatcher> logger,
        IConfiguration configuration)
    {
        _mediator = mediator;
        _logger = logger;
        _useAsyncProjections = configuration.GetValue("EventSourcing:UseAsyncProjections", false);
        
        // Get projection service only if async projections are enabled
        if (_useAsyncProjections)
        {
            _projectionService = serviceProvider.GetService<ProjectionBackgroundService>();
        }
    }

    public async Task PublishAsync(DomainEvent domainEvent)
    {
        try
        {
            // Always publish to MediatR for immediate handlers
            await _mediator.Publish(domainEvent);
            
            // If async projections are enabled and event implements IAggregateEvent, queue for background processing
            if (_useAsyncProjections && _projectionService != null && domainEvent is IAggregateEvent aggregateEvent)
            {
                var aggregateId = aggregateEvent.GetAggregateId();
                var aggregateType = aggregateEvent.GetAggregateType();
                
                await _projectionService.QueueEventForProjectionAsync(domainEvent, aggregateId, aggregateType);
            }
            
            _logger.LogDebug("Published event {EventType} with id {EventId}", 
                domainEvent.EventType, domainEvent.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing event {EventType} with id {EventId}",
                domainEvent.EventType, domainEvent.Id);
            throw;
        }
    }
}