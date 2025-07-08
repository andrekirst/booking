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
            
        builder.Property(b => b.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
        builder.Property(b => b.ChangedAt)
            .IsRequired(false);
    }
}