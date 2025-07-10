using Booking.Api.Domain.Aggregates;
using Booking.Api.Services.EventSourcing;

namespace Booking.Api.Features.SleepingAccommodations.Repositories;

public class SleepingAccommodationRepository(IEventSourcedRepository<SleepingAccommodationAggregate> eventSourcedRepository)
    : ISleepingAccommodationRepository
{
    public async Task<SleepingAccommodationAggregate?> GetByIdAsync(Guid id)
    {
        return await eventSourcedRepository.GetByIdAsync(id);
    }

    public async Task SaveAsync(SleepingAccommodationAggregate aggregate)
    {
        await eventSourcedRepository.SaveAsync(aggregate);
    }
}