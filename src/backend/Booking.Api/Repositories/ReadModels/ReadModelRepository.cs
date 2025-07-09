using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Repositories.ReadModels;

public abstract class ReadModelRepository<TReadModel> : IReadModelRepository<TReadModel> 
    where TReadModel : class
{
    protected readonly BookingDbContext _context;
    protected readonly DbSet<TReadModel> _dbSet;

    protected ReadModelRepository(BookingDbContext context)
    {
        _context = context;
        _dbSet = context.Set<TReadModel>();
    }

    public virtual async Task<TReadModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public virtual async Task<List<TReadModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public virtual async Task SaveAsync(TReadModel model, CancellationToken cancellationToken = default)
    {
        _dbSet.Add(model);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task UpdateAsync(Guid id, Action<TReadModel> updateAction, CancellationToken cancellationToken = default)
    {
        var model = await GetByIdAsync(id, cancellationToken);
        if (model == null)
        {
            throw new InvalidOperationException($"Read model with id {id} not found");
        }

        updateAction(model);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public virtual async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var model = await GetByIdAsync(id, cancellationToken);
        if (model != null)
        {
            _dbSet.Remove(model);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public virtual async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken) != null;
    }
}