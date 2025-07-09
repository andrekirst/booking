using Booking.Api.Domain.Aggregates;
using Booking.Api.Services.EventSourcing;

namespace Booking.Api.Features.SleepingAccommodations.Repositories;

public class SleepingAccommodationRepository : ISleepingAccommodationRepository
{
    private readonly IEventSourcedRepository<SleepingAccommodationAggregate> _eventSourcedRepository;

    public SleepingAccommodationRepository(IEventSourcedRepository<SleepingAccommodationAggregate> eventSourcedRepository)
    {
        _eventSourcedRepository = eventSourcedRepository;
    }

    public async Task<SleepingAccommodationAggregate?> GetByIdAsync(Guid id)
    {
        return await _eventSourcedRepository.GetByIdAsync(id);
    }

    public async Task SaveAsync(SleepingAccommodationAggregate aggregate)
    {
        await _eventSourcedRepository.SaveAsync(aggregate);
    }
}