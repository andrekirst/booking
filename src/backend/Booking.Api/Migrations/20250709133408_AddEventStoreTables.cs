using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEventStoreTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventStoreEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AggregateId = table.Column<Guid>(type: "uuid", nullable: false),
                    AggregateType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    EventType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    EventData = table.Column<string>(type: "jsonb", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventStoreEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventStoreSnapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AggregateId = table.Column<Guid>(type: "uuid", nullable: false),
                    AggregateType = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SnapshotData = table.Column<string>(type: "jsonb", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventStoreSnapshots", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EventStoreEvents_AggregateId",
                table: "EventStoreEvents",
                column: "AggregateId");

            migrationBuilder.CreateIndex(
                name: "IX_EventStoreEvents_AggregateId_Version",
                table: "EventStoreEvents",
                columns: new[] { "AggregateId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventStoreEvents_AggregateType",
                table: "EventStoreEvents",
                column: "AggregateType");

            migrationBuilder.CreateIndex(
                name: "IX_EventStoreEvents_Timestamp",
                table: "EventStoreEvents",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_EventStoreSnapshots_AggregateId",
                table: "EventStoreSnapshots",
                column: "AggregateId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventStoreSnapshots_AggregateType",
                table: "EventStoreSnapshots",
                column: "AggregateType");

            migrationBuilder.CreateIndex(
                name: "IX_EventStoreSnapshots_Timestamp",
                table: "EventStoreSnapshots",
                column: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventStoreEvents");

            migrationBuilder.DropTable(
                name: "EventStoreSnapshots");
        }
    }
}
