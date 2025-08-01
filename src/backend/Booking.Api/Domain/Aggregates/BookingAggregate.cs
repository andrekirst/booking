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

    public virtual void ChangeDateRange(DateTime newStartDate, DateTime newEndDate, string? changeReason = null)
    {
        ValidateBookingCanBeModified();

        // Use centralized validation logic consistent with API validation
        var validationResult = DateRangeValidationAttribute.ValidateDateRange(newStartDate, newEndDate, allowSameDay: false, allowToday: true);
        if (!validationResult.IsValid)
        {
            throw new ArgumentException(validationResult.ErrorMessage);
        }

        // Only emit event if dates actually changed
        if (StartDate == newStartDate && EndDate == newEndDate)
        {
            return;
        }

        var previousNights = (EndDate - StartDate).Days;
        var newNights = (newEndDate - newStartDate).Days;

        var dateRangeChangedEvent = new BookingDateRangeChangedEvent
        {
            BookingId = Id,
            PreviousStartDate = StartDate,
            PreviousEndDate = EndDate,
            NewStartDate = newStartDate,
            NewEndDate = newEndDate,
            PreviousNights = previousNights,
            NewNights = newNights,
            ChangeReason = changeReason
        };

        ApplyEvent(dateRangeChangedEvent);
    }

    public virtual void ChangeAccommodations(List<BookingItem> newBookingItems)
    {
        ValidateBookingCanBeModified();

        if (newBookingItems == null || newBookingItems.Count == 0)
        {
            throw new ArgumentException("At least one booking item is required");
        }

        var accommodationChanges = CalculateAccommodationChanges(BookingItems, newBookingItems);
        
        // Only emit event if accommodations actually changed
        if (accommodationChanges.Count == 0)
        {
            return;
        }

        var previousTotalPersons = BookingItems.Sum(item => item.PersonCount);
        var newTotalPersons = newBookingItems.Sum(item => item.PersonCount);

        var accommodationsChangedEvent = new BookingAccommodationsChangedEvent
        {
            BookingId = Id,
            AccommodationChanges = accommodationChanges,
            PreviousTotalPersons = previousTotalPersons,
            NewTotalPersons = newTotalPersons
        };

        ApplyEvent(accommodationsChangedEvent);
    }

    public virtual void ChangeNotes(string? newNotes)
    {
        ValidateBookingCanBeModified();

        // Only emit event if notes actually changed
        if (string.Equals(Notes, newNotes, StringComparison.Ordinal))
        {
            return;
        }

        var notesChangedEvent = new BookingNotesChangedEvent
        {
            BookingId = Id,
            PreviousNotes = Notes,
            NewNotes = newNotes
        };

        ApplyEvent(notesChangedEvent);
    }

    public void UpdateBooking(DateTime startDate, DateTime endDate, List<BookingItem> bookingItems, string? notes = null, string? changeReason = null)
    {
        ValidateBookingCanBeModified();

        // Use individual methods for proper change tracking
        ChangeDateRange(startDate, endDate, changeReason);
        ChangeAccommodations(bookingItems);
        ChangeNotes(notes);

        // Only emit legacy event if needed for backward compatibility
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

    public void Accept()
    {
        if (Status != BookingStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot accept booking with status {Status}");
        }

        var acceptedEvent = new BookingAcceptedEvent
        {
            BookingId = Id
        };

        ApplyEvent(acceptedEvent);
    }

    public void Reject()
    {
        if (Status != BookingStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot reject booking with status {Status}");
        }

        var rejectedEvent = new BookingRejectedEvent
        {
            BookingId = Id
        };

        ApplyEvent(rejectedEvent);
    }

    // Helper Methods
    private void ValidateBookingCanBeModified()
    {
        if (Status == BookingStatus.Cancelled)
        {
            throw new InvalidOperationException("Cannot modify a cancelled booking");
        }

        if (Status == BookingStatus.Completed)
        {
            throw new InvalidOperationException("Cannot modify a completed booking");
        }

        if (Status == BookingStatus.Rejected)
        {
            throw new InvalidOperationException("Cannot modify booking with status Rejected");
        }
    }

    private List<AccommodationChange> CalculateAccommodationChanges(List<BookingItem> previousItems, List<BookingItem> newItems)
    {
        var changes = new List<AccommodationChange>();
        var previousDict = previousItems.ToDictionary(item => item.SleepingAccommodationId, item => item.PersonCount);
        var newDict = newItems.ToDictionary(item => item.SleepingAccommodationId, item => item.PersonCount);

        // Check for removed accommodations
        foreach (var previous in previousDict)
        {
            if (!newDict.ContainsKey(previous.Key))
            {
                changes.Add(new AccommodationChange(previous.Key, previous.Value, 0, ChangeType.Removed));
            }
        }

        // Check for added or modified accommodations
        foreach (var newItem in newDict)
        {
            if (previousDict.TryGetValue(newItem.Key, out var previousCount))
            {
                // Modified accommodation
                if (previousCount != newItem.Value)
                {
                    changes.Add(new AccommodationChange(newItem.Key, previousCount, newItem.Value, ChangeType.Modified));
                }
            }
            else
            {
                // Added accommodation
                changes.Add(new AccommodationChange(newItem.Key, 0, newItem.Value, ChangeType.Added));
            }
        }

        return changes;
    }

    private string GetAccommodationName(Guid accommodationId)
    {
        // This would typically be resolved through a domain service or repository
        // For now, return a placeholder or the ID itself
        return $"Accommodation-{accommodationId.ToString()[..8]}";
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

            case BookingDateRangeChangedEvent e:
                StartDate = e.NewStartDate;
                EndDate = e.NewEndDate;
                break;

            case BookingAccommodationsChangedEvent e:
                // Apply accommodation changes - the event contains the full picture
                // We need to reconstruct the final state based on the changes
                var updatedItems = new List<BookingItem>();
                var currentDict = BookingItems.ToDictionary(item => item.SleepingAccommodationId, item => item.PersonCount);

                // Start with all current items
                foreach (var item in BookingItems)
                {
                    updatedItems.Add(new BookingItem(item.SleepingAccommodationId, item.PersonCount));
                }

                // Apply each change
                foreach (var change in e.AccommodationChanges)
                {
                    var existingItem = updatedItems.FirstOrDefault(item => item.SleepingAccommodationId == change.SleepingAccommodationId);
                    
                    switch (change.ChangeType)
                    {
                        case ChangeType.Added:
                            if (existingItem == null)
                            {
                                updatedItems.Add(new BookingItem(change.SleepingAccommodationId, change.NewPersonCount));
                            }
                            break;
                        case ChangeType.Modified:
                            if (existingItem != null)
                            {
                                updatedItems.Remove(existingItem);
                                updatedItems.Add(new BookingItem(change.SleepingAccommodationId, change.NewPersonCount));
                            }
                            break;
                        case ChangeType.Removed:
                            if (existingItem != null)
                            {
                                updatedItems.Remove(existingItem);
                            }
                            break;
                    }
                }

                BookingItems = updatedItems;
                break;

            case BookingNotesChangedEvent e:
                Notes = e.NewNotes;
                break;

            case BookingConfirmedEvent:
                Status = BookingStatus.Confirmed;
                break;

            case BookingCancelledEvent:
                Status = BookingStatus.Cancelled;
                break;

            case BookingAcceptedEvent:
                Status = BookingStatus.Accepted;
                break;

            case BookingRejectedEvent:
                Status = BookingStatus.Rejected;
                break;
        }
    }

    public override string GetAggregateType() => "BookingAggregate";
}