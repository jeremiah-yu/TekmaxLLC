-- Seed Data for Development/Testing
-- WARNING: Only use in development environments

-- Insert Admin User
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@tekmax.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', 'admin', 'Admin', 'User', '+1234567890', true, true);

-- Insert Sample Restaurant Owner
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'owner@restaurant.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', 'restaurant_owner', 'John', 'Restaurant', '+1234567891', true, true);

-- Insert Sample Restaurant
INSERT INTO restaurants (id, owner_id, name, slug, description, phone, email, address_line1, city, state, postal_code, country, latitude, longitude, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'Pizza Palace', 'pizza-palace', 'Best pizza in town', '+1234567892', 'info@pizzapalace.com', '123 Main St', 'New York', 'NY', '10001', 'US', 40.7128, -74.0060, true);

-- Insert Sample Rider User
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active, email_verified)
VALUES 
    ('00000000-0000-0000-0000-000000000003', 'rider@tekmax.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', 'rider', 'Mike', 'Rider', '+1234567893', true, true);

-- Insert Sample Rider
INSERT INTO riders (id, user_id, restaurant_id, vehicle_type, phone, is_available, is_online, status)
VALUES 
    ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', 'motorcycle', '+1234567893', true, true, 'available');
