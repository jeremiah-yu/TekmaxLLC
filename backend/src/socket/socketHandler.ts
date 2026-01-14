import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export function setupSocketIO(io: Server): { emitDeliveryUpdate: (deliveryId: string, data: any) => void; notifyRestaurant: (restaurantId: string, event: string, data: any) => void } {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        role: string;
      };

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join role-specific room
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    // Rider location updates
    socket.on('rider:location', async (data: { latitude: number; longitude: number; deliveryId?: string }) => {
      if (socket.userRole !== 'rider') {
        return;
      }

      try {
        const riderResult = await query('SELECT id FROM riders WHERE user_id = $1', [socket.userId]);
        if (riderResult.rows.length === 0) return;

        const riderId = riderResult.rows[0].id;

        // Update rider location
        await query(
          'UPDATE riders SET current_latitude = $1, current_longitude = $2 WHERE id = $3',
          [data.latitude, data.longitude, riderId]
        );

        // If delivery ID provided, update location tracking
        if (data.deliveryId) {
          await query(
            `INSERT INTO location_updates (delivery_id, rider_id, latitude, longitude)
             VALUES ($1, $2, $3, $4)`,
            [data.deliveryId, riderId, data.latitude, data.longitude]
          );

          // Broadcast to restaurant and admin
          io.to(`role:restaurant_owner`).to(`role:admin`).emit('delivery:location', {
            deliveryId: data.deliveryId,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error updating rider location:', error);
      }
    });

    // Join delivery room for real-time tracking
    socket.on('delivery:join', (deliveryId: string) => {
      socket.join(`delivery:${deliveryId}`);
    });

    // Leave delivery room
    socket.on('delivery:leave', (deliveryId: string) => {
      socket.leave(`delivery:${deliveryId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  // Helper function to emit delivery updates
  function emitDeliveryUpdate(deliveryId: string, data: any): void {
    io.to(`delivery:${deliveryId}`).emit('delivery:update', data);
  }

  // Helper function to notify restaurant
  function notifyRestaurant(restaurantId: string, event: string, data: any): void {
    io.to(`restaurant:${restaurantId}`).emit(event, data);
  }

  return { emitDeliveryUpdate, notifyRestaurant };
}
