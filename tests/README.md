# Test Suite Documentation

This directory contains comprehensive tests for the booking system, following the test strategy defined in CLAUDE.md.

## Test Philosophy

**Every feature must have both positive and negative tests:**
- **Positive Tests**: Verify that valid inputs work correctly
- **Negative Tests**: Verify that invalid inputs are properly rejected
- **Edge Cases**: Test boundary conditions and unusual scenarios

## Directory Structure

```
tests/
├── unit/
│   └── database/
│       ├── schema_positive_tests.sql    # Valid data insertion tests
│       ├── schema_negative_tests.sql    # Invalid data rejection tests  
│       └── constraints_tests.sql        # Constraint and relationship tests
├── integration/
│   ├── api/                            # API endpoint tests (future)
│   └── database/                       # Database integration tests (future)
└── scripts/
    ├── run_all_tests.sh               # Execute all test suites
    └── test_database.sh               # Advanced database testing
```

## Database Tests

### Positive Tests (`schema_positive_tests.sql`)
Tests that verify the schema accepts valid data:
- Insert valid users (ADMIN and MEMBER roles)
- Insert valid rooms with different configurations
- Create valid bookings with proper relationships
- Grant permissions correctly
- Verify trigger functionality

### Negative Tests (`schema_negative_tests.sql`)
Tests that verify the schema rejects invalid data:
- Invalid user roles → Check constraint violation
- Duplicate emails → Unique constraint violation
- Zero/negative room capacity → Check constraint violation
- Non-existent foreign keys → Foreign key constraint violation
- NULL values in NOT NULL fields → NOT NULL constraint violation

### Constraint Tests (`constraints_tests.sql`)
Tests that verify relationships and constraints:
- Foreign key relationships work correctly
- Unique constraints are enforced
- Check constraints validate data
- Triggers update fields automatically
- Indexes exist and perform correctly

## Running Tests

### Quick Test (Schema Validation)
```bash
./scripts/test-schema.sh
```

### Comprehensive Database Tests
```bash
./tests/scripts/test_database.sh
```

### All Tests with Setup
```bash
./tests/scripts/run_all_tests.sh
```

## Test Environment Variables

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=booking_system_test
export DB_USER=postgres
export DB_PASSWORD=postgres
```

## Test Results

Tests provide clear pass/fail feedback:
- ✅ **PASS**: Expected behavior occurred
- ❌ **FAIL**: Unexpected behavior or missing constraint
- 🎉 **SUCCESS**: All tests passed
- ⚠️ **WARNING**: Some tests failed

## Expected Test Outcomes

### Positive Tests
All positive tests should **PASS** - if any fail, there's a schema issue.

### Negative Tests  
All negative tests should **FAIL** with constraint violations - if any pass, constraints are missing.

### Constraint Tests
All constraint tests should **PASS** - verifying that relationships and rules work correctly.

## Test Data Cleanup

All tests include cleanup procedures to:
- Remove test data after execution
- Avoid interference between test runs
- Keep test database clean
- Ensure repeatability

## Adding New Tests

When adding new features, follow this pattern:

1. **Create positive tests** for valid usage
2. **Create negative tests** for invalid inputs
3. **Test edge cases** and boundary conditions
4. **Include cleanup** in all test scripts
5. **Update this README** if adding new test categories

### Example Test Pattern

```sql
-- Positive Test
\echo 'Test: Valid feature works'
INSERT INTO table (valid_data) VALUES ('correct');

-- Negative Test  
\echo 'Test: Invalid feature rejected'
INSERT INTO table (invalid_data) VALUES ('wrong'); -- Should fail

-- Cleanup
DELETE FROM table WHERE test_condition;
```

## Integration with CI/CD

These tests are designed to run in automated environments:
- Return proper exit codes (0 = success, 1 = failure)
- Provide detailed logging for debugging
- Handle database setup and cleanup automatically
- Work with standard PostgreSQL installations

## Troubleshooting

### Connection Issues
```bash
# Test database connection
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c '\q'
```

### Failed Tests
1. Check PostgreSQL logs for detailed error messages
2. Verify all schema files are up to date
3. Ensure test database has proper permissions
4. Run individual test files to isolate issues

### Test Database Issues
```bash
# Recreate test database
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS booking_system_test;"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE booking_system_test;"
```
