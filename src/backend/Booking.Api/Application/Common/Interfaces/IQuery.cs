using MediatR;

namespace Booking.Api.Application.Common.Interfaces;

public interface IQuery<out TResponse> : IRequest<TResponse>
{
}