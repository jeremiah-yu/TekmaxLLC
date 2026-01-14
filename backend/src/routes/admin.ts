import express from 'express';
import { query } from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const [
      totalOrders,
      activeDeliveries,
      totalRiders,
      totalRestaurants,
      todayOrders,
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM orders'),
      query("SELECT COUNT(*) as count FROM deliveries WHERE status NOT IN ('delivered', 'cancelled', 'failed')"),
      query('SELECT COUNT(*) as count FROM riders'),
      query('SELECT COUNT(*) as count FROM restaurants'),
      query("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE"),
    ]);

    res.json({
      stats: {
        totalOrders: parseInt(totalOrders.rows[0].count),
        activeDeliveries: parseInt(activeDeliveries.rows[0].count),
        totalRiders: parseInt(totalRiders.rows[0].count),
        totalRestaurants: parseInt(totalRestaurants.rows[0].count),
        todayOrders: parseInt(todayOrders.rows[0].count),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
