using Booking.Api.Features.Bookings.Commands;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Features.Bookings.Queries;
using Booking.Api.Extensions;
using Booking.Api.Attributes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Booking.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<BookingDto>>> GetBookings(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Administrator");
        
        var query = new GetBookingsQuery(
            UserId: isAdmin ? null : userId, // Admins can see all bookings
            StartDate: startDate,
            EndDate: endDate,
            PageNumber: pageNumber,
            PageSize: pageSize
        );
        
        var result = await mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BookingDto>> GetBookingById(Guid id)
    {
        var query = new GetBookingByIdQuery(id);
        var result = await mediator.Send(query);
        
        if (result == null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Administrator");
        
        // Users can only see their own bookings, admins can see all
        if (!isAdmin && result.UserId != userId)
        {
            return Forbid();
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto createDto)
    {
        // Perform comprehensive validation including availability checks
        var validationResult = await this.ValidateAsync(createDto, mediator);
        if (validationResult != null)
        {
            return validationResult;
        }

        var userId = GetCurrentUserId();
        var command = new CreateBookingCommand(userId, createDto);
        
        try
        {
            var result = await mediator.Send(command);
            return CreatedAtAction(nameof(GetBookingById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ValidationExtensions.CreateValidationProblem("Domain", ex.Message, "Domain Validation Error"));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ValidationExtensions.CreateValidationProblem("Business", ex.Message, "Business Rule Violation"));
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateBooking(Guid id, [FromBody] UpdateBookingDto updateDto)
    {
        // First check if booking exists and user has permission
        var existingBooking = await mediator.Send(new GetBookingByIdQuery(id));
        if (existingBooking == null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Administrator");
        
        if (!isAdmin && existingBooking.UserId != userId)
        {
            return Forbid();
        }

        // Perform comprehensive validation including availability checks
        // Exclude current booking from availability check
        var validationResult = await this.ValidateAsync(updateDto, mediator, id.ToString());
        if (validationResult != null)
        {
            return validationResult;
        }

        var command = new UpdateBookingCommand(id, updateDto);
        
        try
        {
            var result = await mediator.Send(command);
            if (result == null)
            {
                return NotFound();
            }
            
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ValidationExtensions.CreateValidationProblem("Domain", ex.Message, "Domain Validation Error"));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ValidationExtensions.CreateValidationProblem("Business", ex.Message, "Business Rule Violation"));
        }
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult> CancelBooking(Guid id)
    {
        // First check if booking exists and user has permission
        var existingBooking = await mediator.Send(new GetBookingByIdQuery(id));
        if (existingBooking == null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        var isAdmin = User.IsInRole("Administrator");
        
        if (!isAdmin && existingBooking.UserId != userId)
        {
            return Forbid();
        }

        var command = new CancelBookingCommand(id);
        
        try
        {
            var success = await mediator.Send(command);
            if (!success)
            {
                return NotFound();
            }
            
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPost("{id:guid}/confirm")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult> ConfirmBooking(Guid id)
    {
        var command = new ConfirmBookingCommand(id);
        
        try
        {
            var success = await mediator.Send(command);
            if (!success)
            {
                return NotFound();
            }
            
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpGet("availability")]
    public async Task<ActionResult<BookingAvailabilityDto>> CheckAvailability(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] Guid? excludeBookingId = null)
    {
        // Use centralized validation
        var validationResult = DateRangeValidationAttribute.ValidateDateRange(startDate, endDate, allowSameDay: false, allowToday: true);
        if (!validationResult.IsValid)
        {
            return BadRequest(ValidationExtensions.CreateValidationProblem("DateRange", validationResult.ErrorMessage!, "Date Range Validation Error"));
        }

        var query = new CheckAvailabilityQuery(startDate, endDate, excludeBookingId);
        var result = await mediator.Send(query);
        
        return Ok(result);
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateBookingRequest([FromBody] CreateBookingDto createDto)
    {
        // Perform all validation rules but don't create the booking
        var validationResult = await this.ValidateAsync(createDto, mediator);
        if (validationResult != null)
        {
            return validationResult;
        }

        // Return success with validation details
        return Ok(new
        {
            IsValid = true,
            Message = "Buchungsanfrage ist gültig",
            ValidatedAt = DateTime.UtcNow,
            DateRange = new
            {
                StartDate = createDto.StartDate,
                EndDate = createDto.EndDate,
                Nights = (createDto.EndDate - createDto.StartDate).Days
            },
            TotalPersons = createDto.BookingItems.Sum(x => x.PersonCount),
            AccommodationCount = createDto.BookingItems.Count
        });
    }

    [HttpPost("projections/rebuild")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult> RebuildProjections()
    {
        try
        {
            var projectionService = HttpContext.RequestServices
                .GetRequiredService<Services.Projections.IProjectionService<Domain.Aggregates.BookingAggregate, Domain.ReadModels.BookingReadModel>>();
            
            await projectionService.RebuildAllAsync();
            
            return Ok(new { Message = "All booking projections have been rebuilt successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Failed to rebuild projections", Error = ex.Message });
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("user_id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }
}