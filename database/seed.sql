-- Seed Data for Development and Testing
-- This file populates the database with initial test data

-- Insert sample rooms
INSERT INTO rooms (name, capacity, extra_beds, is_tent_allowed) VALUES
('Hauptschlafzimmer', 2, 1, false),
('Kinderzimmer', 2, 0, false),
('Wohnzimmer', 3, 2, false),
('Garten', 0, 0, true); -- For tent camping

-- Insert admin user (password: admin123)
-- Note: This password hash is for testing only - use proper hashing in production
INSERT INTO users (name, email, password_hash, role) VALUES
('Administrator', 'admin@family.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/uQqQQQQQQQQQQQQQQ', 'ADMIN');

-- Insert sample family members (password: test123 for all)
INSERT INTO users (name, email, password_hash, role) VALUES
('Anna Mustermann', 'anna@family.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/uQqQQQQQQQQQQQQQQ', 'MEMBER'),
('Max Mustermann', 'max@family.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/uQqQQQQQQQQQQQQQQ', 'MEMBER'),
('Lisa Familie', 'lisa@family.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/uQqQQQQQQQQQQQQQQ', 'MEMBER');

-- Grant booking permissions to family members
INSERT INTO permissions (user_id, can_book) VALUES
((SELECT id FROM users WHERE email = 'anna@family.local'), true),
((SELECT id FROM users WHERE email = 'max@family.local'), true),
((SELECT id FROM users WHERE email = 'lisa@family.local'), false); -- Lisa doesn't have permission yet

-- Insert sample bookings
INSERT INTO bookings (user_id, room_id, booking_date, number_of_nights, number_of_people, status) VALUES
((SELECT id FROM users WHERE email = 'anna@family.local'), 
 (SELECT id FROM rooms WHERE name = 'Hauptschlafzimmer'), 
 '2024-08-15', 2, 2, 'confirmed'),
 
((SELECT id FROM users WHERE email = 'max@family.local'), 
 (SELECT id FROM rooms WHERE name = 'Kinderzimmer'), 
 '2024-08-20', 1, 3, 'pending');
