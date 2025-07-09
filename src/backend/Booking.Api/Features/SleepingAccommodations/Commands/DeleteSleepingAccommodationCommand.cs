using Booking.Api.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Features.SleepingAccommodations.Commands;

public record DeleteSleepingAccommodationCommand(Guid Id) : IRequest<bool>;

public class DeleteSleepingAccommodationCommandHandler(BookingDbContext context)
    : IRequestHandler<DeleteSleepingAccommodationCommand, bool>
{
    public async Task<bool> Handle(
        DeleteSleepingAccommodationCommand request,
        CancellationToken cancellationToken)
    {
        var accommodation = await context.SleepingAccommodations
            .FirstOrDefaultAsync(sa => sa.Id == request.Id, cancellationToken);
            
        if (accommodation == null)
            return false;
            
        // Soft delete - only set IsActive to false
        accommodation.IsActive = false;
        
        await context.SaveChangesAsync(cancellationToken);
        
        return true;
    }
}