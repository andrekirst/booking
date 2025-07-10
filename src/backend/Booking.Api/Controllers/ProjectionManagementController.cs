using Booking.Api.Domain.Aggregates;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Services.Projections;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Controllers;

[ApiController]
[Route("api/admin/projections")]
[Authorize(Roles = "Administrator")]
public class ProjectionManagementController : ControllerBase
{
    private readonly IProjectionService<SleepingAccommodationAggregate, SleepingAccommodationReadModel> _sleepingAccommodationProjectionService;
    private readonly ILogger<ProjectionManagementController> _logger;

    public ProjectionManagementController(
        IProjectionService<SleepingAccommodationAggregate, SleepingAccommodationReadModel> sleepingAccommodationProjectionService,
        ILogger<ProjectionManagementController> logger)
    {
        _sleepingAccommodationProjectionService = sleepingAccommodationProjectionService;
        _logger = logger;
    }

    /// <summary>
    /// Rebuild projection for a specific sleeping accommodation
    /// </summary>
    [HttpPost("sleeping-accommodations/{id}/rebuild")]
    public async Task<IActionResult> RebuildSleepingAccommodationProjection(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Rebuilding projection for sleeping accommodation {Id}", id);
            await _sleepingAccommodationProjectionService.RebuildAsync(id, cancellationToken);
            
            return Ok(new { message = $"Projection rebuilt successfully for aggregate {id}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rebuilding projection for sleeping accommodation {Id}", id);
            return StatusCode(500, new { error = "Failed to rebuild projection" });
        }
    }

    /// <summary>
    /// Rebuild all sleeping accommodation projections
    /// </summary>
    [HttpPost("sleeping-accommodations/rebuild-all")]
    public async Task<IActionResult> RebuildAllSleepingAccommodationProjections(
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Rebuilding all sleeping accommodation projections");
            await _sleepingAccommodationProjectionService.RebuildAllAsync(cancellationToken);
            
            return Ok(new { message = "All projections rebuilt successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rebuilding all sleeping accommodation projections");
            return StatusCode(500, new { error = "Failed to rebuild projections" });
        }
    }

    /// <summary>
    /// Update projection for a specific sleeping accommodation from a specific version
    /// </summary>
    [HttpPost("sleeping-accommodations/{id}/project")]
    public async Task<IActionResult> ProjectSleepingAccommodation(
        Guid id,
        [FromQuery] int fromVersion = 0,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Projecting sleeping accommodation {Id} from version {Version}", id, fromVersion);
            await _sleepingAccommodationProjectionService.ProjectAsync(id, fromVersion, cancellationToken);
            
            return Ok(new { message = $"Projection updated successfully for aggregate {id}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error projecting sleeping accommodation {Id}", id);
            return StatusCode(500, new { error = "Failed to update projection" });
        }
    }
}