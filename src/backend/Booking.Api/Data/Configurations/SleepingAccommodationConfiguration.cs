using Booking.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Api.Data.Configurations;

public class SleepingAccommodationConfiguration : IEntityTypeConfiguration<SleepingAccommodation>
{
    public void Configure(EntityTypeBuilder<SleepingAccommodation> builder)
    {
        builder.ToTable("SleepingAccommodations");
        
        builder.HasKey(sa => sa.Id);
        
        builder.Property(sa => sa.Name)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(sa => sa.Type)
            .IsRequired()
            .HasConversion<string>();
            
        builder.Property(sa => sa.MaxCapacity)
            .IsRequired();
            
        builder.Property(sa => sa.IsActive)
            .IsRequired()
            .HasDefaultValue(true);
            
        builder.Property(sa => sa.CreatedAt)
            .IsRequired();
            
        builder.Property(sa => sa.ChangedAt)
            .IsRequired(false);
            
        // Index for active accommodations
        builder.HasIndex(sa => sa.IsActive);
    }
}