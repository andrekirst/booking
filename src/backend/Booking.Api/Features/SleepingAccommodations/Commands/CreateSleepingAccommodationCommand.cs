using Booking.Api.Data;
using Booking.Api.Domain.Entities;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Commands;

public record CreateSleepingAccommodationCommand(CreateSleepingAccommodationDto Dto) 
    : IRequest<SleepingAccommodationDto>;

public class CreateSleepingAccommodationCommandHandler(BookingDbContext context)
    : IRequestHandler<CreateSleepingAccommodationCommand, SleepingAccommodationDto>
{
    public async Task<SleepingAccommodationDto> Handle(
        CreateSleepingAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var accommodation = new SleepingAccommodation
        {
            Name = request.Dto.Name,
            Type = request.Dto.Type,
            MaxCapacity = request.Dto.MaxCapacity,
            IsActive = true
        };
        
        context.SleepingAccommodations.Add(accommodation);
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