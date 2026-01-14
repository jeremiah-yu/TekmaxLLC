import express, { Response, NextFunction } from 'express';
import { query } from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

router.use(authenticate);

// Get riders
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let riders;

    if (req.user!.role === 'admin') {
      riders = await query(
        `SELECT r.*, u.first_name, u.last_name, u.email, u.phone as user_phone,
                rest.name as restaurant_name
         FROM riders r
         JOIN users u ON r.user_id = u.id
         LEFT JOIN restaurants rest ON r.restaurant_id = rest.id
         ORDER BY r.created_at DESC`
      );
    } else if (req.user!.role === 'restaurant_owner') {
      riders = await query(
        `SELECT r.*, u.first_name, u.last_name, u.email, u.phone as user_phone
         FROM riders r
         JOIN users u ON r.user_id = u.id
         WHERE r.restaurant_id = $1
         ORDER BY r.created_at DESC`,
        [req.user!.restaurantId]
      );
    } else {
      throw new AppError('Unauthorized', 403);
    }

    res.json({ riders: riders.rows });
  } catch (error) {
    next(error);
  }
});

// Get available riders
router.get('/available', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.query.restaurantId as string;

    if (!restaurantId && req.user!.role !== 'admin') {
      throw new AppError('Restaurant ID required', 400);
    }

    let queryStr = `
      SELECT r.*, u.first_name, u.last_name, u.phone as user_phone
      FROM riders r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_available = true AND r.is_online = true
    `;

    const params: string[] = [];
    if (restaurantId) {
      queryStr += ` AND r.restaurant_id = $1`;
      params.push(restaurantId);
    }

    queryStr += ` ORDER BY r.rating DESC, r.total_deliveries DESC`;

    const riders = await query(queryStr, params);

    res.json({ riders: riders.rows });
  } catch (error) {
    next(error);
  }
});

// Update rider location
router.post('/location', authorize('rider'), async (req: AuthRequest, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude required', 400);
    }

    const riderResult = await query('SELECT id FROM riders WHERE user_id = $1', [req.user!.id]);
    if (riderResult.rows.length === 0) {
      throw new AppError('Rider profile not found', 404);
    }
    const riderId = riderResult.rows[0].id;

    await query(
      'UPDATE riders SET current_latitude = $1, current_longitude = $2 WHERE id = $3',
      [latitude, longitude, riderId]
    );

    res.json({ message: 'Location updated' });
  } catch (error) {
    next(error);
  }
});

// Update rider availability
router.patch('/availability', authorize('rider'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isAvailable, isOnline } = req.body;

    const riderResult = await query('SELECT id FROM riders WHERE user_id = $1', [req.user!.id]);
    if (riderResult.rows.length === 0) {
      throw new AppError('Rider profile not found', 404);
    }
    const riderId = riderResult.rows[0].id;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (isAvailable !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      params.push(isAvailable);
    }

    if (isOnline !== undefined) {
      updates.push(`is_online = $${paramCount++}`);
      params.push(isOnline);
      updates.push(`status = $${paramCount++}`);
      params.push(isOnline ? 'available' : 'offline');
    }

    if (updates.length === 0) {
      throw new AppError('No updates provided', 400);
    }

    params.push(riderId);
    await query(
      `UPDATE riders SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    res.json({ message: 'Availability updated' });
  } catch (error) {
    next(error);
  }
});

export default router;
