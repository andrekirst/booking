using Booking.Api.Features.SleepingAccommodations.Repositories;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Commands;

public record DeleteSleepingAccommodationCommand(Guid Id) : IRequest<bool>;

public class DeleteSleepingAccommodationCommandHandler : IRequestHandler<DeleteSleepingAccommodationCommand, bool>
{
    private readonly ISleepingAccommodationRepository _repository;

    public DeleteSleepingAccommodationCommandHandler(ISleepingAccommodationRepository repository)
    {
        _repository = repository;
    }

    public async Task<bool> Handle(
        DeleteSleepingAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var aggregate = await _repository.GetByIdAsync(request.Id);
            
        if (aggregate == null)
            return false;
            
        // Soft delete - deactivate the sleeping accommodation
        if (aggregate.IsActive)
        {
            aggregate.Deactivate();
            await _repository.SaveAsync(aggregate);
        }
        
        return true;
    }
}