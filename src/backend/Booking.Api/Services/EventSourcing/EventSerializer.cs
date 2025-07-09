using System.Text.Json;
using Booking.Api.Domain.Common;

namespace Booking.Api.Services.EventSourcing;

public interface IEventSerializer
{
    string SerializeEvent(DomainEvent domainEvent);
    DomainEvent DeserializeEvent(string eventData, string eventType);
    string SerializeSnapshot<T>(T snapshot) where T : class;
    T? DeserializeSnapshot<T>(string snapshotData) where T : class;
}

public class EventSerializer : IEventSerializer
{
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly Dictionary<string, Type> _eventTypes;

    public EventSerializer()
    {
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        // Register all domain event types
        _eventTypes = new Dictionary<string, Type>();
        RegisterEventTypes();
    }

    public string SerializeEvent(DomainEvent domainEvent)
    {
        return JsonSerializer.Serialize(domainEvent, domainEvent.GetType(), _jsonOptions);
    }

    public DomainEvent DeserializeEvent(string eventData, string eventType)
    {
        if (!_eventTypes.TryGetValue(eventType, out var type))
        {
            throw new InvalidOperationException($"Unknown event type: {eventType}");
        }

        var domainEvent = JsonSerializer.Deserialize(eventData, type, _jsonOptions);
        return domainEvent as DomainEvent ?? throw new InvalidOperationException($"Failed to deserialize event: {eventType}");
    }

    public string SerializeSnapshot<T>(T snapshot) where T : class
    {
        return JsonSerializer.Serialize(snapshot, _jsonOptions);
    }

    public T? DeserializeSnapshot<T>(string snapshotData) where T : class
    {
        return JsonSerializer.Deserialize<T>(snapshotData, _jsonOptions);
    }

    private void RegisterEventTypes()
    {
        // Dynamically discover and register all DomainEvent types
        var domainEventType = typeof(DomainEvent);
        var eventTypes = AppDomain.CurrentDomain.GetAssemblies()
            .SelectMany(assembly => assembly.GetTypes())
            .Where(type => type.IsSubclassOf(domainEventType) && !type.IsAbstract)
            .ToList();

        foreach (var eventType in eventTypes)
        {
            // Create a temporary instance to get the EventType
            if (Activator.CreateInstance(eventType) is DomainEvent eventInstance)
            {
                _eventTypes[eventInstance.EventType] = eventType;
            }
        }
    }
}