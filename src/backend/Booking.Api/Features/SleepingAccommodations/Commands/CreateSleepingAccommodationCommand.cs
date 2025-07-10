using Booking.Api.Domain.Aggregates;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Features.SleepingAccommodations.Repositories;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Commands;

public record CreateSleepingAccommodationCommand(CreateSleepingAccommodationDto Dto) 
    : IRequest<SleepingAccommodationDto>;

public class CreateSleepingAccommodationCommandHandler(ISleepingAccommodationRepository repository) : IRequestHandler<CreateSleepingAccommodationCommand, SleepingAccommodationDto>
{
    public async Task<SleepingAccommodationDto> Handle(
        CreateSleepingAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var id = Guid.NewGuid();
        var aggregate = SleepingAccommodationAggregate.Create(
            id,
            request.Dto.Name,
            request.Dto.Type,
            request.Dto.MaxCapacity);
        
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