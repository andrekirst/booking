using Booking.Api.Data;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.SleepingAccommodations.Queries;

public record GetSleepingAccommodationByIdQuery(Guid Id) : IRequest<SleepingAccommodationDto?>;

public class GetSleepingAccommodationByIdQueryHandler : IRequestHandler<GetSleepingAccommodationByIdQuery, SleepingAccommodationDto?>
{
    private readonly BookingDbContext _context;

    public GetSleepingAccommodationByIdQueryHandler(BookingDbContext context)
    {
        _context = context;
    }

    public async Task<SleepingAccommodationDto?> Handle(
        GetSleepingAccommodationByIdQuery request,
        CancellationToken cancellationToken)
    {
        return await _context.SleepingAccommodationReadModels
            .Where(sa => sa.Id == request.Id)
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
            .FirstOrDefaultAsync(cancellationToken);
    }
}