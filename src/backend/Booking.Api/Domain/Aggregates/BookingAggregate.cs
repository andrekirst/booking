using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;
using Booking.Api.Domain.Events.Bookings;
using Booking.Api.Domain.ValueObjects;
using Booking.Api.Attributes;

namespace Booking.Api.Domain.Aggregates;

public class BookingAggregate : AggregateRoot
{
    public int UserId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public BookingStatus Status { get; private set; }
    public string? Notes { get; private set; }
    public List<BookingItem> BookingItems { get; private set; } = new();

    // Parameterless constructor for event sourcing
    public BookingAggregate() { }

    // Factory method for creating new bookings
    public static BookingAggregate Create(
        Guid id, 
        int userId, 
        DateTime startDate, 
        DateTime endDate, 
        List<BookingItem> bookingItems,
        string? notes = null)
    {
        // Use centralized validation logic consistent with API validation
        var validationResult = DateRangeValidationAttribute.ValidateDateRange(startDate, endDate, allowSameDay: false, allowToday: true);
        if (!validationResult.IsValid)
        {
            throw new ArgumentException(validationResult.ErrorMessage);
        }

        if (bookingItems == null || bookingItems.Count == 0)
        {
            throw new ArgumentException("At least one booking item is required");
        }

        var aggregate = new BookingAggregate();
        
        var createdEvent = new BookingCreatedEvent
        {
            BookingId = id,
            UserId = userId,
            StartDate = startDate,
            EndDate = endDate,
            Status = BookingStatus.Pending,
            Notes = notes,
            BookingItems = bookingItems.ToList()
        };

        aggregate.ApplyEvent(createdEvent);
        return aggregate;
    }

    public void Update(DateTime startDate, DateTime endDate, List<BookingItem> bookingItems, string? notes = null)
    {
        if (Status == BookingStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot update a cancelled booking");
        }

        // Use centralized validation logic consistent with API validation
        var validationResult = DateRangeValidationAttribute.ValidateDateRange(startDate, endDate, allowSameDay: false, allowToday: true);
        if (!validationResult.IsValid)
        {
            throw new ArgumentException(validationResult.ErrorMessage);
        }

        if (bookingItems == null || bookingItems.Count == 0)
        {
            throw new ArgumentException("At least one booking item is required");
        }

        var updatedEvent = new BookingUpdatedEvent
        {
            BookingId = Id,
            StartDate = startDate,
            EndDate = endDate,
            Notes = notes,
            BookingItems = bookingItems.ToList()
        };

        ApplyEvent(updatedEvent);
    }

    public void Confirm()
    {
        if (Status != BookingStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot confirm booking with status {Status}");
        }

        var confirmedEvent = new BookingConfirmedEvent
        {
            BookingId = Id
        };

        ApplyEvent(confirmedEvent);
    }

    public void Cancel()
    {
        if (Status == BookingStatus.Cancelled)
        {
            throw new InvalidOperationException("Booking is already cancelled");
        }

        if (Status == BookingStatus.Completed)
        {
            throw new InvalidOperationException("Cannot cancel a completed booking");
        }

        var cancelledEvent = new BookingCancelledEvent
        {
            BookingId = Id
        };

        ApplyEvent(cancelledEvent);
    }

    protected override void Apply(DomainEvent domainEvent)
    {
        switch (domainEvent)
        {
            case BookingCreatedEvent e:
                Id = e.BookingId;
                UserId = e.UserId;
                StartDate = e.StartDate;
                EndDate = e.EndDate;
                Status = e.Status;
                Notes = e.Notes;
                BookingItems = e.BookingItems.ToList();
                break;

            case BookingUpdatedEvent e:
                StartDate = e.StartDate;
                EndDate = e.EndDate;
                Notes = e.Notes;
                BookingItems = e.BookingItems.ToList();
                break;

            case BookingConfirmedEvent:
                Status = BookingStatus.Confirmed;
                break;

            case BookingCancelledEvent:
                Status = BookingStatus.Cancelled;
                break;
        }
    }

    public override string GetAggregateType() => "BookingAggregate";
}