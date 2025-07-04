#!/bin/bash

# Database initialization script for the booking system
# This script creates the database and applies the schema

set -e

# Default database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-booking_system}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Initializing PostgreSQL database...${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to PostgreSQL server.${NC}"
    echo -e "${RED}Please check your database configuration:${NC}"
    echo -e "${RED}  Host: $DB_HOST${NC}"
    echo -e "${RED}  Port: $DB_PORT${NC}"
    echo -e "${RED}  User: $DB_USER${NC}"
    exit 1
fi

# Create database if it doesn't exist
echo -e "${YELLOW}Creating database '$DB_NAME' if it doesn't exist...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo -e "${GREEN}Database '$DB_NAME' already exists.${NC}"

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Apply database schema
SCHEMA_FILE="$PROJECT_ROOT/database/schema.sql"
if [ -f "$SCHEMA_FILE" ]; then
    echo -e "${YELLOW}Applying database schema...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE"
    echo -e "${GREEN}Schema applied successfully!${NC}"
else
    echo -e "${RED}Error: Schema file not found at $SCHEMA_FILE${NC}"
    exit 1
fi

# Verify tables were created
echo -e "${YELLOW}Verifying database setup...${NC}"
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings';" | xargs)

if [ "$TABLE_COUNT" -eq "1" ]; then
    echo -e "${GREEN}✓ Database initialization completed successfully!${NC}"
    echo -e "${GREEN}✓ Tables created: bookings${NC}"
    echo -e "${GREEN}✓ Database is ready for use.${NC}"
else
    echo -e "${RED}✗ Database initialization failed. Expected 1 table, found $TABLE_COUNT.${NC}"
    exit 1
fi

# Display connection string format
echo -e "${YELLOW}Connection string format:${NC}"
echo -e "${GREEN}Host=$DB_HOST;Port=$DB_PORT;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASSWORD${NC}"
