using Booking.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Api.Data.Configurations;

public class EmailSettingsConfiguration : IEntityTypeConfiguration<EmailSettings>
{
    public void Configure(EntityTypeBuilder<EmailSettings> builder)
    {
        builder.ToTable("EmailSettings");
        
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.SmtpHost)
            .IsRequired()
            .HasMaxLength(255);
            
        builder.Property(e => e.SmtpPort)
            .IsRequired();
            
        builder.Property(e => e.SmtpUsername)
            .IsRequired()
            .HasMaxLength(255);
            
        builder.Property(e => e.SmtpPassword)
            .IsRequired()
            .HasMaxLength(500); // Encrypted password will be longer
            
        builder.Property(e => e.FromName)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(e => e.FromEmail)
            .IsRequired()
            .HasMaxLength(255);
            
        builder.Property(e => e.UseTls)
            .IsRequired();
            
        builder.Property(e => e.IsConfigured)
            .IsRequired();
            
        builder.Property(e => e.CreatedAt)
            .IsRequired();
            
        builder.Property(e => e.UpdatedAt);
        
        // Ensure only one settings record exists
        builder.HasIndex(e => e.Id).IsUnique();
    }
}