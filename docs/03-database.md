# Database Design

## Overview

The database is designed using PostgreSQL with a relational model that supports multi-tenancy, scalability, and data integrity. The schema follows normalization principles while maintaining query performance.

## Database Schema

### Entity Relationship Diagram (Text-Based)

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │
│ email       │◄─────┐
│ password    │      │
│ role        │      │
│ first_name  │      │
│ last_name   │      │
└─────────────┘      │
                     │
┌─────────────┐      │
│ restaurants │      │
│─────────────│      │
│ id (PK)     │      │
│ owner_id(FK)├──────┘
│ name        │
│ slug        │
│ address     │
│ location    │
└─────────────┘
      │
      │ 1:N
      │
      ▼
┌─────────────┐
│   orders    │
│─────────────│
│ id (PK)     │
│ restaurant  │◄──────┐
│ _id (FK)    │       │
│ order_number│       │
│ customer    │       │
│ delivery    │       │
│ _address    │       │
│ status      │       │
│ total       │       │
└─────────────┘       │
      │               │
      │ 1:1           │
      │               │
      ▼               │
┌─────────────┐       │
│  deliveries │       │
│─────────────│       │
│ id (PK)     │       │
│ order_id(FK)├───────┘
│ rider_id(FK)├───────┐
│ restaurant  │       │
│ _id (FK)    │       │
│ status      │       │
│ assigned_at │       │
│ delivered_at│       │
└─────────────┘       │
                      │
┌─────────────┐       │
│   riders    │       │
│─────────────│       │
│ id (PK)     │       │
│ user_id(FK) ├───────┘
│ restaurant  │
│ _id (FK)    │
│ vehicle     │
│ location    │
│ available   │
└─────────────┘
```

## Core Tables

### 1. users

Stores all user accounts (admin, restaurant owners, riders).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'restaurant_owner', 'rider')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email`: Fast email lookups
- `idx_users_role`: Filter by role

**Relationships:**
- One-to-many with `restaurants` (owner_id)
- One-to-one with `riders` (user_id)

### 2. restaurants

Multi-tenant restaurant data. Each restaurant belongs to an owner.

```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_restaurants_owner`: Find restaurants by owner
- `idx_restaurants_slug`: Fast slug lookups
- `idx_restaurants_location`: Geospatial queries

**Relationships:**
- Many-to-one with `users` (owner_id)
- One-to-many with `orders`
- One-to-many with `riders`

### 3. orders

Core order information. Links restaurants to customers and deliveries.

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    delivery_address_line1 VARCHAR(255) NOT NULL,
    delivery_address_line2 VARCHAR(255),
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(100),
    delivery_postal_code VARCHAR(20),
    delivery_country VARCHAR(100) DEFAULT 'US',
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    delivery_instructions TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    tip DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    source VARCHAR(50) DEFAULT 'manual',
    external_order_id VARCHAR(255),
    scheduled_for TIMESTAMP,
    estimated_prep_time INTEGER,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_orders_restaurant`: Filter by restaurant
- `idx_orders_status`: Filter by status
- `idx_orders_order_number`: Fast order number lookups
- `idx_orders_created`: Time-based queries
- `idx_orders_delivery_location`: Geospatial queries

**Relationships:**
- Many-to-one with `restaurants`
- One-to-one with `deliveries`
- One-to-many with `order_items`

### 4. order_items

Individual items within an order. Normalized to support multiple items per order.

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_order_items_order`: Fast order item lookups

**Relationships:**
- Many-to-one with `orders`

### 5. deliveries

Tracks delivery assignment and completion. Links orders to riders.

```sql
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_at TIMESTAMP,
    accepted_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    started_at TIMESTAMP,
    delivered_at TIMESTAMP,
    estimated_pickup_time TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    distance_km DECIMAL(8, 2),
    duration_minutes INTEGER,
    delivery_notes TEXT,
    customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
    customer_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_deliveries_order`: Find delivery by order
- `idx_deliveries_rider`: Find deliveries by rider
- `idx_deliveries_status`: Filter by status
- `idx_deliveries_restaurant`: Filter by restaurant

**Relationships:**
- One-to-one with `orders`
- Many-to-one with `riders`
- Many-to-one with `restaurants`
- One-to-many with `location_updates`

### 6. riders

Rider profiles and current status. Links users to delivery capabilities.

```sql
CREATE TABLE riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'car', 'walking')),
    license_number VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    is_available BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'offline',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_riders_user`: Find rider by user
- `idx_riders_restaurant`: Filter by restaurant
- `idx_riders_available`: Find available riders
- `idx_riders_location`: Geospatial queries

**Relationships:**
- One-to-one with `users`
- Many-to-one with `restaurants`
- One-to-many with `deliveries`
- One-to-many with `location_updates`

### 7. location_updates

GPS tracking history. Records rider location during deliveries.

```sql
CREATE TABLE location_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(8, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_location_delivery`: Find updates by delivery
- `idx_location_rider`: Find updates by rider
- `idx_location_timestamp`: Time-based queries

**Relationships:**
- Many-to-one with `deliveries`
- Many-to-one with `riders`

### 8. notifications

In-app notifications for users.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_notifications_user`: Find notifications by user
- `idx_notifications_restaurant`: Find by restaurant
- `idx_notifications_read`: Filter unread notifications

### 9. webhook_configs

Configuration for external platform integrations.

```sql
CREATE TABLE webhook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    platform VARCHAR(100) NOT NULL,
    webhook_url VARCHAR(500),
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_webhook_restaurant`: Find configs by restaurant

### 10. webhook_events

Log of incoming webhook events.

```sql
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_config_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_webhook_events_config`: Find events by config
- `idx_webhook_events_status`: Filter by status

## Multi-Tenancy Design

### Row-Level Security

The database uses `restaurant_id` as the primary tenant identifier. Most tables include `restaurant_id` to enable data isolation.

**Isolation Strategy:**
1. All queries filter by `restaurant_id`
2. Middleware enforces tenant isolation at API level
3. Foreign key constraints ensure data integrity
4. Indexes on `restaurant_id` for performance

**Example Query:**
```sql
-- Restaurant owner can only see their orders
SELECT * FROM orders 
WHERE restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = $1
);
```

## Data Integrity

### Foreign Key Constraints

All relationships use foreign keys with appropriate CASCADE/SET NULL behavior:
- `ON DELETE CASCADE`: Child records deleted when parent deleted
- `ON DELETE SET NULL`: Foreign key set to NULL when parent deleted

### Check Constraints

- Role values: `admin`, `restaurant_owner`, `rider`
- Status values: Enforced per table
- Rating values: 1-5 range
- Email: UNIQUE constraint

### Triggers

**Automatic Timestamps:**
- `updated_at` automatically updated on row modification
- Uses PostgreSQL trigger function

**Order Number Generation:**
- Automatic order number generation
- Format: `ORD-YYYYMMDD-XXXXXX`

## Performance Optimization

### Indexes

**Primary Indexes:**
- All primary keys (automatic)
- Foreign keys (for join performance)
- Frequently queried columns (status, created_at)

**Composite Indexes:**
- `(restaurant_id, status)` for filtered queries
- `(latitude, longitude)` for geospatial queries
- `(is_available, is_online)` for rider queries

### Query Optimization

**Pagination:**
- Use `LIMIT` and `OFFSET` for large result sets
- Consider cursor-based pagination for better performance

**Selective Queries:**
- Only select needed columns
- Use `SELECT *` sparingly

**Connection Pooling:**
- Use pg-pool with max 20 connections
- Reuse connections efficiently

## Data Migration Strategy

### Migration Files

Store migrations in `database/migrations/`:
- `001_initial_schema.sql`: Initial database setup
- `002_add_feature.sql`: Feature additions
- `003_update_indexes.sql`: Performance improvements

### Migration Process

1. Create migration SQL file
2. Test on development database
3. Backup production database
4. Run migration
5. Verify data integrity
6. Update application code if schema changed

## Backup & Recovery

### Backup Strategy

1. **Daily Full Backups**: Complete database dump
2. **Hourly Incremental**: Transaction logs
3. **Point-in-Time Recovery**: PostgreSQL WAL archiving

### Recovery Process

1. Restore from latest full backup
2. Apply incremental backups
3. Replay transaction logs to desired point
4. Verify data integrity

## Security Considerations

### Sensitive Data

- **Passwords**: Hashed with bcrypt (never stored plaintext)
- **API Keys**: Encrypted at application level
- **Personal Data**: PII stored securely, GDPR compliant

### Access Control

- Database user with minimal privileges
- Application-level access control
- No direct database access for end users
- Audit logs for sensitive operations

## Future Enhancements

### Partitioning

For large tables (orders, location_updates), consider partitioning by:
- Date range (monthly partitions)
- Restaurant ID (hash partitioning)

### Read Replicas

- Separate read replicas for analytics
- Reduce load on primary database
- Improve query performance

### Caching Layer

- Redis for frequently accessed data
- Cache restaurant settings
- Cache rider availability
- Cache order status
