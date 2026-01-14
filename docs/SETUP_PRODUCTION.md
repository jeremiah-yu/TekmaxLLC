# Production Setup Guide - Gloria Food & DoorDash Integration

## Overview

This guide will help you set up the system to receive **actual orders from Gloria Food** and call **actual DoorDash riders** using a **real PostgreSQL database**.

---

## Step 1: Database Setup (PostgreSQL)

### 1.1 Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 1.2 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tekmax_delivery;

# Create user (optional)
CREATE USER tekmax_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tekmax_delivery TO tekmax_user;

# Exit
\q
```

### 1.3 Run Database Migrations

```bash
cd backend

# Set database connection
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=tekmax_delivery
export DB_USER=postgres
export DB_PASSWORD=your_password

# Or create .env file in backend/
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=tekmax_delivery
# DB_USER=postgres
# DB_PASSWORD=your_password

# Run migrations
npm run migrate
# Or manually run:
psql -U postgres -d tekmax_delivery -f ../database/schema.sql
psql -U postgres -d tekmax_delivery -f ../database/migrations/002_add_integrations.sql
```

### 1.4 Verify Database Tables

```sql
-- Connect to database
psql -U postgres -d tekmax_delivery

-- Check tables exist
\dt

-- Should see:
-- - users
-- - restaurants
-- - orders
-- - order_items
-- - deliveries
-- - restaurant_settings
-- - webhook_configs
-- - webhook_events
-- - scheduled_tasks
```

---

## Step 2: Backend Configuration

### 2.1 Create `.env` File

Create `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tekmax_delivery
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=production

# API URL (for webhooks - use your actual domain in production)
API_URL=http://localhost:3000
# Production: API_URL=https://api.yourdomain.com

# Frontend URL
FRONTEND_URL=http://localhost:3001
# Production: FRONTEND_URL=https://yourdomain.com

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Disable mock database (use real PostgreSQL)
USE_MOCK_DB=false
```

### 2.2 Generate JWT Secret

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output to `JWT_SECRET` in `.env`.

### 2.3 Install Dependencies & Build

```bash
cd backend
npm install
npm run build
```

---

## Step 3: Gloria Food Setup

### 3.1 Get Gloria Food Credentials

1. Log in to your **Gloria Food Dashboard**
2. Go to **Settings** → **API/Integrations**
3. Get:
   - **API Key**
   - **Store ID**
   - **Master Key**

### 3.2 Configure in TekMax

1. Start backend server:
   ```bash
   cd backend
   npm start
   ```

2. Log in to **Merchant Dashboard** → **Integrations**

3. Enter Gloria Food credentials:
   - **Gloria Food API Key**
   - **Gloria Food Store ID**
   - **Gloria Food Master Key**

4. Click **"Save & Connect"**

5. **Copy the Webhook URL** shown (e.g., `http://your-domain.com/api/webhooks/gloria-food`)

### 3.3 Configure Webhook in Gloria Food

1. Go to **Gloria Food Dashboard** → **Settings** → **Webhooks**

2. Add new webhook:
   - **URL**: Paste the webhook URL from TekMax
   - **Events**: Select "Order Created" or "New Order"
   - **Method**: POST
   - **Headers**: 
     - `x-api-key`: Your Gloria Food API Key (from TekMax)

3. **Save** the webhook

### 3.4 Test Gloria Food Webhook

**Option 1: Create test order in Gloria Food**
- Create a test order in your Gloria Food store
- Check TekMax dashboard → Orders
- Order should appear automatically

**Option 2: Manual test with curl**
```bash
curl -X POST http://localhost:3000/api/webhooks/gloria-food \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_GLORIA_FOOD_API_KEY" \
  -d '{
    "order_id": "GF-TEST-001",
    "customer_name": "Test Customer",
    "customer_phone": "+1234567890",
    "customer_email": "test@example.com",
    "delivery_address": {
      "address": "123 Test Street",
      "city": "Test City",
      "state": "CA",
      "zip": "12345",
      "country": "US"
    },
    "items": [
      {
        "name": "Test Item",
        "quantity": 1,
        "price": 10.00
      }
    ],
    "subtotal": 10.00,
    "tax": 0.80,
    "delivery_fee": 2.50,
    "total": 13.30,
    "order_time": "2024-01-01T12:00:00Z"
  }'
```

**Check if order was created:**
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
```

---

## Step 4: DoorDash Setup

### 4.1 Get DoorDash API Credentials

1. Go to **DoorDash Developer Portal**: https://developer.doordash.com/
2. Sign up / Log in
3. Create a new application
4. Get credentials:
   - **Developer ID**
   - **Key ID**
   - **Signing Secret**
   - **Merchant ID** (if you have one)

### 4.2 Configure in TekMax

1. Go to **Merchant Dashboard** → **Integrations**

2. Enter DoorDash credentials:
   - **DoorDash Developer ID**
   - **DoorDash Key ID**
   - **DoorDash Signing Secret**
   - **DoorDash Merchant ID** (optional)
   - **Sandbox Mode**: Check for testing, uncheck for production

3. Click **"Save & Connect"**

### 4.3 Test DoorDash Integration

**Option 1: Wait for automatic call**
- Accept an order (status: 'confirmed')
- Wait 20-25 minutes
- Check server logs for DoorDash API call
- Check `scheduled_tasks` table:
  ```sql
  SELECT * FROM scheduled_tasks WHERE task_type = 'doordash_call' ORDER BY scheduled_at DESC;
  ```

**Option 2: Manual test**
```sql
-- Get an order ID
SELECT id, order_number FROM orders WHERE status = 'confirmed' LIMIT 1;

-- Manually trigger DoorDash call (via API or direct function call)
```

---

## Step 5: Production Deployment

### 5.1 Server Requirements

- **Node.js** 18+ 
- **PostgreSQL** 12+
- **SSL Certificate** (for HTTPS)
- **Domain name** (for webhooks)

### 5.2 Environment Variables (Production)

```env
# Database (Production)
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=tekmax_delivery
DB_USER=tekmax_user
DB_PASSWORD=secure_password

# Server
PORT=3000
NODE_ENV=production

# API URL (MUST be HTTPS in production)
API_URL=https://api.yourdomain.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# JWT Secret (use strong random string)
JWT_SECRET=production_jwt_secret_here

# Disable mock database
USE_MOCK_DB=false
```

### 5.3 Update Webhook URLs

After deploying to production:

1. **Update API_URL** in `.env` to your production domain
2. **Restart backend server**
3. **Go to Integrations page** → Copy new webhook URL
4. **Update webhook URL in Gloria Food dashboard**

### 5.4 Monitor Logs

```bash
# Check server logs
tail -f /var/log/tekmax/backend.log

# Check database
psql -U postgres -d tekmax_delivery -c "SELECT COUNT(*) FROM orders;"

# Check scheduled tasks
psql -U postgres -d tekmax_delivery -c "SELECT * FROM scheduled_tasks WHERE status = 'pending';"
```

---

## Step 6: Verification Checklist

### ✅ Database
- [ ] PostgreSQL installed and running
- [ ] Database `tekmax_delivery` created
- [ ] All tables created (run migrations)
- [ ] Can connect to database
- [ ] `USE_MOCK_DB=false` in `.env`

### ✅ Backend
- [ ] Backend server running on port 3000
- [ ] Database connection successful
- [ ] Task processor started (check logs)
- [ ] Webhook endpoint accessible: `http://localhost:3000/api/webhooks/gloria-food`

### ✅ Gloria Food
- [ ] Credentials saved in TekMax
- [ ] Webhook URL configured in Gloria Food
- [ ] Test order received successfully
- [ ] Order appears in TekMax dashboard

### ✅ DoorDash
- [ ] Credentials saved in TekMax
- [ ] Sandbox mode enabled for testing
- [ ] Order accepted (status: 'confirmed')
- [ ] Scheduled task created in database
- [ ] DoorDash API called after 20-25 minutes

---

## Step 7: Troubleshooting

### Orders Not Appearing

1. **Check webhook logs:**
   ```sql
   SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;
   ```

2. **Check server logs:**
   ```bash
   # Look for errors in backend console
   ```

3. **Verify webhook URL:**
   - Test webhook URL is accessible
   - Check if Gloria Food can reach your server
   - Verify API key matches

### DoorDash Not Being Called

1. **Check scheduled tasks:**
   ```sql
   SELECT * FROM scheduled_tasks 
   WHERE task_type = 'doordash_call' 
   AND status = 'pending'
   ORDER BY scheduled_at ASC;
   ```

2. **Check DoorDash credentials:**
   ```sql
   SELECT doordash_developer_id, doordash_key_id, is_doordash_connected
   FROM restaurant_settings
   WHERE restaurant_id = 'YOUR_RESTAURANT_ID';
   ```

3. **Check task processor:**
   - Look for "Task processor started" in server logs
   - Check if tasks are being processed every minute

4. **Check DoorDash API response:**
   - Look for DoorDash API errors in server logs
   - Verify credentials are correct
   - Check if sandbox mode is correct

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   # Windows
   services.msc → PostgreSQL

   # Mac/Linux
   sudo systemctl status postgresql
   ```

2. **Test connection:**
   ```bash
   psql -U postgres -d tekmax_delivery -c "SELECT 1;"
   ```

3. **Check .env file:**
   - Verify all DB_* variables are correct
   - No typos in password

---

## Step 8: Production Best Practices

### 8.1 Security

- ✅ Use **HTTPS** for all webhooks
- ✅ Use **strong JWT secret**
- ✅ Use **secure database passwords**
- ✅ Enable **firewall** rules
- ✅ Use **environment variables** (never commit .env)

### 8.2 Monitoring

- ✅ Set up **error logging** (e.g., Sentry)
- ✅ Monitor **database performance**
- ✅ Monitor **API response times**
- ✅ Set up **alerts** for failed tasks

### 8.3 Backup

- ✅ **Daily database backups**
- ✅ **Backup webhook events** (for debugging)
- ✅ **Backup scheduled tasks** (before cleanup)

### 8.4 Scaling

- ✅ Use **connection pooling** for database
- ✅ Consider **job queue** (Bull, Agenda) instead of setTimeout
- ✅ Use **Redis** for task scheduling in production
- ✅ Consider **load balancer** for multiple servers

---

## Quick Start Commands

```bash
# 1. Setup database
createdb tekmax_delivery
psql -U postgres -d tekmax_delivery -f database/schema.sql
psql -U postgres -d tekmax_delivery -f database/migrations/002_add_integrations.sql

# 2. Configure backend
cd backend
cp .env.example .env
# Edit .env with your database credentials

# 3. Start backend
npm install
npm run build
npm start

# 4. Start frontend (separate terminal)
cd frontend
npm install
npm run dev

# 5. Test
# - Create account
# - Configure integrations
# - Test webhook
```

---

## Support

If you encounter issues:

1. Check **server logs** for errors
2. Check **database** for data
3. Check **webhook_events** table for incoming webhooks
4. Check **scheduled_tasks** table for DoorDash calls
5. Review this guide step-by-step

---

## Next Steps

After setup is complete:

1. ✅ Test with **real Gloria Food order**
2. ✅ Verify **DoorDash call** happens automatically
3. ✅ Monitor **first few orders** closely
4. ✅ Set up **monitoring/alerts**
5. ✅ Document **any custom configurations**

Good luck! 🚀
