using Booking.Api.Features.SleepingAccommodations.Commands;
using Booking.Api.Features.SleepingAccommodations.DTOs;
using Booking.Api.Features.SleepingAccommodations.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Controllers;

[ApiController]
[Route("api/sleeping-accommodations")]
[Authorize(Roles = "Administrator")]
public class SleepingAccommodationsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SleepingAccommodationDto>>> GetAll(
        [FromQuery] bool includeInactive = false)
    {
        var query = new GetSleepingAccommodationsQuery { IncludeInactive = includeInactive };
        var result = await mediator.Send(query);
        return Ok(result);
    }
    
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SleepingAccommodationDto>> GetById(Guid id)
    {
        var query = new GetSleepingAccommodationByIdQuery(id);
        var result = await mediator.Send(query);
        
        return result == null ? NotFound() : Ok(result);
    }
    
    [HttpPost]
    public async Task<ActionResult<SleepingAccommodationDto>> Create(
        [FromBody] CreateSleepingAccommodationDto dto)
    {
        var command = new CreateSleepingAccommodationCommand(dto);
        var result = await mediator.Send(command);
        
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
    
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SleepingAccommodationDto>> Update(
        Guid id,
        [FromBody] UpdateSleepingAccommodationDto dto)
    {
        var command = new UpdateSleepingAccommodationCommand(id, dto);
        var result = await mediator.Send(command);
        
        return result == null ? NotFound() : Ok(result);
    }
    
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var command = new DeleteSleepingAccommodationCommand(id);
        var result = await mediator.Send(command);
        
        return result ? NoContent() : NotFound();
    }
}