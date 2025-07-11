using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Api.Data.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Domain.Entities.Booking>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Booking> builder)
    {
        builder.ToTable("Bookings");
        
        builder.HasKey(b => b.Id);
        
        builder.Property(b => b.Id)
            .IsRequired()
            .ValueGeneratedOnAdd();
            
        builder.Property(b => b.UserId)
            .IsRequired();
            
        builder.Property(b => b.StartDate)
            .IsRequired();
            
        builder.Property(b => b.EndDate)
            .IsRequired();
            
        builder.Property(b => b.Status)
            .IsRequired()
            .HasConversion<string>();
            
        builder.Property(b => b.Notes)
            .HasMaxLength(1000);
            
        builder.Property(b => b.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
        builder.Property(b => b.ChangedAt)
            .IsRequired(false);
        
        // Configure relationship with User
        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Configure BookingItems as owned entity collection
        builder.OwnsMany(b => b.BookingItems, bi =>
        {
            bi.WithOwner().HasForeignKey("BookingId");
            bi.Property<int>("Id").ValueGeneratedOnAdd();
            bi.HasKey("Id");
            
            bi.Property(x => x.SleepingAccommodationId)
                .IsRequired();
                
            bi.Property(x => x.PersonCount)
                .IsRequired();
                
            bi.HasIndex(x => x.SleepingAccommodationId);
        });
        
        // Index for performance
        builder.HasIndex(b => b.UserId);
        builder.HasIndex(b => b.StartDate);
        builder.HasIndex(b => b.EndDate);
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => new { b.StartDate, b.EndDate });
    }
}