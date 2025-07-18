using MediatR;

namespace Booking.Api.Application.Common.Interfaces;

public interface ICommand : IRequest
{
}

public interface ICommand<out TResponse> : IRequest<TResponse>
{
}