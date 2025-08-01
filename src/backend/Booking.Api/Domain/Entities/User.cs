using Booking.Api.Domain.Common;
using Booking.Api.Domain.Enums;

namespace Booking.Api.Domain.Entities;

public class User : IAuditableEntity, ISoftDeletable
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Member;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ChangedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    
    // Registration and Email Verification
    public bool EmailVerified { get; set; } = false;
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    
    // Administrator Approval for Booking Rights
    public bool IsApprovedForBooking { get; set; } = false;
    public DateTime? ApprovedForBookingAt { get; set; }
    public int? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
}