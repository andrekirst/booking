using Booking.Api.Features.SleepingAccommodations.Repositories;
using MediatR;

namespace Booking.Api.Features.SleepingAccommodations.Commands;

public record DeleteSleepingAccommodationCommand(Guid Id) : IRequest<bool>;

public class DeleteSleepingAccommodationCommandHandler(ISleepingAccommodationRepository repository) : IRequestHandler<DeleteSleepingAccommodationCommand, bool>
{
    public async Task<bool> Handle(
        DeleteSleepingAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var aggregate = await repository.GetByIdAsync(request.Id);
            
        if (aggregate == null)
        {
            return false;
        }

        // Soft delete - deactivate the sleeping accommodation
        if (aggregate.IsActive)
        {
            aggregate.Deactivate();
            await repository.SaveAsync(aggregate);
        }
        
        return true;
    }
}