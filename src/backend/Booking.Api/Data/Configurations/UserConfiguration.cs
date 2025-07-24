using Booking.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Api.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        
        builder.HasKey(u => u.Id);
        
        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);
            
        builder.HasIndex(u => u.Email)
            .IsUnique();
            
        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(256);
            
        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(256);
            
        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(256);
            
        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(20);
            
        builder.Property(u => u.IsActive)
            .HasDefaultValue(true);
            
        builder.Property(u => u.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
            
        builder.Property(u => u.ChangedAt)
            .IsRequired(false);
            
        // Registration and Email Verification fields
        builder.Property(u => u.EmailVerified)
            .HasDefaultValue(false);
            
        builder.Property(u => u.EmailVerificationToken)
            .IsRequired(false)
            .HasMaxLength(64);
            
        builder.Property(u => u.EmailVerificationTokenExpiry)
            .IsRequired(false);
            
        builder.Property(u => u.RegistrationDate)
            .IsRequired(false);
            
        builder.Property(u => u.EmailVerifiedAt)
            .IsRequired(false);
            
        // Administrator Approval fields
        builder.Property(u => u.IsApprovedForBooking)
            .HasDefaultValue(false);
            
        builder.Property(u => u.ApprovedForBookingAt)
            .IsRequired(false);
            
        builder.Property(u => u.ApprovedById)
            .IsRequired(false);
            
        // Self-referencing relationship for ApprovedBy
        builder.HasOne(u => u.ApprovedBy)
            .WithMany()
            .HasForeignKey(u => u.ApprovedById)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Global Query Filter for soft delete
        builder.HasQueryFilter(u => u.IsActive);
    }
}