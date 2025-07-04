# Database Migration Guide

This guide explains how to manage database schema changes in the booking system.

## Migration Structure

Migrations are stored in the `migrations/` directory and are named with a sequence number and description:
- `001_initial_schema.sql` - Initial database setup
- `002_add_user_profiles.sql` - (Future migration example)

## Running Migrations

### Initial Setup
For a fresh database installation:
```bash
./scripts/init-db.sh
```

This will:
1. Create the database if it doesn't exist
2. Apply the latest schema from `schema.sql`
3. Create all necessary tables, indexes, and triggers

### With Test Data
To include sample data for development:
```bash
./scripts/init-db.sh --with-seed
```

### Manual Migration
To apply a specific migration manually:
```bash
# Set your database credentials
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=booking_system
export DB_USER=postgres
export DB_PASSWORD=postgres

# Apply migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/001_initial_schema.sql
```

## Creating New Migrations

1. Create a new file in `database/migrations/` with the next sequence number:
   ```
   002_add_new_feature.sql
   ```

2. Include the migration in the file:
   ```sql
   -- Migration 002: Add new feature
   -- Date: YYYY-MM-DD
   -- Description: What this migration does
   
   -- Your schema changes here
   ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
   
   -- Record this migration
   INSERT INTO schema_migrations (version) VALUES ('002_add_new_feature');
   ```

3. Update `schema.sql` to reflect the final state after all migrations

## Schema Validation

Test your schema after changes:
```bash
./scripts/test-schema.sh
```

This script validates:
- All required tables exist
- Constraints are properly configured
- Indexes are created
- Triggers are functional
- Data integrity rules work

## Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** on a copy of production data first
3. **Keep migrations atomic** - each migration should be a single logical change
4. **Never modify existing migrations** - create new ones for changes
5. **Document breaking changes** in migration comments

## Rollback Strategy

For rollbacks, create reverse migrations:
```sql
-- Migration 003_rollback_002: Remove phone number feature
-- Date: YYYY-MM-DD
-- Description: Rollback of migration 002

ALTER TABLE users DROP COLUMN IF EXISTS phone_number;

-- Update migration record
DELETE FROM schema_migrations WHERE version = '002_add_new_feature';
INSERT INTO schema_migrations (version) VALUES ('003_rollback_002');
```

## Environment Variables

The migration scripts use these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | Database host |
| DB_PORT | 5432 | Database port |
| DB_NAME | booking_system | Database name |
| DB_USER | postgres | Database user |
| DB_PASSWORD | postgres | Database password |

## Troubleshooting

### Connection Issues
```bash
# Test connection
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q'
```

### Schema Validation Failures
1. Check PostgreSQL logs
2. Verify all dependencies are installed
3. Ensure user has proper privileges
4. Run `./scripts/test-schema.sh` for detailed error information

### Migration Conflicts
If migrations fail due to conflicts:
1. Check existing schema state
2. Resolve conflicts manually
3. Update migration accordingly
4. Test thoroughly before applying to production
