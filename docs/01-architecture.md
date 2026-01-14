# System Architecture

## Overview

TekMax is a multi-tenant SaaS delivery management platform designed to scale from startup to enterprise. The architecture follows modern best practices with clear separation of concerns, horizontal scalability, and cloud-native design.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Web Dashboard (Next.js/React)  │  Mobile App (Future)          │
│  - Admin Dashboard              │  - Rider App                 │
│  - Restaurant Dashboard         │  - Customer App               │
│  - Rider Dashboard              │                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                 │
│                    (Cloud Load Balancer / Nginx)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Backend API (Node.js/Express)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth       │  │   Orders     │  │  Deliveries  │         │
│  │   Service    │  │   Service    │  │  Service     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Riders     │  │   Tracking   │  │  Webhooks    │         │
│  │   Service    │  │   Service    │  │  Service     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  Real-time Layer (Socket.IO)                                   │
│  - Location Updates                                             │
│  - Status Changes                                               │
│  - Notifications                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Primary Database)                                   │
│  - Users, Restaurants, Orders, Deliveries                       │
│  - Multi-tenant data isolation                                  │
│                                                                 │
│  Redis (Caching & Sessions) - Future                            │
│  - Session storage                                              │
│  - Rate limiting                                                │
│  - Real-time data cache                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│  Google Maps API    │  Twilio (SMS)    │  SendGrid (Email)      │
│  - Geocoding        │  - Notifications  │  - Notifications       │
│  - Directions       │  - OTP            │  - Reports            │
│  - Distance Matrix  │                   │                        │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (Next.js/React)

**Technology Stack:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Socket.IO Client (real-time updates)
- React Query (data fetching)

**Key Features:**
- Server-side rendering for SEO
- Client-side routing
- Real-time updates via WebSocket
- Responsive design (mobile-first)
- Role-based UI rendering

**Dashboard Types:**
- **Admin Dashboard**: Platform-wide analytics, user management, system configuration
- **Restaurant Dashboard**: Order management, rider assignment, analytics
- **Rider Dashboard**: Delivery assignments, navigation, status updates

### 2. Backend API (Node.js/Express)

**Technology Stack:**
- Node.js 18+
- Express.js
- TypeScript
- PostgreSQL (via pg)
- Socket.IO (real-time)
- JWT (authentication)
- Zod (validation)

**Architecture Pattern:**
- RESTful API design
- Layered architecture (Routes → Controllers → Services → Database)
- Middleware-based authentication/authorization
- Error handling middleware
- Rate limiting

**Key Modules:**
- **Authentication**: JWT-based auth, role-based access control
- **Orders**: Order creation, status management, webhook processing
- **Deliveries**: Assignment, tracking, status updates
- **Riders**: Management, availability, location tracking
- **Tracking**: Real-time GPS updates, ETA calculation
- **Webhooks**: External platform integrations

### 3. Database (PostgreSQL)

**Design Principles:**
- Relational database with proper normalization
- Multi-tenant architecture (restaurant_id in most tables)
- Indexes on frequently queried columns
- Foreign key constraints for data integrity
- UUID primary keys for security

**Key Tables:**
- `users`: Authentication and user profiles
- `restaurants`: Multi-tenant restaurant data
- `orders`: Order information
- `deliveries`: Delivery tracking
- `riders`: Rider profiles and status
- `location_updates`: GPS tracking history
- `webhook_configs`: Integration configurations

### 4. Real-time Layer (Socket.IO)

**Purpose:**
- Live location tracking
- Instant status updates
- Push notifications
- Real-time dashboard updates

**Event Types:**
- `rider:location`: GPS updates from rider app
- `delivery:update`: Delivery status changes
- `order:new`: New order notifications
- `notification`: General notifications

## Scalability Design

### Horizontal Scaling

1. **Stateless API Servers**
   - Multiple API instances behind load balancer
   - No session storage in memory
   - JWT tokens for stateless auth

2. **Database Scaling**
   - Read replicas for read-heavy operations
   - Connection pooling (pg-pool)
   - Query optimization with indexes

3. **Real-time Scaling**
   - Socket.IO with Redis adapter (future)
   - Multiple Socket.IO servers can share state
   - Horizontal scaling of WebSocket connections

### Vertical Scaling

1. **Database Optimization**
   - Proper indexing strategy
   - Query optimization
   - Connection pooling
   - Partitioning for large tables (future)

2. **Caching Strategy** (Future)
   - Redis for frequently accessed data
   - Cache restaurant settings
   - Cache rider availability
   - Cache order status

### Multi-Tenancy

**Approach: Row-Level Security**
- Each restaurant has isolated data
- `restaurant_id` foreign key in relevant tables
- Middleware enforces tenant isolation
- No cross-tenant data access

## Security Architecture

### Authentication & Authorization

1. **JWT Tokens**
   - Stateless authentication
   - Token expiration (7 days default)
   - Refresh token mechanism (future)

2. **Role-Based Access Control (RBAC)**
   - Admin: Full platform access
   - Restaurant Owner: Own restaurant data
   - Rider: Own deliveries and location

3. **API Security**
   - Rate limiting (100 req/15min per IP)
   - Auth rate limiting (5 req/15min)
   - CORS configuration
   - Input validation (Zod schemas)

### Data Security

1. **Password Hashing**
   - bcrypt with salt rounds (10)

2. **SQL Injection Prevention**
   - Parameterized queries (pg library)
   - No raw SQL string concatenation

3. **Sensitive Data**
   - Environment variables for secrets
   - No secrets in codebase
   - API keys stored securely

## Deployment Architecture

### Development
- Local PostgreSQL database
- Single API server
- Local frontend dev server

### Production (Recommended)
- **Cloud Provider**: AWS / Google Cloud / Azure
- **Compute**: Containerized (Docker) on Kubernetes or ECS
- **Database**: Managed PostgreSQL (RDS / Cloud SQL)
- **Load Balancer**: Application Load Balancer
- **CDN**: CloudFront / Cloudflare (for static assets)
- **Monitoring**: CloudWatch / Datadog
- **Logging**: CloudWatch Logs / ELK Stack

### CI/CD Pipeline (Future)
- GitHub Actions / GitLab CI
- Automated testing
- Docker image builds
- Automated deployments
- Database migrations

## Performance Considerations

### Database
- Indexes on foreign keys and frequently queried columns
- Connection pooling (max 20 connections)
- Query optimization
- Pagination for large result sets

### API
- Response compression (gzip)
- Efficient JSON serialization
- Batch operations where possible
- Async/await for non-blocking I/O

### Frontend
- Code splitting (Next.js automatic)
- Image optimization
- Lazy loading
- Client-side caching (React Query)

## Monitoring & Observability

### Logging
- Structured logging (JSON format)
- Log levels (error, warn, info, debug)
- Request/response logging
- Error stack traces

### Metrics (Future)
- API response times
- Database query performance
- Active deliveries count
- Rider availability
- Error rates

### Alerts (Future)
- High error rates
- Database connection issues
- API downtime
- High latency

## Technology Choices Rationale

### Why Node.js/Express?
- JavaScript ecosystem (shared with frontend)
- Excellent real-time support (Socket.IO)
- Fast development cycle
- Large package ecosystem
- Good performance for I/O-heavy operations

### Why PostgreSQL?
- ACID compliance
- Strong relational data model
- Excellent performance
- JSON support (for flexible data)
- Open source and reliable

### Why Next.js?
- Server-side rendering
- Excellent developer experience
- Built-in optimization
- TypeScript support
- Large community

### Why Socket.IO?
- Cross-browser WebSocket support
- Automatic fallback to polling
- Room-based messaging
- Built-in authentication support
- Horizontal scaling support

## Future Architecture Enhancements

1. **Microservices** (if needed)
   - Separate services for orders, deliveries, notifications
   - Service mesh (Istio)
   - API Gateway (Kong)

2. **Message Queue**
   - RabbitMQ / AWS SQS for async processing
   - Background job processing
   - Event-driven architecture

3. **Search**
   - Elasticsearch for order search
   - Full-text search capabilities

4. **Analytics**
   - Data warehouse (Redshift / BigQuery)
   - Business intelligence tools
   - Custom analytics dashboard
