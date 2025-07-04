# Database Setup

This directory contains the PostgreSQL database schema and setup scripts for the Booking System.

## Files

- `schema.sql` - Database schema with table definitions, indexes, and triggers
- `../scripts/init-db.sh` - Database initialization script

## Database Schema

The database includes the following tables designed for the family garden booking system:

### users

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for each user |
| name | VARCHAR(255) NOT NULL | Full name of the user |
| email | VARCHAR(255) UNIQUE NOT NULL | Email address (unique) |
| password_hash | VARCHAR(255) NOT NULL | Hashed password |
| role | VARCHAR(50) NOT NULL | User role (ADMIN or MEMBER) |
| registration_date | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | When user registered |

### rooms

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for each room |
| name | VARCHAR(100) NOT NULL | Name of the room |
| capacity | INT NOT NULL | Maximum number of people |
| extra_beds | INT DEFAULT 0 | Number of additional beds available |
| is_tent_allowed | BOOLEAN DEFAULT FALSE | Whether tent camping is allowed |

### bookings

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier for each booking |
| user_id | INT REFERENCES users(id) | User who made the booking |
| room_id | INT REFERENCES rooms(id) | Room that was booked |
| booking_date | DATE NOT NULL | Start date of the booking |
| number_of_nights | INT NOT NULL | Number of nights booked |
| number_of_people | INT NOT NULL | Number of people for the booking |
| status | VARCHAR(50) NOT NULL DEFAULT 'pending' | Booking status |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | When booking was created |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | When booking was last updated |

### permissions

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier |
| user_id | INT REFERENCES users(id) | User this permission applies to |
| can_book | BOOLEAN DEFAULT FALSE | Whether user can make bookings |

### Indexes

- `idx_users_email` - Index on email for fast user lookups
- `idx_bookings_user_id` - Index on user_id for user's bookings
- `idx_bookings_booking_date` - Index on booking_date for date range queries
- `idx_rooms_name` - Index on room name for fast room lookups

### Triggers

- `update_bookings_updated_at` - Automatically updates the `updated_at` timestamp when a booking is modified

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
