using Booking.Api.Models;

namespace Booking.Api.Services;

public interface IBookingService
{
    Task<IEnumerable<Models.Booking>> GetAllBookingsAsync();
    Task<Models.Booking?> GetBookingByIdAsync(int id);
    Task<Models.Booking> CreateBookingAsync(Models.Booking booking);
    Task<Models.Booking?> UpdateBookingAsync(int id, Models.Booking booking);
    Task<bool> DeleteBookingAsync(int id);
    Task<IEnumerable<Models.Booking>> GetBookingsByCustomerEmailAsync(string email);
    Task<IEnumerable<Models.Booking>> GetBookingsByDateRangeAsync(DateTime startDate, DateTime endDate);
}
