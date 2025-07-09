using Booking.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Api.Data.Configurations;

public class EventStoreSnapshotConfiguration : IEntityTypeConfiguration<EventStoreSnapshot>
{
    public void Configure(EntityTypeBuilder<EventStoreSnapshot> builder)
    {
        builder.ToTable("EventStoreSnapshots");
        
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.Id)
            .ValueGeneratedNever();
        
        builder.Property(s => s.AggregateId)
            .IsRequired();
        
        builder.Property(s => s.AggregateType)
            .IsRequired()
            .HasMaxLength(255);
        
        builder.Property(s => s.SnapshotData)
            .IsRequired()
            .HasColumnType("jsonb");
        
        builder.Property(s => s.Version)
            .IsRequired();
        
        builder.Property(s => s.Timestamp)
            .IsRequired();
        
        // Only one snapshot per aggregate
        builder.HasIndex(s => s.AggregateId)
            .IsUnique();
        
        // Index for efficient querying
        builder.HasIndex(s => s.AggregateType);
        builder.HasIndex(s => s.Timestamp);
    }
}