using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSleepingAccommodationReadModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SleepingAccommodationReadModels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    MaxCapacity = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastEventVersion = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SleepingAccommodationReadModels", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SleepingAccommodationReadModels_CreatedAt",
                table: "SleepingAccommodationReadModels",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SleepingAccommodationReadModels_IsActive",
                table: "SleepingAccommodationReadModels",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_SleepingAccommodationReadModels_Type",
                table: "SleepingAccommodationReadModels",
                column: "Type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SleepingAccommodationReadModels");
        }
    }
}
