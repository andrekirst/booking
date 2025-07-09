using Booking.Api.Domain.Aggregates;

namespace Booking.Api.Features.SleepingAccommodations.Repositories;

public interface ISleepingAccommodationRepository
{
    Task<SleepingAccommodationAggregate?> GetByIdAsync(Guid id);
    Task SaveAsync(SleepingAccommodationAggregate aggregate);
}