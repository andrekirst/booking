using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Features.SleepingAccommodations.Repositories;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Commands;

public record UpdateSleepingAccommodationCommand(Guid Id, UpdateSleepingAccommodationDto Dto) 
    : IRequest<SleepingAccommodationDto?>;

public class UpdateSleepingAccommodationCommandHandler : IRequestHandler<UpdateSleepingAccommodationCommand, SleepingAccommodationDto?>
{
    private readonly ISleepingAccommodationRepository _repository;

    public UpdateSleepingAccommodationCommandHandler(ISleepingAccommodationRepository repository)
    {
        _repository = repository;
    }

    public async Task<SleepingAccommodationDto?> Handle(
        UpdateSleepingAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var aggregate = await _repository.GetByIdAsync(request.Id);
            
        if (aggregate == null)
            return null;
        
        // Update the details
        aggregate.UpdateDetails(request.Dto.Name, request.Dto.Type, request.Dto.MaxCapacity);
        
        // Handle activation/deactivation
        if (request.Dto.IsActive && !aggregate.IsActive)
        {
            aggregate.Reactivate();
        }
        else if (!request.Dto.IsActive && aggregate.IsActive)
        {
            aggregate.Deactivate();
        }
        
        await _repository.SaveAsync(aggregate);
        
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