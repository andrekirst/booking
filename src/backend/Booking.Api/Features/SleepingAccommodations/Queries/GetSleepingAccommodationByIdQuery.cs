using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Repositories.ReadModels;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Queries;

public record GetSleepingAccommodationByIdQuery(Guid Id) : IRequest<SleepingAccommodationDto?>;

public class GetSleepingAccommodationByIdQueryHandler(ISleepingAccommodationReadModelRepository repository) : IRequestHandler<GetSleepingAccommodationByIdQuery, SleepingAccommodationDto?>
{
    public async Task<SleepingAccommodationDto?> Handle(
        GetSleepingAccommodationByIdQuery request,
        CancellationToken cancellationToken)
    {
        var readModel = await repository.GetByIdAsync(request.Id, cancellationToken);
        
        if (readModel == null)
        {
            return null;
        }

        return new SleepingAccommodationDto
        {
            Id = readModel.Id,
            Name = readModel.Name,
            Type = readModel.Type,
            MaxCapacity = readModel.MaxCapacity,
            IsActive = readModel.IsActive,
            CreatedAt = readModel.CreatedAt,
            ChangedAt = readModel.ChangedAt
        };
    }
}