using Booking.Api.Features.Admin.Commands;
using Booking.Api.Features.Admin.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get Event Sourcing migration status
    /// </summary>
    /// <returns>Migration status information</returns>
    [HttpGet("event-sourcing-status")]
    public async Task<ActionResult<EventSourcingMigrationStatus>> GetEventSourcingStatus()
    {
        var query = new GetEventSourcingMigrationStatusQuery();
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    /// <summary>
    /// Manually trigger data migration to Event Sourcing
    /// </summary>
    /// <returns>Migration result</returns>
    [HttpPost("migrate-to-event-sourcing")]
    public async Task<ActionResult<MigrateDataToEventSourcingResult>> MigrateToEventSourcing()
    {
        var command = new MigrateDataToEventSourcingCommand();
        var result = await _mediator.Send(command);

        if (result.Success)
        {
            return Ok(result);
        }
        else
        {
            return BadRequest(result);
        }
    }

    /// <summary>
    /// Rollback Event Sourcing data (removes all events and read models)
    /// </summary>
    /// <returns>Rollback result</returns>
    [HttpPost("rollback-event-sourcing")]
    public async Task<ActionResult<RollbackEventSourcingDataResult>> RollbackEventSourcing()
    {
        var command = new RollbackEventSourcingDataCommand();
        var result = await _mediator.Send(command);

        if (result.Success)
        {
            return Ok(result);
        }
        else
        {
            return BadRequest(result);
        }
    }
}