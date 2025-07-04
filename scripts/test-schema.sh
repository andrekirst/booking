#!/bin/bash

# Schema validation script for the booking system
# This script tests the database schema to ensure it meets requirements

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

echo -e "${YELLOW}Running database schema tests...${NC}"

# Test database connection
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to database.${NC}"
    exit 1
fi

# Define test queries
declare -A TESTS=(
    ["Users table exists"]="SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users'"
    ["Rooms table exists"]="SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'rooms'"
    ["Bookings table exists"]="SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'bookings'"
    ["Permissions table exists"]="SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'permissions'"
    ["Users email unique constraint"]="SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'users' AND constraint_type = 'UNIQUE'"
    ["Bookings foreign key to users"]="SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'bookings' AND constraint_type = 'FOREIGN KEY'"
    ["Email index exists"]="SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_email'"
    ["Booking date index exists"]="SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'bookings' AND indexname = 'idx_bookings_booking_date'"
    ["Trigger function exists"]="SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'update_updated_at_column'"
)

# Run tests
PASSED=0
FAILED=0

for test_name in "${!TESTS[@]}"; do
    query="${TESTS[$test_name]}"
    result=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "$query" | xargs)
    
    if [ "$result" -gt "0" ]; then
        echo -e "${GREEN}✓ $test_name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ $test_name${NC}"
        ((FAILED++))
    fi
done

# Test data integrity constraints
echo -e "${YELLOW}Testing data integrity constraints...${NC}"

# Test room capacity constraint
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO rooms (name, capacity) VALUES ('test_room', 0);" 2>/dev/null; then
    echo -e "${RED}✗ Room capacity constraint (should prevent capacity <= 0)${NC}"
    ((FAILED++))
    # Clean up
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DELETE FROM rooms WHERE name = 'test_room';" 2>/dev/null
else
    echo -e "${GREEN}✓ Room capacity constraint (prevents capacity <= 0)${NC}"
    ((PASSED++))
fi

# Test user role constraint
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO users (name, email, password_hash, role) VALUES ('test', 'test@test.com', 'hash', 'INVALID');" 2>/dev/null; then
    echo -e "${RED}✗ User role constraint (should only allow ADMIN or MEMBER)${NC}"
    ((FAILED++))
    # Clean up
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DELETE FROM users WHERE email = 'test@test.com';" 2>/dev/null
else
    echo -e "${GREEN}✓ User role constraint (only allows ADMIN or MEMBER)${NC}"
    ((PASSED++))
fi

# Summary
echo -e "\n${YELLOW}Test Results:${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All schema tests passed! Database schema is valid.${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some schema tests failed. Please review the database setup.${NC}"
    exit 1
fi
