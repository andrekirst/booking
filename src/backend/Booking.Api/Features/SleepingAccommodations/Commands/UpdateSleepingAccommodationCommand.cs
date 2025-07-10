using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Features.SleepingAccommodations.Repositories;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Commands;

public record UpdateSleepingAccommodationCommand(Guid Id, UpdateSleepingAccommodationDto Dto) 
    : IRequest<SleepingAccommodationDto?>;

public class UpdateSleepingAccommodationCommandHandler(ISleepingAccommodationRepository repository) : IRequestHandler<UpdateSleepingAccommodationCommand, SleepingAccommodationDto?>
{
    public async Task<SleepingAccommodationDto?> Handle(
        UpdateSleepingAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var aggregate = await repository.GetByIdAsync(request.Id);
            
        if (aggregate == null)
        {
            return null;
        }

        // Update the details
        aggregate.UpdateDetails(request.Dto.Name, request.Dto.Type, request.Dto.MaxCapacity);

        switch (request.Dto.IsActive)
        {
            // Handle activation/deactivation
            case true when !aggregate.IsActive:
                aggregate.Reactivate();
                break;
            case false when aggregate.IsActive:
                aggregate.Deactivate();
                break;
        }
        
        await repository.SaveAsync(aggregate);
        
        return new SleepingAccommodationDto
        {
            Id = aggregate.Id,
            Name = aggregate.Name,
            Type = aggregate.Type,
            MaxCapacity = aggregate.MaxCapacity,
            IsActive = aggregate.IsActive,
            CreatedAt = aggregate.CreatedAt,
            ChangedAt = aggregate.ChangedAt
        };
    }
}