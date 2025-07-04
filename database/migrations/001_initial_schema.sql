-- Migration 001: Initial Schema Setup
-- Date: 2024-07-04
-- Description: Creates the initial database schema with users, rooms, bookings, and permissions

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Execute the main schema
\i schema.sql

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
