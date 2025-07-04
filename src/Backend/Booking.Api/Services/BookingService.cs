using Booking.Api.Data;
using Booking.Api.Models;

namespace Booking.Api.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ILogger<BookingService> _logger;

    public BookingService(IBookingRepository bookingRepository, ILogger<BookingService> logger)
    {
        _bookingRepository = bookingRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<Models.Booking>> GetAllBookingsAsync()
    {
        try
        {
            _logger.LogInformation("Retrieving all bookings");
            return await _bookingRepository.GetAllAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all bookings");
            throw;
        }
    }

    public async Task<Models.Booking?> GetBookingByIdAsync(int id)
    {
        try
        {
            _logger.LogInformation("Retrieving booking with ID: {BookingId}", id);
            return await _bookingRepository.GetByIdAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving booking with ID: {BookingId}", id);
            throw;
        }
    }

    public async Task<Models.Booking> CreateBookingAsync(Models.Booking booking)
    {
        try
        {
            _logger.LogInformation("Creating new booking for customer: {CustomerName}", booking.CustomerName);
            
            // Validate booking times
            ValidateBookingTimes(booking);
            
            return await _bookingRepository.CreateAsync(booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking for customer: {CustomerName}", booking.CustomerName);
            throw;
        }
    }

    public async Task<Models.Booking?> UpdateBookingAsync(int id, Models.Booking booking)
    {
        try
        {
            _logger.LogInformation("Updating booking with ID: {BookingId}", id);
            
            // Validate booking times
            ValidateBookingTimes(booking);
            
            return await _bookingRepository.UpdateAsync(id, booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating booking with ID: {BookingId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteBookingAsync(int id)
    {
        try
        {
            _logger.LogInformation("Deleting booking with ID: {BookingId}", id);
            return await _bookingRepository.DeleteAsync(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting booking with ID: {BookingId}", id);
            throw;
        }
    }

    public async Task<IEnumerable<Models.Booking>> GetBookingsByCustomerEmailAsync(string email)
    {
        try
        {
            _logger.LogInformation("Retrieving bookings for customer email: {Email}", email);
            return await _bookingRepository.GetByCustomerEmailAsync(email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving bookings for customer email: {Email}", email);
            throw;
        }
    }

    public async Task<IEnumerable<Models.Booking>> GetBookingsByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        try
        {
            _logger.LogInformation("Retrieving bookings between {StartDate} and {EndDate}", startDate, endDate);
            
            if (startDate > endDate)
            {
                throw new ArgumentException("Start date must be before or equal to end date");
            }
            
            return await _bookingRepository.GetByDateRangeAsync(startDate, endDate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving bookings between {StartDate} and {EndDate}", startDate, endDate);
            throw;
        }
    }

    private static void ValidateBookingTimes(Models.Booking booking)
    {
        if (booking.StartTime >= booking.EndTime)
        {
            throw new ArgumentException("Start time must be before end time");
        }
        
        if (booking.BookingDate.Date != booking.StartTime.Date || 
            booking.BookingDate.Date != booking.EndTime.Date)
        {
            throw new ArgumentException("Booking date must match the date of start and end times");
        }
        
        if (booking.BookingDate < DateTime.Today)
        {
            throw new ArgumentException("Cannot create bookings for past dates");
        }
    }
}
