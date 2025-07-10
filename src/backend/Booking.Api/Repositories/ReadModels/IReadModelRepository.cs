namespace Booking.Api.Repositories.ReadModels;

public interface IReadModelRepository<TReadModel> where TReadModel : class
{
    Task<TReadModel?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<TReadModel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task SaveAsync(TReadModel model, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, Action<TReadModel> updateAction, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
}