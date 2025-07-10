using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Queries;

public record GetSleepingAccommodationsQuery : IRequest<List<SleepingAccommodationDto>>
{
    public bool IncludeInactive { get; init; } = false;
}

public class GetSleepingAccommodationsQueryHandler(ISleepingAccommodationReadModelRepository repository) : IRequestHandler<GetSleepingAccommodationsQuery, List<SleepingAccommodationDto>>
{
    public async Task<List<SleepingAccommodationDto>> Handle(
        GetSleepingAccommodationsQuery request, 
        CancellationToken cancellationToken)
    {
        var readModels = request.IncludeInactive
            ? await repository.GetAllAsync(cancellationToken)
            : await repository.GetActiveAsync(cancellationToken);
        
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