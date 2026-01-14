import express from 'express';
import { query } from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

router.use(authenticate);

// Update location (rider)
router.post('/location', authorize('rider'), async (req: AuthRequest, res, next) => {
  try {
    const { deliveryId, latitude, longitude, accuracy, heading, speed } = req.body;

    if (!deliveryId || !latitude || !longitude) {
      throw new AppError('Delivery ID, latitude, and longitude required', 400);
    }

    const riderResult = await query('SELECT id FROM riders WHERE user_id = $1', [req.user!.id]);
    if (riderResult.rows.length === 0) {
      throw new AppError('Rider profile not found', 404);
    }
    const riderId = riderResult.rows[0].id;

    // Verify delivery is assigned to this rider
    const delivery = await query('SELECT * FROM deliveries WHERE id = $1 AND rider_id = $2', [
      deliveryId,
      riderId,
    ]);
    if (delivery.rows.length === 0) {
      throw new AppError('Delivery not found or not assigned to you', 404);
    }

    // Update rider location
    await query(
      'UPDATE riders SET current_latitude = $1, current_longitude = $2 WHERE id = $3',
      [latitude, longitude, riderId]
    );

    // Record location update
    await query(
      `INSERT INTO location_updates (delivery_id, rider_id, latitude, longitude, accuracy, heading, speed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [deliveryId, riderId, latitude, longitude, accuracy || null, heading || null, speed || null]
    );

    res.json({ message: 'Location updated' });
  } catch (error) {
    next(error);
  }
});

// Get tracking data for delivery
router.get('/:deliveryId', async (req: AuthRequest, res, next) => {
  try {
    const { deliveryId } = req.params;

    // Get delivery info
    const delivery = await query(
      `SELECT d.*, o.order_number, o.delivery_address_line1, o.delivery_latitude, o.delivery_longitude,
              r.current_latitude, r.current_longitude, r.first_name || ' ' || r.last_name as rider_name
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       LEFT JOIN riders rd ON d.rider_id = rd.id
       LEFT JOIN users r ON rd.user_id = r.id
       WHERE d.id = $1`,
      [deliveryId]
    );

    if (delivery.rows.length === 0) {
      throw new AppError('Delivery not found', 404);
    }

    // Get location history
    const locations = await query(
      `SELECT latitude, longitude, timestamp, accuracy, heading, speed
       FROM location_updates
       WHERE delivery_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`,
      [deliveryId]
    );

    res.json({
      delivery: delivery.rows[0],
      locationHistory: locations.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
