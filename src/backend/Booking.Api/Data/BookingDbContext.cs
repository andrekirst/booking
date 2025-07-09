using Booking.Api.Domain.Entities;
using Booking.Api.Domain.ReadModels;
using Microsoft.EntityFrameworkCore;

namespace Booking.Api.Data;

public class BookingDbContext : DbContext
{
    public BookingDbContext(DbContextOptions<BookingDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Domain.Entities.Booking> Bookings { get; set; }
    public DbSet<SleepingAccommodation> SleepingAccommodations { get; set; }
    
    // Event Sourcing Tables
    public DbSet<EventStoreEvent> EventStoreEvents { get; set; }
    public DbSet<EventStoreSnapshot> EventStoreSnapshots { get; set; }
    
    // Read Models
    public DbSet<SleepingAccommodationReadModel> SleepingAccommodationReadModels { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Apply all entity configurations from the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingDbContext).Assembly);
    }
}