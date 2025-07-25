using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Api.Migrations
{
    /// <inheritdoc />
    public partial class AutoApproveAdministrators : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Automatische Freigabe aller Administrator-Benutzer für Buchungen
            migrationBuilder.Sql(@"
                UPDATE ""Users"" 
                SET ""IsApprovedForBooking"" = true, 
                    ""ApprovedForBookingAt"" = NOW() AT TIME ZONE 'UTC'
                WHERE ""Role"" = 1 
                AND ""IsApprovedForBooking"" = false;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Rückgängigmachen der automatischen Administrator-Freigabe
            // WARNUNG: Dies entfernt die Freigabe aller Administratoren!
            migrationBuilder.Sql(@"
                UPDATE ""Users"" 
                SET ""IsApprovedForBooking"" = false, 
                    ""ApprovedForBookingAt"" = NULL
                WHERE ""Role"" = 1;
            ");
        }
    }
}
