using Booking.Api.Features.Bookings.Commands;
using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Features.Bookings.Queries;
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
    public async Task<ActionResult<BookingDto>> CreateBooking([FromBody] CreateBookingDto createDto)
    {
        var userId = GetCurrentUserId();
        var command = new CreateBookingCommand(userId, createDto);
        
        try
        {
            var result = await mediator.Send(command);
            return CreatedAtAction(nameof(GetBookingById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BookingDto>> UpdateBooking(Guid id, [FromBody] UpdateBookingDto updateDto)
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
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
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
        if (startDate >= endDate)
        {
            return BadRequest("Start date must be before end date");
        }

        if (startDate < DateTime.UtcNow.Date)
        {
            return BadRequest("Start date cannot be in the past");
        }

        var query = new CheckAvailabilityQuery(startDate, endDate, excludeBookingId);
        var result = await mediator.Send(query);
        
        return Ok(result);
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