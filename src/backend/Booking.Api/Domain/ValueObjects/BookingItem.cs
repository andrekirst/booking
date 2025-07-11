namespace Booking.Api.Domain.ValueObjects;

public class BookingItem
{
    public Guid SleepingAccommodationId { get; set; }
    public int PersonCount { get; set; }
    
    public BookingItem(Guid sleepingAccommodationId, int personCount)
    {
        if (personCount <= 0)
        {
            throw new ArgumentException("Person count must be greater than zero", nameof(personCount));
        }
        
        SleepingAccommodationId = sleepingAccommodationId;
        PersonCount = personCount;
    }
    
    // Parameterless constructor for EF Core
    private BookingItem() { }
}