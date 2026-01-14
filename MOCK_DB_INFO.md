# Mock Database Mode - Quick Reference

## ✅ Application is Running!

The TekMax platform is now running with **MOCK DATABASE** mode - no PostgreSQL required!

## 🌐 Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🔑 Pre-loaded Test Accounts

The mock database comes with pre-configured test accounts:

### Admin Account
- **Email**: `admin@tekmax.com`
- **Password**: `admin123`
- **Role**: Admin (full platform access)

### Restaurant Owner Account
- **Email**: `owner@restaurant.com`
- **Password**: `owner123`
- **Role**: Restaurant Owner
- **Restaurant**: Pizza Palace (already created)

### Rider Account
- **Email**: `rider@tekmax.com`
- **Password**: `rider123`
- **Role**: Rider
- **Status**: Available and online

## 🚀 Quick Start

1. **Open the frontend**: http://localhost:3001
2. **Login** with any of the test accounts above
3. **Explore the platform**:
   - Restaurant owners can create orders
   - Assign deliveries to riders
   - Track deliveries in real-time
   - View analytics

## 📝 Notes

- **Data is in-memory**: All data is stored in memory and will be lost when the server restarts
- **No persistence**: This is for testing/demo purposes only
- **Pre-seeded data**: The mock database includes sample restaurant and rider data
- **Full functionality**: All API endpoints work with the mock database

## 🔄 Switching to PostgreSQL

To use a real PostgreSQL database:

1. Install PostgreSQL
2. Create database: `createdb tekmax_delivery`
3. Run schema: `psql -d tekmax_delivery -f database/schema.sql`
4. Update `backend/.env`:
   ```
   USE_MOCK_DB=false
   DB_HOST=localhost
   DB_PASSWORD=your_password
   ```
5. Restart the backend server

## 🎯 What Works

✅ User authentication (login/register)  
✅ Restaurant management  
✅ Order creation and management  
✅ Rider management  
✅ Delivery assignment  
✅ Real-time updates (Socket.IO)  
✅ All API endpoints  

## ⚠️ Limitations

- Data is lost on server restart
- No data persistence
- Simplified query parsing (some complex SQL may not work)
- Not suitable for production

## 🎉 Enjoy Testing!

The application is fully functional for testing and demonstration purposes. All features work as expected with the mock database!
