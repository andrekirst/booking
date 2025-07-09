using Booking.Api.Data;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.SleepingAccommodations.Queries;

public record GetSleepingAccommodationsQuery : IRequest<List<SleepingAccommodationDto>>
{
    public bool IncludeInactive { get; init; } = false;
}

public class GetSleepingAccommodationsQueryHandler : IRequestHandler<GetSleepingAccommodationsQuery, List<SleepingAccommodationDto>>
{
    private readonly BookingDbContext _context;

    public GetSleepingAccommodationsQueryHandler(BookingDbContext context)
    {
        _context = context;
    }

    public async Task<List<SleepingAccommodationDto>> Handle(
        GetSleepingAccommodationsQuery request, 
        CancellationToken cancellationToken)
    {
        var query = _context.SleepingAccommodationReadModels.AsQueryable();
        
        if (!request.IncludeInactive)
        {
            query = query.Where(sa => sa.IsActive);
        }
        
        return await query
            .OrderBy(sa => sa.Name)
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
            .ToListAsync(cancellationToken);
    }
}