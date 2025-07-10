using Booking.Api.Domain.Entities;
using Booking.Api.Domain.ReadModels;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Data;

public class BookingDbContext(DbContextOptions<BookingDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Domain.Entities.Booking> Bookings => Set<Domain.Entities.Booking>();
    public DbSet<SleepingAccommodation> SleepingAccommodations => Set<SleepingAccommodation>();
    
    // Event Sourcing Tables
    public DbSet<EventStoreEvent> EventStoreEvents => Set<EventStoreEvent>();
    public DbSet<EventStoreSnapshot> EventStoreSnapshots => Set<EventStoreSnapshot>();
    
    // Read Models
    public DbSet<SleepingAccommodationReadModel> SleepingAccommodationReadModels => Set<SleepingAccommodationReadModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Apply all entity configurations from the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingDbContext).Assembly);
    }
}