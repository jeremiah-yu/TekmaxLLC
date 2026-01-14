# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create database
createdb tekmax_delivery

# Run schema
psql -d tekmax_delivery -f database/schema.sql

# (Optional) Seed test data
psql -d tekmax_delivery -f database/seed.sql
```

### 3. Environment Configuration

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and API keys
```

**Frontend (.env.local):**
```bash
cd frontend
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
```

### 4. Start Development Servers

**Option 1: Run separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option 2: Run together (from root)**
```bash
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

## First Steps

1. **Register a Restaurant Owner Account**
   - Go to http://localhost:3001/register
   - Create account with role "restaurant_owner"

2. **Create a Restaurant**
   - Login and navigate to restaurants
   - Create your first restaurant

3. **Register a Rider Account**
   - Register with role "rider"
   - Complete rider profile

4. **Create an Order**
   - As restaurant owner, create a test order
   - Update order status to "ready"

5. **Assign Delivery**
   - Assign the order to the rider
   - Watch real-time updates

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "restaurant_owner"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Use the token from login response for authenticated requests
curl -X GET http://localhost:3000/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
tekmax/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, error handling
│   │   ├── database/    # DB connection
│   │   └── socket/      # WebSocket handlers
│   └── package.json
├── frontend/            # Next.js/React app
│   ├── src/
│   │   ├── app/         # Next.js pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities
│   └── package.json
├── database/            # SQL schemas
│   ├── schema.sql       # Complete schema
│   └── seed.sql         # Test data
└── docs/                # Documentation
    ├── 01-architecture.md
    ├── 02-features.md
    ├── 03-database.md
    ├── 04-api-design.md
    ├── 05-roadmap.md
    ├── 06-partnerships.md
    └── 07-demo.md
```

## Common Issues

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Ensure database exists: `psql -l`

### Port Already in Use
- Change PORT in backend `.env`
- Change port in frontend `package.json` scripts

### CORS Errors
- Verify FRONTEND_URL in backend `.env` matches frontend URL
- Check CORS configuration in `backend/src/index.ts`

### Module Not Found
- Run `npm install` in both backend and frontend
- Clear node_modules and reinstall if needed

## Next Steps

1. Read the [Architecture Documentation](./docs/01-architecture.md)
2. Review [API Design](./docs/04-api-design.md)
3. Check [Feature Breakdown](./docs/02-features.md)
4. Follow the [MVP Roadmap](./docs/05-roadmap.md)

## Support

For issues or questions:
1. Check the documentation in `docs/`
2. Review code comments
3. Check GitHub issues (if applicable)

## Development Tips

- Use TypeScript for type safety
- Follow REST API conventions
- Write clear commit messages
- Test before committing
- Keep documentation updated
