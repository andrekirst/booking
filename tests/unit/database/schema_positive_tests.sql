-- Positive Tests for Database Schema
-- These tests verify that the schema accepts valid data correctly

-- Test 1: Insert valid ADMIN user
\echo 'Test 1: Inserting valid ADMIN user'
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Admin User', 'admin@test.com', 'hash123', 'ADMIN');

-- Test 2: Insert valid MEMBER user
\echo 'Test 2: Inserting valid MEMBER user'
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Member User', 'member@test.com', 'hash456', 'MEMBER');

-- Test 3: Insert valid room with capacity
\echo 'Test 3: Inserting valid room'
INSERT INTO rooms (name, capacity, extra_beds, is_tent_allowed) 
VALUES ('Main Bedroom', 2, 1, false);

-- Test 4: Insert room with tent option
\echo 'Test 4: Inserting tent-friendly room'
INSERT INTO rooms (name, capacity, extra_beds, is_tent_allowed) 
VALUES ('Garden Area', 0, 0, true);

-- Test 5: Insert valid booking
\echo 'Test 5: Creating valid booking'
INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people, status)
VALUES (
    (SELECT id FROM users WHERE email = 'member@test.com'),
    (SELECT id FROM rooms WHERE name = 'Main Bedroom'),
    '2025-12-01', 2, 2, 'confirmed'
);

-- Test 6: Grant permission to user
\echo 'Test 6: Granting booking permission'
INSERT INTO permissions (user_id, can_book)
VALUES ((SELECT id FROM users WHERE email = 'member@test.com'), true);

-- Test 7: Update booking (trigger test)
\echo 'Test 7: Updating booking (testing trigger)'
UPDATE bookings 
SET number_of_people = 3 
WHERE user_id = (SELECT id FROM users WHERE email = 'member@test.com');

-- Test 8: Verify updated_at was changed
\echo 'Test 8: Verifying updated_at trigger worked'
SELECT 
    CASE 
        WHEN updated_at > created_at THEN 'PASS: updated_at trigger working'
        ELSE 'FAIL: updated_at trigger not working'
    END as trigger_test
FROM bookings 
WHERE user_id = (SELECT id FROM users WHERE email = 'member@test.com');

\echo 'All positive tests completed successfully!'

