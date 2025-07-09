using Booking.Api.Domain.Common;

namespace Booking.Api.Services.EventSourcing;

public interface IEventSourcedRepository<T> where T : AggregateRoot
{
    Task<T?> GetByIdAsync(Guid id);
    Task SaveAsync(T aggregate);
}