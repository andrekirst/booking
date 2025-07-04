#!/bin/bash

# Execute all database tests

set -e

# Default database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-booking_system}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Run schema initialization
./scripts/init-db.sh --with-seed

# Run tests and capture output
TEST_DIR="tests/unit/database"

# Positive Tests
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$TEST_DIR/schema_positive_tests.sql"

# Constraints Tests
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$TEST_DIR/constraints_tests.sql"

# Negative Tests - Expect failures (use ON_ERROR_STOP=off for expected errors)
set +e
PGPASSWORD=$DB_PASSWORD psql -v ON_ERROR_STOP=off -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$TEST_DIR/schema_negative_tests.sql"
TEST_RESULT=$?
set -e

# Check the result of negative tests
if [ $TEST_RESULT -ne 0 ]; then
    echo -e "\nNegative tests encountered expected constraint violations."
else
    echo -e "\nAll tests passed successfully!"
fi

# Summarize results
echo -e "\nTest run completed."

