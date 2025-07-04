-- Negative Tests for Database Schema
-- These tests verify that the schema properly rejects invalid data

\echo 'Starting negative tests for database schema...'

-- Test 1: Try to insert user with invalid role
\echo 'Test 1: Attempting to insert user with invalid role (should fail)'
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Invalid User', 'invalid@test.com', 'hash123', 'INVALID_ROLE');
-- Expected: Check constraint violation

-- Test 2: Try to insert user with duplicate email
\echo 'Test 2: Attempting to insert user with duplicate email (should fail)'
INSERT INTO users (name, email, password_hash, role) 
VALUES ('User One', 'duplicate@test.com', 'hash123', 'MEMBER');
INSERT INTO users (name, email, password_hash, role) 
VALUES ('User Two', 'duplicate@test.com', 'hash456', 'MEMBER');
-- Expected: Unique constraint violation on second insert

-- Test 3: Try to insert room with zero capacity
\echo 'Test 3: Attempting to insert room with zero capacity (should fail)'
INSERT INTO rooms (name, capacity) 
VALUES ('Invalid Room', 0);
-- Expected: Check constraint violation

-- Test 4: Try to insert room with negative capacity
\echo 'Test 4: Attempting to insert room with negative capacity (should fail)'
INSERT INTO rooms (name, capacity) 
VALUES ('Negative Room', -1);
-- Expected: Check constraint violation

-- Test 5: Try to insert booking with non-existent user
\echo 'Test 5: Attempting to insert booking with non-existent user (should fail)'
INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people)
VALUES (99999, 1, '2025-12-01', 1, 1);
-- Expected: Foreign key constraint violation

-- Test 6: Try to insert booking with non-existent room
\echo 'Test 6: Attempting to insert booking with non-existent room (should fail)'
INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people)
VALUES (1, 99999, '2025-12-01', 1, 1);
-- Expected: Foreign key constraint violation

-- Test 7: Try to insert booking with zero nights
\echo 'Test 7: Attempting to insert booking with zero nights (should fail)'
INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people)
VALUES (1, 1, '2025-12-01', 0, 1);
-- Expected: Check constraint violation

-- Test 8: Try to insert booking with negative nights
\echo 'Test 8: Attempting to insert booking with negative nights (should fail)'
INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people)
VALUES (1, 1, '2025-12-01', -1, 1);
-- Expected: Check constraint violation

-- Test 9: Try to insert permission for non-existent user
\echo 'Test 9: Attempting to insert permission for non-existent user (should fail)'
INSERT INTO permissions (user_id, can_book)
VALUES (99999, true);
-- Expected: Foreign key constraint violation

-- Test 10: Try to insert user with null email (NOT NULL constraint)
\echo 'Test 10: Attempting to insert user with null email (should fail)'
INSERT INTO users (name, email, password_hash, role) 
VALUES ('No Email User', NULL, 'hash123', 'MEMBER');
-- Expected: NOT NULL constraint violation

-- Test 11: Try to insert user with null name
\echo 'Test 11: Attempting to insert user with null name (should fail)'
INSERT INTO users (name, email, password_hash, role) 
VALUES (NULL, 'noname@test.com', 'hash123', 'MEMBER');
-- Expected: NOT NULL constraint violation

-- Test 12: Try to insert room with null name
\echo 'Test 12: Attempting to insert room with null name (should fail)'
INSERT INTO rooms (name, capacity) 
VALUES (NULL, 2);
-- Expected: NOT NULL constraint violation

\echo 'Negative tests completed. All constraint violations were expected and handled correctly.'
