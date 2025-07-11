using Booking.Api.Data;
using Booking.Api.Domain.ReadModels;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Repositories.ReadModels;

public class SleepingAccommodationReadModelRepository(BookingDbContext context) : ReadModelRepository<SleepingAccommodationReadModel>(context), ISleepingAccommodationReadModelRepository
{
    public async Task<List<SleepingAccommodationReadModel>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(sa => sa.IsActive)
            .OrderBy(sa => sa.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<SleepingAccommodationReadModel?> GetByIdWithVersionAsync(Guid id, int minVersion, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(sa => sa.Id == id && sa.LastEventVersion >= minVersion)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task UpdateVersionAsync(Guid id, int newVersion, CancellationToken cancellationToken = default)
    {
        await UpdateAsync(id, model => model.LastEventVersion = newVersion, cancellationToken);
    }

    public override async Task<List<SleepingAccommodationReadModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .OrderBy(sa => sa.Name)
            .ToListAsync(cancellationToken);
    }
}