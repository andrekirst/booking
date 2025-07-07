-- Database initialization script for PostgreSQL
-- This script runs automatically when the container starts

-- Create additional databases for testing if needed
CREATE DATABASE booking_test;
GRANT ALL PRIVILEGES ON DATABASE booking_test TO booking_user;

-- Set timezone to UTC
ALTER DATABASE booking_dev SET timezone TO 'UTC';
ALTER DATABASE booking_test SET timezone TO 'UTC';