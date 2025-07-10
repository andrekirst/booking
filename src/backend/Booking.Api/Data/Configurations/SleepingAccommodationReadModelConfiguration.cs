using Booking.Api.Domain.ReadModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Api.Data.Configurations;

public class SleepingAccommodationReadModelConfiguration : IEntityTypeConfiguration<SleepingAccommodationReadModel>
{
    public void Configure(EntityTypeBuilder<SleepingAccommodationReadModel> builder)
    {
        builder.ToTable("SleepingAccommodationReadModels");
        
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.Id)
            .ValueGeneratedNever();
        
        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(s => s.Type)
            .IsRequired()
            .HasConversion<int>();
        
        builder.Property(s => s.MaxCapacity)
            .IsRequired();
        
        builder.Property(s => s.IsActive)
            .IsRequired()
            .HasDefaultValue(true);
        
        builder.Property(s => s.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
        
        builder.Property(s => s.ChangedAt);
        
        builder.Property(s => s.LastEventVersion)
            .IsRequired();
        
        // Indexes for efficient querying
        builder.HasIndex(s => s.IsActive);
        builder.HasIndex(s => s.Type);
        builder.HasIndex(s => s.CreatedAt);
    }
}