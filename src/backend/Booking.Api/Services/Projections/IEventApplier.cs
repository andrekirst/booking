using Booking.Api.Domain.Common;

namespace Booking.Api.Services.Projections;

public interface IEventApplier<TReadModel> where TReadModel : class
{
    Type EventType { get; }
    void Apply(TReadModel readModel, DomainEvent domainEvent);
}