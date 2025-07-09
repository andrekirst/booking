using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Queries;

public record GetSleepingAccommodationsQuery : IRequest<List<SleepingAccommodationDto>>
{
    public bool IncludeInactive { get; init; } = false;
}

public class GetSleepingAccommodationsQueryHandler : IRequestHandler<GetSleepingAccommodationsQuery, List<SleepingAccommodationDto>>
{
    private readonly ISleepingAccommodationReadModelRepository _repository;

    public GetSleepingAccommodationsQueryHandler(ISleepingAccommodationReadModelRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<SleepingAccommodationDto>> Handle(
        GetSleepingAccommodationsQuery request, 
        CancellationToken cancellationToken)
    {
        var readModels = request.IncludeInactive
            ? await _repository.GetAllAsync(cancellationToken)
            : await _repository.GetActiveAsync(cancellationToken);
        
        return readModels
            .Select(sa => new SleepingAccommodationDto
            {
                Id = sa.Id,
                Name = sa.Name,
                Type = sa.Type,
                MaxCapacity = sa.MaxCapacity,
                IsActive = sa.IsActive,
                CreatedAt = sa.CreatedAt,
                ChangedAt = sa.ChangedAt
            })
            .ToList();
    }
}