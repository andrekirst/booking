namespace Booking.Api.Domain.ValueObjects;

public class AccommodationChange
{
    public Guid SleepingAccommodationId { get; set; }
    public int PreviousPersonCount { get; set; }
    public int NewPersonCount { get; set; }
    public ChangeType ChangeType { get; set; }
    
    public AccommodationChange(Guid sleepingAccommodationId, int previousPersonCount, int newPersonCount, ChangeType changeType)
    {
        if (previousPersonCount < 0)
        {
            throw new ArgumentException("Previous person count cannot be negative", nameof(previousPersonCount));
        }
        
        if (newPersonCount < 0)
        {
            throw new ArgumentException("New person count cannot be negative", nameof(newPersonCount));
        }
        
        SleepingAccommodationId = sleepingAccommodationId;
        PreviousPersonCount = previousPersonCount;
        NewPersonCount = newPersonCount;
        ChangeType = changeType;
    }
    
    // Parameterless constructor for EF Core
    private AccommodationChange() { }
}

public enum ChangeType
{
    Added,
    Removed,
    Modified
}