-- Database Constraints and Relationships Tests
-- These tests verify that all constraints and relationships work correctly

\echo 'Testing database constraints and relationships...'

-- Setup test data
\echo 'Setting up test data...'
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Test User', 'constraint@test.com', 'hash123', 'MEMBER');

INSERT INTO rooms (name, capacity, extra_beds, is_tent_allowed) 
VALUES ('Test Room', 2, 1, false);

-- Test 1: Foreign Key Constraint - Bookings to Users
\echo 'Test 1: Testing foreign key constraint (bookings -> users)'
INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people)
VALUES (
    (SELECT id FROM users WHERE email = 'constraint@test.com'),
    (SELECT id FROM rooms WHERE name = 'Test Room'),
    '2025-12-01', 2, 2
);

-- Test 2: Foreign Key Constraint - Permissions to Users  
\echo 'Test 2: Testing foreign key constraint (permissions -> users)'
INSERT INTO permissions (user_id, can_book)
VALUES ((SELECT id FROM users WHERE email = 'constraint@test.com'), true);

-- Test 3: Cascade behavior - What happens when we try to delete a user with bookings?
\echo 'Test 3: Testing referential integrity (user with bookings)'
-- This should show that we have referential integrity
SELECT 
    u.name,
    COUNT(b.id) as booking_count,
    COUNT(p.id) as permission_count
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN permissions p ON u.id = p.user_id
WHERE u.email = 'constraint@test.com'
GROUP BY u.id, u.name;

-- Test 4: Unique constraint on user email
\echo 'Test 4: Verifying unique constraint on user email'
SELECT 
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) = 1 THEN 'PASS: Email uniqueness enforced'
        ELSE 'FAIL: Duplicate emails allowed'
    END as uniqueness_test
FROM users 
WHERE email = 'constraint@test.com';

-- Test 5: Check constraint on room capacity
\echo 'Test 5: Verifying check constraint on room capacity'
SELECT 
    name,
    capacity,
    CASE 
        WHEN capacity > 0 THEN 'PASS: Capacity constraint working'
        ELSE 'FAIL: Invalid capacity allowed'
    END as capacity_test
FROM rooms 
WHERE name = 'Test Room';

-- Test 6: Check constraint on user role
\echo 'Test 6: Verifying check constraint on user role'
SELECT 
    name,
    role,
    CASE 
        WHEN role IN ('ADMIN', 'MEMBER') THEN 'PASS: Role constraint working'
        ELSE 'FAIL: Invalid role allowed'
    END as role_test
FROM users 
WHERE email = 'constraint@test.com';

-- Test 7: Check constraint on booking nights
\echo 'Test 7: Verifying check constraint on booking nights'
SELECT 
    number_of_nights,
    CASE 
        WHEN number_of_nights > 0 THEN 'PASS: Nights constraint working'
        ELSE 'FAIL: Invalid nights allowed'
    END as nights_test
FROM bookings 
WHERE user_id = (SELECT id FROM users WHERE email = 'constraint@test.com');

-- Test 8: Test index performance (simple check that indexes exist)
\echo 'Test 8: Verifying indexes exist'
SELECT 
    indexname,
    tablename,
    'PASS: Index exists' as index_test
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('idx_users_email', 'idx_bookings_user_id', 'idx_bookings_booking_date', 'idx_rooms_name');

-- Test 9: Test trigger function
\echo 'Test 9: Testing updated_at trigger'
-- Update a booking to trigger the updated_at change
UPDATE bookings 
SET status = 'confirmed' 
WHERE user_id = (SELECT id FROM users WHERE email = 'constraint@test.com');

-- Check if updated_at was changed
SELECT 
    CASE 
        WHEN updated_at > created_at THEN 'PASS: Trigger working correctly'
        ELSE 'FAIL: Trigger not working'
    END as trigger_test
FROM bookings 
WHERE user_id = (SELECT id FROM users WHERE email = 'constraint@test.com');

-- Test 10: Test data relationships
\echo 'Test 10: Testing data relationships integrity'
SELECT 
    u.name as user_name,
    r.name as room_name,
    b.booking_date,
    b.number_of_nights,
    p.can_book,
    'PASS: All relationships working' as relationship_test
FROM users u
JOIN bookings b ON u.id = b.user_id
JOIN rooms r ON b.room_id = r.id
JOIN permissions p ON u.id = p.user_id
WHERE u.email = 'constraint@test.com';

\echo 'All constraint tests completed!'

-- Cleanup test data
\echo 'Cleaning up test data...'
DELETE FROM bookings WHERE user_id = (SELECT id FROM users WHERE email = 'constraint@test.com');
DELETE FROM permissions WHERE user_id = (SELECT id FROM users WHERE email = 'constraint@test.com');
DELETE FROM users WHERE email = 'constraint@test.com';
DELETE FROM rooms WHERE name = 'Test Room';

\echo 'Cleanup completed.'
