using Dapper;
using Npgsql;
using System.Data;
using Booking.Api.Models;

namespace Booking.Api.Data;

public interface IBookingRepository
{
    Task<IEnumerable<Models.Booking>> GetAllAsync();
    Task<Models.Booking?> GetByIdAsync(int id);
    Task<Models.Booking> CreateAsync(Models.Booking booking);
    Task<Models.Booking?> UpdateAsync(int id, Models.Booking booking);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<Models.Booking>> GetByCustomerEmailAsync(string email);
    Task<IEnumerable<Models.Booking>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
}

public class BookingRepository : IBookingRepository
{
    private readonly NpgsqlDataSource _dataSource;

    public BookingRepository(NpgsqlDataSource dataSource)
    {
        _dataSource = dataSource;
    }

    private async Task<NpgsqlConnection> GetConnectionAsync()
    {
        return await _dataSource.OpenConnectionAsync();
    }

    public async Task<IEnumerable<Models.Booking>> GetAllAsync()
    {
        using var connection = await GetConnectionAsync();
        var sql = @"
            SELECT id, customer_name, customer_email, service_type, booking_date, 
                   start_time, end_time, notes, status, created_at, updated_at
            FROM bookings
            ORDER BY booking_date DESC";
        
        return await connection.QueryAsync<Models.Booking>(sql);
    }

    public async Task<Models.Booking?> GetByIdAsync(int id)
    {
        using var connection = await GetConnectionAsync();
        var sql = @"
            SELECT id, customer_name, customer_email, service_type, booking_date, 
                   start_time, end_time, notes, status, created_at, updated_at
            FROM bookings 
            WHERE id = @Id";
        
        return await connection.QueryFirstOrDefaultAsync<Models.Booking>(sql, new { Id = id });
    }

    public async Task<Models.Booking> CreateAsync(Models.Booking booking)
    {
        using var connection = await GetConnectionAsync();
        var sql = @"
            INSERT INTO bookings (customer_name, customer_email, service_type, booking_date, 
                                start_time, end_time, notes, status, created_at)
            VALUES (@CustomerName, @CustomerEmail, @ServiceType, @BookingDate, 
                    @StartTime, @EndTime, @Notes, @Status, @CreatedAt)
            RETURNING id, customer_name, customer_email, service_type, booking_date, 
                      start_time, end_time, notes, status, created_at, updated_at";
        
        booking.CreatedAt = DateTime.UtcNow;
        return await connection.QueryFirstAsync<Models.Booking>(sql, booking);
    }

    public async Task<Models.Booking?> UpdateAsync(int id, Models.Booking booking)
    {
        using var connection = await GetConnectionAsync();
        var sql = @"
            UPDATE bookings 
            SET customer_name = @CustomerName, customer_email = @CustomerEmail, 
                service_type = @ServiceType, booking_date = @BookingDate,
                start_time = @StartTime, end_time = @EndTime, notes = @Notes,
                status = @Status, updated_at = @UpdatedAt
            WHERE id = @Id
            RETURNING id, customer_name, customer_email, service_type, booking_date, 
                      start_time, end_time, notes, status, created_at, updated_at";
        
        booking.Id = id;
        booking.UpdatedAt = DateTime.UtcNow;
        return await connection.QueryFirstOrDefaultAsync<Models.Booking>(sql, booking);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var connection = await GetConnectionAsync();
        var sql = "DELETE FROM bookings WHERE id = @Id";
        var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
        return rowsAffected > 0;
    }

    public async Task<IEnumerable<Models.Booking>> GetByCustomerEmailAsync(string email)
    {
        using var connection = await GetConnectionAsync();
        var sql = @"
            SELECT id, customer_name, customer_email, service_type, booking_date, 
                   start_time, end_time, notes, status, created_at, updated_at
            FROM bookings 
            WHERE customer_email = @Email
            ORDER BY booking_date DESC";
        
        return await connection.QueryAsync<Models.Booking>(sql, new { Email = email });
    }

    public async Task<IEnumerable<Models.Booking>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        using var connection = await GetConnectionAsync();
        var sql = @"
            SELECT id, customer_name, customer_email, service_type, booking_date, 
                   start_time, end_time, notes, status, created_at, updated_at
            FROM bookings 
            WHERE booking_date >= @StartDate AND booking_date <= @EndDate
            ORDER BY booking_date ASC";
        
        return await connection.QueryAsync<Models.Booking>(sql, new { StartDate = startDate, EndDate = endDate });
    }
}
