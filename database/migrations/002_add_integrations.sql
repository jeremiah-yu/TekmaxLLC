-- Add agency_partner_id to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS agency_partner_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_agency_partner ON restaurants(agency_partner_id);

-- Create restaurant_settings table for API keys and integrations
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    -- Gloria Food credentials
    gloria_food_api_key VARCHAR(255),
    gloria_food_store_id VARCHAR(255),
    gloria_food_master_key VARCHAR(255),
    gloria_food_contact_email VARCHAR(255),
    gloria_food_webhook_url VARCHAR(500),
    -- DoorDash credentials
    doordash_developer_id VARCHAR(255),
    doordash_key_id VARCHAR(255),
    doordash_signing_secret VARCHAR(255),
    doordash_merchant_id VARCHAR(255),
    doordash_sandbox BOOLEAN DEFAULT true,
    -- Connection status
    is_gloria_food_connected BOOLEAN DEFAULT false,
    is_doordash_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_settings_restaurant ON restaurant_settings(restaurant_id);

-- Create scheduled_tasks table for DoorDash calls
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL, -- 'doordash_call', etc.
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_order ON scheduled_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_at ON scheduled_tasks(scheduled_at);

-- Add gloria_food_order_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS gloria_food_order_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_orders_gloria_food_id ON orders(gloria_food_order_id);

-- Add doordash_delivery_id and doordash_external_id to deliveries table
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS doordash_delivery_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS doordash_external_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_deliveries_doordash_id ON deliveries(doordash_delivery_id);
