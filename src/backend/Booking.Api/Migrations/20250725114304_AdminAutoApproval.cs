using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdminAutoApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Automatische Freigabe aller Administrator-Benutzer für Buchungen
            // Verwendet korrekten String-Vergleich da Role als String gespeichert wird
            migrationBuilder.Sql(@"
                UPDATE ""Users"" 
                SET ""IsApprovedForBooking"" = true, 
                    ""ApprovedForBookingAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Role"" = 'Administrator' 
                AND ""IsApprovedForBooking"" = false;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rollback: Administrator-Freigaben wieder entfernen
            // WARNUNG: Entfernt die Auto-Approval für alle Administratoren
            migrationBuilder.Sql(@"
                UPDATE ""Users"" 
                SET ""IsApprovedForBooking"" = false, 
                    ""ApprovedForBookingAt"" = NULL
                WHERE ""Role"" = 'Administrator';
            ");
        }
    }
}
