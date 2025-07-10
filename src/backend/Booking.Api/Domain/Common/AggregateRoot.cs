namespace Booking.Api.Domain.Common;

public abstract class AggregateRoot : IAggregate
{
    private readonly List<DomainEvent> _domainEvents = new();
    
    public Guid Id { get; protected set; }
    public int Version { get; protected set; } = -1;
    
    public IReadOnlyList<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    protected void AddDomainEvent(DomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }
    
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
    
    public void LoadFromHistory(IEnumerable<DomainEvent> events)
    {
        foreach (var domainEvent in events)
        {
            ApplyEvent(domainEvent, false);
            Version++;
        }
    }
    
    protected void ApplyEvent(DomainEvent domainEvent, bool isNew = true)
    {
        Apply(domainEvent);
        
        if (isNew)
        {
            AddDomainEvent(domainEvent);
        }
    }
    
    protected abstract void Apply(DomainEvent domainEvent);
    
    public abstract string GetAggregateType();
}