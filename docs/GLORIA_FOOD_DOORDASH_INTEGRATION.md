# Gloria Food & DoorDash Integration Guide

## Overview

This document explains how the system automatically receives orders from Gloria Food and schedules DoorDash delivery calls.

## Flow Diagram

```
1. Gloria Food Order Created
   ↓
2. Webhook sent to /api/webhooks/gloria-food
   ↓
3. Order created in database (status: 'pending')
   ↓
4. Order automatically accepted (status: 'confirmed')
   ↓
5. DoorDash call scheduled for 20-25 minutes later
   ↓
6. Task Processor picks up scheduled task
   ↓
7. DoorDash API called to create delivery
   ↓
8. Delivery status updated in system
```

## Setup Instructions

### 1. Configure Gloria Food Integration

1. Go to Merchant Dashboard → Integrations
2. Connect your Gloria Food account:
   - Enter your Gloria Food API Key
   - Enter your Gloria Food Store ID
   - Enter your Gloria Food Master Key
3. Copy the webhook URL shown (e.g., `http://your-domain.com/api/webhooks/gloria-food`)
4. Configure this webhook URL in your Gloria Food dashboard settings

### 2. Configure DoorDash Integration

1. Go to Merchant Dashboard → Integrations
2. Connect your DoorDash account:
   - Enter DoorDash Developer ID
   - Enter DoorDash Key ID
   - Enter DoorDash Signing Secret
   - Enter DoorDash Merchant ID (optional)
   - Enable/Disable Sandbox mode

### 3. How It Works

#### When a Gloria Food Order Arrives:

1. **Webhook Receives Order**: 
   - Gloria Food sends order data to `/api/webhooks/gloria-food`
   - System validates API key and processes order

2. **Order Created**:
   - Order is saved to database with status `'pending'`
   - Order items are created
   - Delivery record is created

3. **Automatic Acceptance**:
   - Order status is automatically changed to `'confirmed'`
   - This triggers the DoorDash scheduling

4. **DoorDash Scheduling**:
   - System calculates random delay: **20-25 minutes** (randomized)
   - Scheduled task is created in `scheduled_tasks` table
   - Task will be executed by the Task Processor

5. **Task Execution**:
   - Task Processor runs every minute
   - When scheduled time arrives, it calls DoorDash API
   - Creates delivery request on DoorDash
   - Updates delivery record with DoorDash tracking info

## API Endpoints

### Gloria Food Webhook
```
POST /api/webhooks/gloria-food
Headers:
  x-api-key: <your-gloria-food-api-key>
  x-gloria-signature: <webhook-signature> (optional)

Body: Gloria Food order data
```

### DoorDash Webhook (for status updates)
```
POST /api/webhooks/doordash
Headers:
  x-doordash-signature: <webhook-signature>

Body: DoorDash delivery status update
```

## Manual Order Acceptance

If you manually accept an order (change status to 'confirmed' or 'preparing'), the system will also automatically schedule a DoorDash call:

```javascript
PATCH /api/orders/:id/status
Body: { "status": "confirmed" }
```

This will trigger the same 20-25 minute DoorDash scheduling.

## Task Processor

The Task Processor runs automatically when the server starts:
- Processes scheduled tasks every **1 minute**
- Handles DoorDash calls and other scheduled tasks
- Retries failed tasks (you can implement retry logic)

## Monitoring

### Check Scheduled Tasks
```sql
SELECT * FROM scheduled_tasks 
WHERE status = 'pending' 
ORDER BY scheduled_at ASC;
```

### Check DoorDash Deliveries
```sql
SELECT d.*, o.order_number 
FROM deliveries d
JOIN orders o ON d.order_id = o.id
WHERE d.doordash_delivery_id IS NOT NULL;
```

## Troubleshooting

### Orders Not Being Accepted
- Check webhook logs in `webhook_events` table
- Verify API key is correct
- Check server logs for errors

### DoorDash Not Being Called
1. Check if DoorDash credentials are configured:
   ```sql
   SELECT doordash_developer_id, doordash_key_id 
   FROM restaurant_settings 
   WHERE restaurant_id = '<your-restaurant-id>';
   ```

2. Check scheduled tasks:
   ```sql
   SELECT * FROM scheduled_tasks 
   WHERE order_id = '<order-id>';
   ```

3. Check server logs for Task Processor errors

### DoorDash API Errors
- Verify DoorDash credentials are correct
- Check if you're using sandbox mode correctly
- Review DoorDash API response in server logs

## Configuration

### Adjust DoorDash Delay Time

Edit `backend/src/routes/webhooks.ts`:
```typescript
// Change delay range (currently 20-25 minutes)
const delayMinutes = 20 + Math.random() * 5; // 20-25 minutes
```

Or edit `backend/src/routes/orders.ts` for manual acceptance:
```typescript
const delayMinutes = 20 + Math.random() * 5; // 20-25 minutes
```

## Testing

### Test Gloria Food Webhook
```bash
curl -X POST http://localhost:3000/api/webhooks/gloria-food \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "order_id": "GF-12345",
    "customer_name": "Test Customer",
    "customer_phone": "+1234567890",
    "delivery_address": {
      "address": "123 Test St",
      "city": "Test City",
      "state": "CA",
      "zip": "12345"
    },
    "items": [
      {
        "name": "Test Item",
        "quantity": 1,
        "price": 10.00
      }
    ],
    "total": 10.00
  }'
```

## Notes

- DoorDash calls are scheduled with a **random delay between 20-25 minutes** to avoid all orders calling at once
- The Task Processor runs every minute, so tasks may execute up to 1 minute after their scheduled time
- Failed tasks are logged in the `scheduled_tasks` table with error messages
- DoorDash credentials must be configured per restaurant
