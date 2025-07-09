using Booking.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Api.Data.Configurations;

public class EventStoreEventConfiguration : IEntityTypeConfiguration<EventStoreEvent>
{
    public void Configure(EntityTypeBuilder<EventStoreEvent> builder)
    {
        builder.ToTable("EventStoreEvents");
        
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.Id)
            .ValueGeneratedNever();
        
        builder.Property(e => e.AggregateId)
            .IsRequired();
        
        builder.Property(e => e.AggregateType)
            .IsRequired()
            .HasMaxLength(255);
        
        builder.Property(e => e.EventType)
            .IsRequired()
            .HasMaxLength(255);
        
        builder.Property(e => e.EventData)
            .IsRequired()
            .HasColumnType("jsonb");
        
        builder.Property(e => e.Version)
            .IsRequired();
        
        builder.Property(e => e.Timestamp)
            .IsRequired();
        
        // Unique constraint for aggregate versioning
        builder.HasIndex(e => new { e.AggregateId, e.Version })
            .IsUnique();
        
        // Index for efficient querying
        builder.HasIndex(e => e.AggregateId);
        builder.HasIndex(e => e.AggregateType);
        builder.HasIndex(e => e.Timestamp);
    }
}