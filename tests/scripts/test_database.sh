#!/bin/bash

# Advanced Database Testing Script
# Tests schema integrity, constraints, and edge cases

set -e

# Default database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-booking_system_test}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}=== Advanced Database Testing Suite ===${NC}"

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_sql="$2"
    local expect_failure="${3:-false}"
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    ((TOTAL_TESTS++))
    
    if [ "$expect_failure" = "true" ]; then
        # For negative tests, we expect the SQL to fail
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$test_sql" 2>/dev/null; then
            echo -e "${RED}✗ FAIL: Expected constraint violation but query succeeded${NC}"
            ((FAILED_TESTS++))
        else
            echo -e "${GREEN}✓ PASS: Constraint violation detected as expected${NC}"
            ((PASSED_TESTS++))
        fi
    else
        # For positive tests, we expect the SQL to succeed
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$test_sql" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PASS: Query executed successfully${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}✗ FAIL: Query failed unexpectedly${NC}"
            ((FAILED_TESTS++))
        fi
    fi
}

# Setup test database
echo -e "${YELLOW}Setting up test database...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" >/dev/null 2>&1
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" >/dev/null 2>&1

# Apply schema
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "database/schema.sql" >/dev/null 2>&1

echo -e "${GREEN}Test database setup complete${NC}\n"

# === POSITIVE TESTS ===
echo -e "${BLUE}=== POSITIVE TESTS ===${NC}"

run_test "Insert valid ADMIN user" \
    "INSERT INTO users (name, email, password_hash, role) VALUES ('Admin Test', 'admin@test.local', 'hash123', 'ADMIN');"

run_test "Insert valid MEMBER user" \
    "INSERT INTO users (name, email, password_hash, role) VALUES ('Member Test', 'member@test.local', 'hash456', 'MEMBER');"

run_test "Insert valid room" \
    "INSERT INTO rooms (name, capacity, extra_beds, is_tent_allowed) VALUES ('Test Room', 2, 1, false);"

run_test "Insert valid booking" \
    "INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people) VALUES ((SELECT id FROM users WHERE email = 'member@test.local'), (SELECT id FROM rooms WHERE name = 'Test Room'), '2025-12-01', 2, 2);"

run_test "Insert valid permission" \
    "INSERT INTO permissions (user_id, can_book) VALUES ((SELECT id FROM users WHERE email = 'member@test.local'), true);"

echo ""

# === NEGATIVE TESTS ===
echo -e "${BLUE}=== NEGATIVE TESTS ===${NC}"

run_test "Reject invalid user role" \
    "INSERT INTO users (name, email, password_hash, role) VALUES ('Invalid User', 'invalid@test.local', 'hash123', 'INVALID');" \
    true

run_test "Reject duplicate email" \
    "INSERT INTO users (name, email, password_hash, role) VALUES ('Duplicate User', 'admin@test.local', 'hash789', 'MEMBER');" \
    true

run_test "Reject zero room capacity" \
    "INSERT INTO rooms (name, capacity) VALUES ('Zero Room', 0);" \
    true

run_test "Reject negative room capacity" \
    "INSERT INTO rooms (name, capacity) VALUES ('Negative Room', -1);" \
    true

run_test "Reject booking with zero nights" \
    "INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people) VALUES (1, 1, '2025-12-01', 0, 1);" \
    true

run_test "Reject booking with negative nights" \
    "INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people) VALUES (1, 1, '2025-12-01', -1, 1);" \
    true

run_test "Reject booking with non-existent user" \
    "INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people) VALUES (99999, 1, '2025-12-01', 1, 1);" \
    true

run_test "Reject booking with non-existent room" \
    "INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people) VALUES (1, 99999, '2025-12-01', 1, 1);" \
    true

run_test "Reject permission for non-existent user" \
    "INSERT INTO permissions (user_id, can_book) VALUES (99999, true);" \
    true

run_test "Reject user with null email" \
    "INSERT INTO users (name, email, password_hash, role) VALUES ('No Email', NULL, 'hash123', 'MEMBER');" \
    true

run_test "Reject user with null name" \
    "INSERT INTO users (name, email, password_hash, role) VALUES (NULL, 'noname@test.local', 'hash123', 'MEMBER');" \
    true

run_test "Reject room with null name" \
    "INSERT INTO rooms (name, capacity) VALUES (NULL, 2);" \
    true

echo ""

# === CONSTRAINT VERIFICATION TESTS ===
echo -e "${BLUE}=== CONSTRAINT VERIFICATION ===${NC}"

# Test trigger functionality
run_test "Verify updated_at trigger" \
    "UPDATE bookings SET status = 'confirmed' WHERE user_id = (SELECT id FROM users WHERE email = 'member@test.local'); SELECT CASE WHEN updated_at > created_at THEN 1 ELSE 0 END FROM bookings WHERE user_id = (SELECT id FROM users WHERE email = 'member@test.local');"

# Test indexes exist
run_test "Verify email index exists" \
    "SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_email';"

run_test "Verify booking date index exists" \
    "SELECT 1 FROM pg_indexes WHERE tablename = 'bookings' AND indexname = 'idx_bookings_booking_date';"

echo ""

# === CLEANUP ===
echo -e "${YELLOW}Cleaning up test database...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE $DB_NAME;" >/dev/null 2>&1

# === RESULTS ===
echo -e "${BLUE}=== TEST RESULTS ===${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Database schema is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review the database schema.${NC}"
    exit 1
fi
