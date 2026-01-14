# API Design

## Overview

The TekMax API is a RESTful API built with Express.js and TypeScript. It follows REST principles with clear resource-based URLs, standard HTTP methods, and JSON responses.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.tekmax.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Format

JWT tokens are obtained from the `/api/auth/login` endpoint and contain:
- `userId`: User ID
- `email`: User email
- `role`: User role (admin, restaurant_owner, rider)

**Token Expiration**: 7 days (configurable)

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success message (optional)"
}
```

### Error Response

```json
{
  "error": "Error message",
  "statusCode": 400
}
```

## Status Codes

- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST (resource created)
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "restaurant_owner"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "restaurant_owner",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "jwt_token_here"
}
```

### POST /api/auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "restaurant_owner",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "jwt_token_here"
}
```

### GET /api/auth/me

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "restaurant_owner",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }
}
```

---

## Restaurant Endpoints

### POST /api/restaurants

Create a new restaurant.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Pizza Palace",
  "slug": "pizza-palace",
  "description": "Best pizza in town",
  "phone": "+1234567890",
  "email": "info@pizzapalace.com",
  "address": {
    "line1": "123 Main St",
    "line2": "Suite 100",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  },
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (201):**
```json
{
  "restaurant": {
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Pizza Palace",
    "slug": "pizza-palace",
    "description": "Best pizza in town",
    "phone": "+1234567890",
    "email": "info@pizzapalace.com",
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/restaurants

Get list of restaurants (filtered by user role).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "restaurants": [
    {
      "id": "uuid",
      "name": "Pizza Palace",
      "slug": "pizza-palace",
      "city": "New York",
      "is_active": true
    }
  ]
}
```

### GET /api/restaurants/:id

Get single restaurant details.

**Response (200):**
```json
{
  "restaurant": {
    "id": "uuid",
    "name": "Pizza Palace",
    "slug": "pizza-palace",
    "description": "Best pizza in town",
    "phone": "+1234567890",
    "email": "info@pizzapalace.com",
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## Order Endpoints

### POST /api/orders

Create a new order.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "restaurantId": "uuid",
  "customerName": "Jane Doe",
  "customerPhone": "+1234567890",
  "customerEmail": "jane@example.com",
  "deliveryAddress": {
    "line1": "456 Oak Ave",
    "line2": "Apt 5B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10002",
    "country": "US"
  },
  "deliveryLatitude": 40.7580,
  "deliveryLongitude": -73.9855,
  "deliveryInstructions": "Ring doorbell twice",
  "items": [
    {
      "name": "Margherita Pizza",
      "quantity": 2,
      "unitPrice": 15.99,
      "subtotal": 31.98,
      "specialInstructions": "Extra cheese"
    },
    {
      "name": "Coca Cola",
      "quantity": 1,
      "unitPrice": 2.50,
      "subtotal": 2.50
    }
  ],
  "subtotal": 34.48,
  "tax": 3.10,
  "deliveryFee": 5.00,
  "tip": 5.00,
  "estimatedPrepTime": 20
}
```

**Response (201):**
```json
{
  "order": {
    "id": "uuid",
    "restaurant_id": "uuid",
    "order_number": "ORD-20240101-000001",
    "customer_name": "Jane Doe",
    "customer_phone": "+1234567890",
    "customer_email": "jane@example.com",
    "delivery_address_line1": "456 Oak Ave",
    "delivery_city": "New York",
    "delivery_state": "NY",
    "delivery_postal_code": "10002",
    "delivery_latitude": 40.7580,
    "delivery_longitude": -73.9855,
    "delivery_instructions": "Ring doorbell twice",
    "subtotal": 34.48,
    "tax": 3.10,
    "delivery_fee": 5.00,
    "tip": 5.00,
    "total_amount": 47.58,
    "status": "pending",
    "payment_status": "pending",
    "estimated_prep_time": 20,
    "items": [
      {
        "id": "uuid",
        "item_name": "Margherita Pizza",
        "quantity": 2,
        "unit_price": 15.99,
        "subtotal": 31.98,
        "special_instructions": "Extra cheese"
      },
      {
        "id": "uuid",
        "item_name": "Coca Cola",
        "quantity": 1,
        "unit_price": 2.50,
        "subtotal": 2.50
      }
    ],
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### GET /api/orders

Get list of orders (filtered by user role).

**Query Parameters:**
- `status`: Filter by status (pending, confirmed, preparing, ready, assigned, picked_up, in_transit, delivered, cancelled)
- `restaurantId`: Filter by restaurant (admin only)
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-20240101-000001",
      "customer_name": "Jane Doe",
      "customer_phone": "+1234567890",
      "delivery_address_line1": "456 Oak Ave",
      "delivery_city": "New York",
      "total_amount": 47.58,
      "status": "pending",
      "restaurant_name": "Pizza Palace",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### GET /api/orders/:id

Get single order with items.

**Response (200):**
```json
{
  "order": {
    "id": "uuid",
    "order_number": "ORD-20240101-000001",
    "restaurant_id": "uuid",
    "customer_name": "Jane Doe",
    "customer_phone": "+1234567890",
    "customer_email": "jane@example.com",
    "delivery_address_line1": "456 Oak Ave",
    "delivery_city": "New York",
    "delivery_state": "NY",
    "delivery_postal_code": "10002",
    "delivery_latitude": 40.7580,
    "delivery_longitude": -73.9855,
    "delivery_instructions": "Ring doorbell twice",
    "subtotal": 34.48,
    "tax": 3.10,
    "delivery_fee": 5.00,
    "tip": 5.00,
    "total_amount": 47.58,
    "status": "pending",
    "payment_status": "pending",
    "estimated_prep_time": 20,
    "items": [
      {
        "id": "uuid",
        "item_name": "Margherita Pizza",
        "quantity": 2,
        "unit_price": 15.99,
        "subtotal": 31.98,
        "special_instructions": "Extra cheese"
      }
    ],
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### PATCH /api/orders/:id/status

Update order status.

**Request Body:**
```json
{
  "status": "ready"
}
```

**Valid Status Values:**
- `pending`, `confirmed`, `preparing`, `ready`, `assigned`, `picked_up`, `in_transit`, `delivered`, `cancelled`

**Response (200):**
```json
{
  "order": {
    "id": "uuid",
    "status": "ready",
    ...
  }
}
```

---

## Delivery Endpoints

### GET /api/deliveries

Get list of deliveries (filtered by user role).

**Query Parameters:**
- `status`: Filter by status
- `riderId`: Filter by rider (admin only)
- `restaurantId`: Filter by restaurant
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "deliveries": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "order_number": "ORD-20240101-000001",
      "customer_name": "Jane Doe",
      "customer_phone": "+1234567890",
      "delivery_address_line1": "456 Oak Ave",
      "delivery_city": "New York",
      "rider_id": "uuid",
      "rider_name": "Mike Rider",
      "restaurant_id": "uuid",
      "restaurant_name": "Pizza Palace",
      "status": "assigned",
      "assigned_at": "2024-01-01T12:15:00Z",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/deliveries/:id/assign

Assign delivery to a rider.

**Request Body:**
```json
{
  "riderId": "uuid"
}
```

**Response (200):**
```json
{
  "delivery": {
    "id": "uuid",
    "order_id": "uuid",
    "order_number": "ORD-20240101-000001",
    "rider_id": "uuid",
    "status": "assigned",
    "assigned_at": "2024-01-01T12:15:00Z"
  }
}
```

### POST /api/deliveries/:id/accept

Rider accepts delivery assignment.

**Response (200):**
```json
{
  "message": "Delivery accepted"
}
```

### PATCH /api/deliveries/:id/status

Update delivery status (rider only).

**Request Body:**
```json
{
  "status": "picked_up"
}
```

**Valid Status Values:**
- `picked_up`, `in_transit`, `delivered`

**Response (200):**
```json
{
  "message": "Delivery status updated to picked_up"
}
```

---

## Rider Endpoints

### GET /api/riders

Get list of riders (filtered by user role).

**Response (200):**
```json
{
  "riders": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "first_name": "Mike",
      "last_name": "Rider",
      "email": "mike@example.com",
      "phone": "+1234567891",
      "vehicle_type": "motorcycle",
      "is_available": true,
      "is_online": true,
      "status": "available",
      "rating": 4.8,
      "total_deliveries": 150,
      "restaurant_name": "Pizza Palace"
    }
  ]
}
```

### GET /api/riders/available

Get available riders.

**Query Parameters:**
- `restaurantId`: Filter by restaurant

**Response (200):**
```json
{
  "riders": [
    {
      "id": "uuid",
      "first_name": "Mike",
      "last_name": "Rider",
      "phone": "+1234567891",
      "vehicle_type": "motorcycle",
      "current_latitude": 40.7128,
      "current_longitude": -74.0060,
      "rating": 4.8,
      "total_deliveries": 150
    }
  ]
}
```

### POST /api/riders/location

Update rider location (rider only).

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response (200):**
```json
{
  "message": "Location updated"
}
```

### PATCH /api/riders/availability

Update rider availability (rider only).

**Request Body:**
```json
{
  "isAvailable": true,
  "isOnline": true
}
```

**Response (200):**
```json
{
  "message": "Availability updated"
}
```

---

## Tracking Endpoints

### POST /api/tracking/location

Update location during delivery (rider only).

**Request Body:**
```json
{
  "deliveryId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10.5,
  "heading": 45.0,
  "speed": 25.5
}
```

**Response (200):**
```json
{
  "message": "Location updated"
}
```

### GET /api/tracking/:deliveryId

Get tracking data for a delivery.

**Response (200):**
```json
{
  "delivery": {
    "id": "uuid",
    "order_number": "ORD-20240101-000001",
    "delivery_address_line1": "456 Oak Ave",
    "delivery_latitude": 40.7580,
    "delivery_longitude": -73.9855,
    "rider_name": "Mike Rider",
    "rider_current_latitude": 40.7500,
    "rider_current_longitude": -73.9800,
    "status": "in_transit"
  },
  "locationHistory": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2024-01-01T12:20:00Z",
      "accuracy": 10.5,
      "heading": 45.0,
      "speed": 25.5
    }
  ]
}
```

---

## Webhook Endpoints

### POST /api/webhooks/:platform

Receive webhook from external platform.

**Headers:**
```
X-API-Key: <api_key>
```

**Request Body:**
```json
{
  "type": "order.created",
  "order_id": "external_order_123",
  "customer": {
    "name": "Jane Doe",
    "phone": "+1234567890"
  },
  "items": [...],
  "delivery_address": {...}
}
```

**Response (200):**
```json
{
  "received": true
}
```

### GET /api/webhooks/configs

Get webhook configurations (authenticated).

**Response (200):**
```json
{
  "configs": [
    {
      "id": "uuid",
      "restaurant_id": "uuid",
      "platform": "doordash",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Admin Endpoints

### GET /api/admin/stats

Get platform statistics (admin only).

**Response (200):**
```json
{
  "stats": {
    "totalOrders": 1250,
    "activeDeliveries": 45,
    "totalRiders": 25,
    "totalRestaurants": 15,
    "todayOrders": 32
  }
}
```

---

## WebSocket Events

### Connection

Connect with JWT token:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Events

#### Emit: `rider:location`

Rider sends location update:

```javascript
socket.emit('rider:location', {
  latitude: 40.7128,
  longitude: -74.0060,
  deliveryId: 'uuid' // optional
});
```

#### Listen: `delivery:location`

Receive rider location updates:

```javascript
socket.on('delivery:location', (data) => {
  console.log('Rider location:', data);
  // { deliveryId, latitude, longitude, timestamp }
});
```

#### Listen: `delivery:update`

Receive delivery status updates:

```javascript
socket.on('delivery:update', (data) => {
  console.log('Delivery updated:', data);
  // { deliveryId, status, ... }
});
```

#### Join: `delivery:join`

Join delivery room for real-time updates:

```javascript
socket.emit('delivery:join', 'delivery_uuid');
```

---

## Error Handling

### Validation Errors

```json
{
  "error": "Missing required fields",
  "statusCode": 400,
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

### Authentication Errors

```json
{
  "error": "Invalid credentials",
  "statusCode": 401
}
```

### Authorization Errors

```json
{
  "error": "Forbidden: Insufficient permissions",
  "statusCode": 403
}
```

### Not Found Errors

```json
{
  "error": "Order not found",
  "statusCode": 404
}
```

---

## Pagination

For list endpoints, use query parameters:

```
GET /api/orders?limit=20&offset=0
```

**Response:**
```json
{
  "orders": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}
```

---

## Filtering & Sorting

### Filtering

Use query parameters:
```
GET /api/orders?status=pending&restaurantId=uuid
```

### Sorting

Use `sort` and `order` parameters:
```
GET /api/orders?sort=created_at&order=desc
```

---

## Versioning

Current API version: `v1`

Future versions will use URL versioning:
```
/api/v1/orders
/api/v2/orders
```
