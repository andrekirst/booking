using Booking.Api.Data;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.SleepingAccommodations.Queries;

public record GetSleepingAccommodationByIdQuery(Guid Id) : IRequest<SleepingAccommodationDto?>;

public class GetSleepingAccommodationByIdQueryHandler(BookingDbContext context)
    : IRequestHandler<GetSleepingAccommodationByIdQuery, SleepingAccommodationDto?>
{
    public async Task<SleepingAccommodationDto?> Handle(
        GetSleepingAccommodationByIdQuery request,
        CancellationToken cancellationToken)
    {
        return await context.SleepingAccommodations
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