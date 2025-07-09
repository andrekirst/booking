using Booking.Api.Data;
using Booking.Api.Domain.ReadModels;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Repositories.ReadModels;

public class SleepingAccommodationReadModelRepository : ReadModelRepository<SleepingAccommodationReadModel>, ISleepingAccommodationReadModelRepository
{
    public SleepingAccommodationReadModelRepository(BookingDbContext context) : base(context)
    {
    }

    public async Task<List<SleepingAccommodationReadModel>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sa => sa.IsActive)
            .OrderBy(sa => sa.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<SleepingAccommodationReadModel?> GetByIdWithVersionAsync(Guid id, int minVersion, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(sa => sa.Id == id && sa.LastEventVersion >= minVersion)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task UpdateVersionAsync(Guid id, int newVersion, CancellationToken cancellationToken = default)
    {
        await UpdateAsync(id, model => model.LastEventVersion = newVersion, cancellationToken);
    }

    public override async Task<List<SleepingAccommodationReadModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .OrderBy(sa => sa.Name)
            .ToListAsync(cancellationToken);
    }
}