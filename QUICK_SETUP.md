# 🚀 Quick Setup Guide - Actual Working Integration

## TL;DR - What You Need to Do

### 1. Setup PostgreSQL Database (5 minutes)

```bash
# Install PostgreSQL (if not installed)
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
createdb tekmax_delivery

# Run migrations
psql -U postgres -d tekmax_delivery -f database/schema.sql
psql -U postgres -d tekmax_delivery -f database/migrations/002_add_integrations.sql
```

### 2. Configure Backend (2 minutes)

Create `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tekmax_delivery
DB_USER=postgres
DB_PASSWORD=your_password_here
USE_MOCK_DB=false
API_URL=http://localhost:3000
JWT_SECRET=your_random_secret_here
```

### 3. Get Gloria Food Credentials (5 minutes)

1. Log in to **Gloria Food Dashboard**
2. Go to **Settings** → **API/Integrations**
3. Copy:
   - API Key
   - Store ID  
   - Master Key

### 4. Get DoorDash Credentials (10 minutes)

1. Go to **https://developer.doordash.com/**
2. Sign up / Log in
3. Create application
4. Copy:
   - Developer ID
   - Key ID
   - Signing Secret

### 5. Configure in TekMax (3 minutes)

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Log in to **Merchant Dashboard**
4. Go to **Integrations**
5. Enter **Gloria Food** credentials → Save
6. Enter **DoorDash** credentials → Save
7. **Copy Webhook URL** from Gloria Food section

### 6. Configure Gloria Food Webhook (3 minutes)

1. Go to **Gloria Food Dashboard** → **Settings** → **Webhooks**
2. Add webhook:
   - URL: `http://your-domain.com/api/webhooks/gloria-food`
   - Events: "Order Created"
   - Header: `x-api-key: YOUR_API_KEY`

### 7. Test! (2 minutes)

1. Create test order in **Gloria Food**
2. Check **TekMax Dashboard** → **Orders**
3. Order should appear automatically
4. Order will be **auto-accepted**
5. **DoorDash will be called** 20-25 minutes later

---

## ✅ Verification

### Check Database
```sql
-- Connect
psql -U postgres -d tekmax_delivery

-- Check orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- Check scheduled tasks
SELECT * FROM scheduled_tasks WHERE task_type = 'doordash_call';
```

### Check Server Logs
```bash
# Should see:
✅ Database connected
🚀 Server running on port 3000
⏰ Task processor started
```

### Check Integrations
- Gloria Food: Status = "Connected" (green badge)
- DoorDash: Status = "Connected" (green badge)
- Webhook URL is visible

---

## 🔧 Common Issues

### "Database connection error"
→ Check `.env` file has correct DB credentials
→ Make sure PostgreSQL is running
→ Verify database `tekmax_delivery` exists

### "Orders not appearing"
→ Check webhook URL is correct in Gloria Food
→ Check API key matches
→ Check server logs for errors
→ Check `webhook_events` table

### "DoorDash not being called"
→ Check DoorDash credentials are saved
→ Check `scheduled_tasks` table has pending tasks
→ Check task processor is running (server logs)
→ Wait 20-25 minutes after order acceptance

---

## 📋 Full Documentation

See `docs/SETUP_PRODUCTION.md` for detailed step-by-step guide.

---

## 🎯 What Happens When It Works

1. **Order comes from Gloria Food** → Webhook received
2. **Order saved to database** → Status: 'pending'
3. **Order auto-accepted** → Status: 'confirmed'
4. **DoorDash scheduled** → Task created for 20-25 min later
5. **Task processor runs** → Calls DoorDash API
6. **Delivery created** → DoorDash rider assigned
7. **Status updates** → Tracked in TekMax dashboard

---

## 🚨 Important Notes

- **Webhook URL must be accessible** from internet (use ngrok for local testing)
- **DoorDash Sandbox mode** for testing, disable for production
- **Database must be PostgreSQL** (not mock database)
- **Task processor must be running** (starts automatically with server)

---

Good luck! 🎉
