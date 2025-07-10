using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Repositories.ReadModels;

public abstract class ReadModelRepository<TReadModel>(BookingDbContext context) : IReadModelRepository<TReadModel>
    where TReadModel : class
{
    protected readonly DbSet<TReadModel> DbSet = context.Set<TReadModel>();

    public virtual async Task<TReadModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet.FindAsync([id], cancellationToken);
    }

    public virtual async Task<List<TReadModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet.ToListAsync(cancellationToken);
    }

    public virtual async Task SaveAsync(TReadModel model, CancellationToken cancellationToken = default)
    {
        DbSet.Add(model);
        await context.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task UpdateAsync(Guid id, Action<TReadModel> updateAction, CancellationToken cancellationToken = default)
    {
        var model = await GetByIdAsync(id, cancellationToken);
        if (model == null)
        {
            throw new InvalidOperationException($"Read model with id {id} not found");
        }

        updateAction(model);
        await context.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var model = await GetByIdAsync(id, cancellationToken);
        if (model != null)
        {
            DbSet.Remove(model);
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public virtual async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet.FindAsync([id], cancellationToken) != null;
    }
}