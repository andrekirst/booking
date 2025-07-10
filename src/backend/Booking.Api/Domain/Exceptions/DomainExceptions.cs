namespace Booking.Api.Domain.Exceptions;

public class InvalidAccommodationNameException : Exception
{
    public InvalidAccommodationNameException() 
        : base("Sleeping accommodation name cannot be empty or whitespace") { }
}

public class InvalidAccommodationCapacityException : Exception
{
    public InvalidAccommodationCapacityException(int capacity) 
        : base($"Sleeping accommodation capacity must be greater than 0. Provided: {capacity}") { }
}

public class AccommodationAlreadyDeactivatedException : Exception
{
    public AccommodationAlreadyDeactivatedException(Guid accommodationId) 
        : base($"Sleeping accommodation {accommodationId} is already deactivated") { }
}

public class AccommodationAlreadyActivatedException : Exception
{
    public AccommodationAlreadyActivatedException(Guid accommodationId) 
        : base($"Sleeping accommodation {accommodationId} is already active") { }
}