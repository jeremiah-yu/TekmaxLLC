import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase } from './database/connection';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurants';
import orderRoutes from './routes/orders';
import deliveryRoutes from './routes/deliveries';
import riderRoutes from './routes/riders';
import trackingRoutes from './routes/tracking';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import integrationRoutes from './routes/integrations';
import notificationRoutes from './routes/notifications';

// Socket handlers
import { setupSocketIO } from './socket/socketHandler';

// Delivery polling
import { startDeliveryPolling } from './services/deliveryPoller';

// Task processor for scheduled tasks (DoorDash calls, etc.)
import { startTaskProcessor } from './services/taskProcessor';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling
app.use(errorHandler);

// Setup Socket.IO
setupSocketIO(io);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database connected');
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO ready for real-time updates`);
      
      // Start delivery polling (every 30 seconds)
      startDeliveryPolling(30);
      console.log(`🔄 Delivery status polling started (every 30 seconds)`);
      
      // Start task processor (processes scheduled tasks like DoorDash calls)
      startTaskProcessor();
      console.log(`⏰ Task processor started (processes scheduled tasks every minute)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
