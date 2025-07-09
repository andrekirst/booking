using Booking.Api.Domain.ReadModels;

namespace Booking.Api.Repositories.ReadModels;

public interface ISleepingAccommodationReadModelRepository : IReadModelRepository<SleepingAccommodationReadModel>
{
    Task<List<SleepingAccommodationReadModel>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<SleepingAccommodationReadModel?> GetByIdWithVersionAsync(Guid id, int minVersion, CancellationToken cancellationToken = default);
    Task UpdateVersionAsync(Guid id, int newVersion, CancellationToken cancellationToken = default);
}