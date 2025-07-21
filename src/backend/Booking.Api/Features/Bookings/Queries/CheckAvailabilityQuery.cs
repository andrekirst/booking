using Booking.Api.Features.Bookings.DTOs;
using Booking.Api.Domain.ReadModels;
using Booking.Api.Data;
using Microsoft.EntityFrameworkCore;
using MediatR;
using System.Text.Json;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Features.Bookings.Queries;

public record CheckAvailabilityQuery(
    DateTime StartDate,
    DateTime EndDate,
    Guid? ExcludeBookingId = null
) : IRequest<BookingAvailabilityDto>;

public class CheckAvailabilityQueryHandler(
    BookingDbContext context,
    ILogger<CheckAvailabilityQueryHandler> logger) 
    : IRequestHandler<CheckAvailabilityQuery, BookingAvailabilityDto>
{
    public async Task<BookingAvailabilityDto> Handle(CheckAvailabilityQuery request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Checking availability from {StartDate} to {EndDate}",
            request.StartDate, request.EndDate);

        if (request.StartDate >= request.EndDate)
        {
            throw new ArgumentException("Start date must be before end date");
        }

        // Get all active sleeping accommodations
        var accommodations = await context.SleepingAccommodationReadModels
            .Where(sa => sa.IsActive)
            .ToListAsync(cancellationToken);

        // Get overlapping bookings (excluding cancelled ones and optionally a specific booking)
        var overlappingBookingsQuery = context.BookingReadModels
            .Where(b => b.Status != BookingStatus.Cancelled &&
                       b.StartDate < request.EndDate &&
                       b.EndDate > request.StartDate);

        if (request.ExcludeBookingId.HasValue)
        {
            overlappingBookingsQuery = overlappingBookingsQuery
                .Where(b => b.Id != request.ExcludeBookingId.Value);
        }

        var overlappingBookings = await overlappingBookingsQuery.ToListAsync(cancellationToken);

        var accommodationAvailability = new List<SleepingAccommodationAvailabilityDto>();

        foreach (var accommodation in accommodations)
        {
            var conflictingBookings = new List<ConflictingBookingDto>();
            var totalBookedCapacity = 0;

            foreach (var booking in overlappingBookings)
            {
                var bookingItems = JsonSerializer.Deserialize<List<BookingItem>>(booking.BookingItemsJson) ?? new();
                var accommodationBooking = bookingItems.FirstOrDefault(bi => bi.SleepingAccommodationId == accommodation.Id);
                
                if (accommodationBooking != null)
                {
                    totalBookedCapacity += accommodationBooking.PersonCount;
                    conflictingBookings.Add(new ConflictingBookingDto(
                        booking.Id,
                        booking.StartDate,
                        booking.EndDate,
                        accommodationBooking.PersonCount,
                        booking.UserName
                    ));
                }
            }

            var availableCapacity = accommodation.MaxCapacity - totalBookedCapacity;
            var isAvailable = availableCapacity > 0;

            accommodationAvailability.Add(new SleepingAccommodationAvailabilityDto(
                accommodation.Id,
                accommodation.Name,
                accommodation.MaxCapacity,
                isAvailable,
                Math.Max(0, availableCapacity),
                conflictingBookings
            ));
        }

        return new BookingAvailabilityDto(
            request.StartDate,
            request.EndDate,
            accommodationAvailability
        );
    }
}