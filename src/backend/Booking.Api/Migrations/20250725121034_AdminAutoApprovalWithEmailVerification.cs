using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdminAutoApprovalWithEmailVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Erweiterte automatische Freigabe für Administratoren:
            // - Buchungsrechte (IsApprovedForBooking)
            // - Email-Verifikation (EmailVerified)
            // Beide sind notwendig für erfolgreiche Anmeldung
            migrationBuilder.Sql(@"
                UPDATE ""Users"" 
                SET ""IsApprovedForBooking"" = true, 
                    ""ApprovedForBookingAt"" = NOW() AT TIME ZONE 'UTC',
                    ""EmailVerified"" = true,
                    ""EmailVerifiedAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Role"" = 'Administrator' 
                AND (""IsApprovedForBooking"" = false OR ""EmailVerified"" = false);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback: Administrator-Freigaben und Email-Verifikation entfernen
            // WARNUNG: Entfernt Auto-Approval und Email-Verifikation für alle Administratoren
            migrationBuilder.Sql(@"
                UPDATE ""Users"" 
                SET ""IsApprovedForBooking"" = false, 
                    ""ApprovedForBookingAt"" = NULL,
                    ""EmailVerified"" = false,
                    ""EmailVerifiedAt"" = NULL
                WHERE ""Role"" = 'Administrator';
            ");
        }
    }
}
