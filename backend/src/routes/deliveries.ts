import express from 'express';
import { query } from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { pollDoorDashDeliveryStatus } from '../services/doordashTracking';
import { notifyDeliveryStatusChange } from '../services/notifications';

const router = express.Router();

router.use(authenticate);

// Get deliveries
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    let deliveries;

    if (req.user!.role === 'admin') {
      deliveries = await query(
        `SELECT d.*, o.order_number, o.customer_name, o.customer_phone,
                o.delivery_address_line1, o.delivery_city,
                r.name as restaurant_name,
                u.first_name || ' ' || u.last_name as rider_name
         FROM deliveries d
         JOIN orders o ON d.order_id = o.id
         JOIN restaurants r ON d.restaurant_id = r.id
         LEFT JOIN riders rd ON d.rider_id = rd.id
         LEFT JOIN users u ON rd.user_id = u.id
         ORDER BY d.created_at DESC
         LIMIT 100`
      );
    } else if (req.user!.role === 'restaurant_owner') {
      deliveries = await query(
        `SELECT d.*, o.order_number, o.customer_name, o.customer_phone,
                o.delivery_address_line1, o.delivery_city,
                r.name as restaurant_name,
                u.first_name || ' ' || u.last_name as rider_name
         FROM deliveries d
         JOIN orders o ON d.order_id = o.id
         JOIN restaurants r ON d.restaurant_id = r.id
         LEFT JOIN riders rd ON d.rider_id = rd.id
         LEFT JOIN users u ON rd.user_id = u.id
         WHERE r.owner_id = $1
         ORDER BY d.created_at DESC
         LIMIT 100`,
        [req.user!.id]
      );
    } else if (req.user!.role === 'rider') {
      const riderResult = await query('SELECT id FROM riders WHERE user_id = $1', [req.user!.id]);
      if (riderResult.rows.length === 0) {
        throw new AppError('Rider profile not found', 404);
      }
      const riderId = riderResult.rows[0].id;

      deliveries = await query(
        `SELECT d.*, o.order_number, o.customer_name, o.customer_phone,
                o.delivery_address_line1, o.delivery_city,
                r.name as restaurant_name
         FROM deliveries d
         JOIN orders o ON d.order_id = o.id
         JOIN restaurants r ON d.restaurant_id = r.id
         WHERE d.rider_id = $1
         ORDER BY d.created_at DESC
         LIMIT 100`,
        [riderId]
      );
    } else {
      throw new AppError('Unauthorized', 403);
    }

    res.json({ deliveries: deliveries.rows });
  } catch (error) {
    next(error);
  }
});

// Refresh DoorDash delivery status
router.post('/:id/refresh-status', authorize('restaurant_owner', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const delivery = await query('SELECT * FROM deliveries WHERE id = $1', [req.params.id]);
    if (delivery.rows.length === 0) {
      throw new AppError('Delivery not found', 404);
    }

    const deliveryData = delivery.rows[0];

    // Verify access
    if (req.user!.role !== 'admin') {
      const restaurantCheck = await query(
        'SELECT owner_id FROM restaurants WHERE id = $1',
        [deliveryData.restaurant_id]
      );
      if (restaurantCheck.rows[0]?.owner_id !== req.user!.id) {
        throw new AppError('Access denied', 403);
      }
    }

    // Poll DoorDash for status update
    await pollDoorDashDeliveryStatus(deliveryData.id, deliveryData.restaurant_id);

    // Get updated delivery
    const updatedDelivery = await query(
      `SELECT d.*, o.order_number, o.customer_name, o.customer_phone,
              o.delivery_address_line1, o.delivery_city,
              r.name as restaurant_name
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       JOIN restaurants r ON d.restaurant_id = r.id
       WHERE d.id = $1`,
      [req.params.id]
    );

    res.json({ delivery: updatedDelivery.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Assign delivery to rider
router.post('/:id/assign', authorize('restaurant_owner', 'admin'), async (req: AuthRequest, res, next) => {
  try {
    const { riderId } = req.body;

    if (!riderId) {
      throw new AppError('Rider ID required', 400);
    }

    const delivery = await query('SELECT * FROM deliveries WHERE id = $1', [req.params.id]);
    if (delivery.rows.length === 0) {
      throw new AppError('Delivery not found', 404);
    }

    // Verify rider exists and is available
    const rider = await query(
      'SELECT * FROM riders WHERE id = $1 AND is_available = true',
      [riderId]
    );
    if (rider.rows.length === 0) {
      throw new AppError('Rider not found or not available', 400);
    }

    // Update delivery
    await query(
      `UPDATE deliveries 
       SET rider_id = $1, status = 'assigned', assigned_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [riderId, req.params.id]
    );

    // Update order status
    await query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['assigned', delivery.rows[0].order_id]
    );

    // Update rider status
    await query(
      'UPDATE riders SET is_available = false, status = $1 WHERE id = $2',
      ['busy', riderId]
    );

    const updatedDelivery = await query(
      `SELECT d.*, o.order_number, o.customer_name,
              r.name as restaurant_name
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       JOIN restaurants r ON d.restaurant_id = r.id
       WHERE d.id = $1`,
      [req.params.id]
    );

    res.json({ delivery: updatedDelivery.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Rider accepts delivery
router.post('/:id/accept', authorize('rider'), async (req: AuthRequest, res, next) => {
  try {
    const riderResult = await query('SELECT id FROM riders WHERE user_id = $1', [req.user!.id]);
    if (riderResult.rows.length === 0) {
      throw new AppError('Rider profile not found', 404);
    }
    const riderId = riderResult.rows[0].id;

    const delivery = await query('SELECT * FROM deliveries WHERE id = $1 AND rider_id = $2', [
      req.params.id,
      riderId,
    ]);
    if (delivery.rows.length === 0) {
      throw new AppError('Delivery not found or not assigned to you', 404);
    }

    await query(
      `UPDATE deliveries 
       SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.params.id]
    );

    res.json({ message: 'Delivery accepted' });
  } catch (error) {
    next(error);
  }
});

// Update delivery status (picked up, in transit, delivered)
router.patch('/:id/status', authorize('rider'), async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['picked_up', 'in_transit', 'delivered'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const riderResult = await query('SELECT id FROM riders WHERE user_id = $1', [req.user!.id]);
    if (riderResult.rows.length === 0) {
      throw new AppError('Rider profile not found', 404);
    }
    const riderId = riderResult.rows[0].id;

    const delivery = await query('SELECT * FROM deliveries WHERE id = $1 AND rider_id = $2', [
      req.params.id,
      riderId,
    ]);
    if (delivery.rows.length === 0) {
      throw new AppError('Delivery not found or not assigned to you', 404);
    }

    const updateFields: any = { status };
    if (status === 'picked_up') {
      updateFields.picked_up_at = 'CURRENT_TIMESTAMP';
    } else if (status === 'in_transit') {
      updateFields.started_at = 'CURRENT_TIMESTAMP';
    } else if (status === 'delivered') {
      updateFields.delivered_at = 'CURRENT_TIMESTAMP';
      updateFields.actual_delivery_time = 'CURRENT_TIMESTAMP';
    }

    let updateQuery = `UPDATE deliveries SET status = $1`;
    const params: any[] = [status];

    if (status === 'picked_up') {
      updateQuery += `, picked_up_at = CURRENT_TIMESTAMP`;
    } else if (status === 'in_transit') {
      updateQuery += `, started_at = CURRENT_TIMESTAMP`;
    } else if (status === 'delivered') {
      updateQuery += `, delivered_at = CURRENT_TIMESTAMP, actual_delivery_time = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE id = $2`;
    params.push(req.params.id);

    await query(updateQuery, params);

    // Update order status
    await query('UPDATE orders SET status = $1 WHERE id = $2', [
      status,
      delivery.rows[0].order_id,
    ]);

    // If delivered, make rider available again
    if (status === 'delivered') {
      await query(
        'UPDATE riders SET is_available = true, status = $1 WHERE id = $2',
        ['available', riderId]
      );
    }

    // Create notification for delivery status change
    if (oldStatus !== status) {
      try {
        await notifyDeliveryStatusChange(deliveryData, oldStatus, status, deliveryData.restaurant_id);
      } catch (notifError) {
        console.error('Error creating notification for delivery status change:', notifError);
        // Don't fail the request if notification creation fails
      }
    }

    res.json({ message: `Delivery status updated to ${status}` });
  } catch (error) {
    next(error);
  }
});

export default router;
