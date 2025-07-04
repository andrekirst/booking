# Database Setup

This directory contains the PostgreSQL database schema and setup scripts for the Booking System.

## Files

- `schema.sql` - Database schema with table definitions, indexes, and triggers
- `../scripts/init-db.sh` - Database initialization script

## Database Schema

The database includes the following table:

### bookings

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for each booking |
| customer_name | VARCHAR(255) NOT NULL | Name of the customer |
| customer_email | VARCHAR(255) NOT NULL | Email address of the customer |
| service_type | VARCHAR(100) NOT NULL | Type of service being booked |
| booking_date | TIMESTAMP NOT NULL | Date of the booking |
| start_time | TIMESTAMP NOT NULL | Start time of the booking |
| end_time | TIMESTAMP NOT NULL | End time of the booking |
| status | VARCHAR(50) NOT NULL DEFAULT 'pending' | Status of the booking |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | When the record was last updated |

### Indexes

- `idx_bookings_customer_email` - Index on customer_email for fast lookups
- `idx_bookings_booking_date` - Index on booking_date for date range queries
- `idx_bookings_status` - Index on status for filtering by status
- `idx_bookings_service_type` - Index on service_type for filtering by service

### Triggers

- `update_bookings_updated_at` - Automatically updates the `updated_at` timestamp when a record is modified

## Setup Instructions

1. **Install PostgreSQL** (if not already installed)
2. **Configure environment variables** (optional):
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=booking_system
   export DB_USER=postgres
   export DB_PASSWORD=postgres
   ```
3. **Run the initialization script**:
   ```bash
   ./scripts/init-db.sh
   ```

## Connection String

The application uses the following connection string format:
```
Host=localhost;Port=5432;Database=booking_system;Username=postgres;Password=postgres
```

### Environment Variable Override

You can override the connection string using the `ConnectionStrings__Main` environment variable:
```bash
export ConnectionStrings__Main="Host=myhost;Port=5432;Database=booking_system;Username=myuser;Password=mypassword"
```

## Application Configuration

The application uses `NpgsqlDataSource` with connection pooling for optimal performance. The connection string is configured in:
- `appsettings.json` - Default configuration
- Environment variable `ConnectionStrings__Main` - Production override
