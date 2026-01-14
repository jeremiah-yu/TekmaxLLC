import express from 'express';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Get notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    let restaurantId: string | undefined;

    // Get restaurant_id for restaurant owners
    if (req.user!.role === 'restaurant_owner') {
      const restaurantResult = await query(
        'SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1',
        [userId]
      );
      restaurantId = restaurantResult.rows[0]?.id;
    }

    // Build query based on user role
    let notificationsQuery;
    let params: any[];

    if (req.user!.role === 'restaurant_owner' && restaurantId) {
      // Restaurant owners get notifications for their restaurant
      notificationsQuery = `
        SELECT * FROM notifications 
        WHERE restaurant_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `;
      params = [restaurantId];
    } else {
      // Other users get notifications by user_id
      notificationsQuery = `
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `;
      params = [userId];
    }

    const result = await query(notificationsQuery, params);

    res.json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get unread notifications count
router.get('/unread-count', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    let restaurantId: string | undefined;

    if (req.user!.role === 'restaurant_owner') {
      const restaurantResult = await query(
        'SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1',
        [userId]
      );
      restaurantId = restaurantResult.rows[0]?.id;
    }

    let countQuery;
    let params: any[];

    if (req.user!.role === 'restaurant_owner' && restaurantId) {
      countQuery = `
        SELECT COUNT(*) as count FROM notifications 
        WHERE restaurant_id = $1 AND is_read = false
      `;
      params = [restaurantId];
    } else {
      countQuery = `
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `;
      params = [userId];
    }

    const result = await query(countQuery, params);
    const count = parseInt(result.rows[0].count, 10);

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify notification belongs to user or their restaurant
    const notificationResult = await query(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );

    if (notificationResult.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    const notification = notificationResult.rows[0];

    // Check access
    if (req.user!.role === 'restaurant_owner') {
      const restaurantResult = await query(
        'SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1',
        [userId]
      );
      const restaurantId = restaurantResult.rows[0]?.id;
      
      if (notification.restaurant_id !== restaurantId) {
        throw new AppError('Access denied', 403);
      }
    } else {
      if (notification.user_id !== userId) {
        throw new AppError('Access denied', 403);
      }
    }

    // Mark as read
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    let restaurantId: string | undefined;

    if (req.user!.role === 'restaurant_owner') {
      const restaurantResult = await query(
        'SELECT id FROM restaurants WHERE owner_id = $1 LIMIT 1',
        [userId]
      );
      restaurantId = restaurantResult.rows[0]?.id;
    }

    let updateQuery;
    let params: any[];

    if (req.user!.role === 'restaurant_owner' && restaurantId) {
      updateQuery = `
        UPDATE notifications 
        SET is_read = true 
        WHERE restaurant_id = $1 AND is_read = false
      `;
      params = [restaurantId];
    } else {
      updateQuery = `
        UPDATE notifications 
        SET is_read = true 
        WHERE user_id = $1 AND is_read = false
      `;
      params = [userId];
    }

    await query(updateQuery, params);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
