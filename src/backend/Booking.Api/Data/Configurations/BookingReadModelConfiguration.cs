using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Booking.Api.Domain.ReadModels;

namespace Booking.Api.Data.Configurations;

public class BookingReadModelConfiguration : IEntityTypeConfiguration<BookingReadModel>
{
    public void Configure(EntityTypeBuilder<BookingReadModel> builder)
    {
        builder.ToTable("BookingReadModels");
        
        builder.HasKey(b => b.Id);
        
        builder.Property(b => b.Id)
            .IsRequired();
            
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
            .IsRequired();
            
        builder.Property(b => b.ChangedAt);
        
        builder.Property(b => b.LastEventVersion)
            .IsRequired();
            
        builder.Property(b => b.BookingItemsJson)
            .IsRequired()
            .HasColumnType("jsonb");
            
        builder.Property(b => b.UserName)
            .HasMaxLength(200);
            
        builder.Property(b => b.UserEmail)
            .HasMaxLength(255);
            
        builder.Property(b => b.TotalPersons)
            .IsRequired();
        
        // Indexes for performance
        builder.HasIndex(b => b.UserId);
        builder.HasIndex(b => b.StartDate);
        builder.HasIndex(b => b.EndDate);
        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => new { b.StartDate, b.EndDate });
        builder.HasIndex(b => b.UserEmail);
    }
}