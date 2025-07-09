using Booking.Api.Data;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.SleepingAccommodations.Commands;

public record UpdateSleepingAccommodationCommand(Guid Id, UpdateSleepingAccommodationDto Dto) 
    : IRequest<SleepingAccommodationDto?>;

public class UpdateSleepingAccommodationCommandHandler(BookingDbContext context)
    : IRequestHandler<UpdateSleepingAccommodationCommand, SleepingAccommodationDto?>
{
    public async Task<SleepingAccommodationDto?> Handle(
        UpdateSleepingAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var accommodation = await context.SleepingAccommodations
            .FirstOrDefaultAsync(sa => sa.Id == request.Id, cancellationToken);
            
        if (accommodation == null)
            return null;
            
        accommodation.Name = request.Dto.Name;
        accommodation.Type = request.Dto.Type;
        accommodation.MaxCapacity = request.Dto.MaxCapacity;
        accommodation.IsActive = request.Dto.IsActive;
        
        await context.SaveChangesAsync(cancellationToken);
        
        return new SleepingAccommodationDto
        {
            Id = accommodation.Id,
            Name = accommodation.Name,
            Type = accommodation.Type,
            MaxCapacity = accommodation.MaxCapacity,
            IsActive = accommodation.IsActive,
            CreatedAt = accommodation.CreatedAt,
            ChangedAt = accommodation.ChangedAt
        };
    }
}