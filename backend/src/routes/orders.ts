import express, { Response, NextFunction } from 'express';
import { query } from '../database/connection';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { scheduleDoorDashCall } from '../services/doordash';
import { notifyNewOrder, notifyOrderStatusChange } from '../services/notifications';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create order
router.post('/', authorize('restaurant_owner', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      restaurantId,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      items,
      subtotal,
      tax,
      deliveryFee,
      tip,
      deliveryInstructions,
      estimatedPrepTime,
    } = req.body;

    if (!restaurantId || !customerName || !customerPhone || !deliveryAddress || !items || !subtotal) {
      throw new AppError('Missing required fields', 400);
    }

    // Verify restaurant ownership (if not admin)
    if (req.user!.role !== 'admin') {
      const restaurantCheck = await query(
        'SELECT id FROM restaurants WHERE id = $1 AND owner_id = $2',
        [restaurantId, req.user!.id]
      );
      if (restaurantCheck.rows.length === 0) {
        throw new AppError('Restaurant not found or access denied', 403);
      }
    }

    const totalAmount = parseFloat(subtotal) + parseFloat(tax || 0) + parseFloat(deliveryFee || 0) + parseFloat(tip || 0);

    // Create order
    const orderResult = await query(
      `INSERT INTO orders (
        restaurant_id, customer_name, customer_phone, customer_email,
        delivery_address_line1, delivery_city, delivery_state, delivery_postal_code,
        delivery_latitude, delivery_longitude, delivery_instructions,
        subtotal, tax, delivery_fee, tip, total_amount,
        estimated_prep_time, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending')
      RETURNING *`,
      [
        restaurantId,
        customerName,
        customerPhone,
        customerEmail || null,
        deliveryAddress.line1,
        deliveryAddress.city,
        deliveryAddress.state || null,
        deliveryAddress.postalCode || null,
        deliveryLatitude || null,
        deliveryLongitude || null,
        deliveryInstructions || null,
        subtotal,
        tax || 0,
        deliveryFee || 0,
        tip || 0,
        totalAmount,
        estimatedPrepTime || null,
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of items) {
      await query(
        `INSERT INTO order_items (order_id, item_name, quantity, unit_price, subtotal, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.id,
          item.name,
          item.quantity,
          item.unitPrice,
          item.subtotal,
          item.specialInstructions || null,
        ]
      );
    }

    // Create delivery record
    await query(
      `INSERT INTO deliveries (order_id, restaurant_id, status)
       VALUES ($1, $2, 'pending')`,
      [order.id, restaurantId]
    );

    // Create notification for new order
    try {
      await notifyNewOrder(order, restaurantId);
    } catch (notifError) {
      console.error('Error creating notification for new order:', notifError);
      // Don't fail the request if notification creation fails
    }

    // Get full order with items
    const fullOrder = await getOrderWithItems(order.id);

    res.status(201).json({ order: fullOrder });
  } catch (error) {
    next(error);
  }
});

// Get orders
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let orders;

    if (req.user!.role === 'admin') {
      // Admin can see all orders
      orders = await query(
        `SELECT o.*, r.name as restaurant_name
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         ORDER BY o.created_at DESC
         LIMIT 100`
      );
    } else if (req.user!.role === 'restaurant_owner') {
      // Restaurant owners see their restaurant's orders
      orders = await query(
        `SELECT o.*, r.name as restaurant_name
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         WHERE r.owner_id = $1
         ORDER BY o.created_at DESC
         LIMIT 100`,
        [req.user!.id]
      );
    } else {
      throw new AppError('Unauthorized', 403);
    }

    res.json({ orders: orders.rows });
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderWithItems(req.params.id);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify access
    if (req.user!.role !== 'admin') {
      const restaurantCheck = await query(
        'SELECT owner_id FROM restaurants WHERE id = $1',
        [order.restaurant_id]
      );
      if (restaurantCheck.rows[0]?.owner_id !== req.user!.id) {
        throw new AppError('Access denied', 403);
      }
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// Update order status
router.patch('/:id/status', authorize('restaurant_owner', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const order = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (order.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    // Verify access
    if (req.user!.role !== 'admin') {
      const restaurantCheck = await query(
        'SELECT owner_id FROM restaurants WHERE id = $1',
        [order.rows[0].restaurant_id]
      );
      if (restaurantCheck.rows[0]?.owner_id !== req.user!.id) {
        throw new AppError('Access denied', 403);
      }
    }

    const oldStatus = order.rows[0].status;
    const orderData = order.rows[0];
    await query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);

    // Create notification for status change
    if (oldStatus !== status) {
      try {
        const restaurantId = orderData.restaurant_id;
        await notifyOrderStatusChange(orderData, oldStatus, status, restaurantId);
      } catch (notifError) {
        console.error('Error creating notification for order status change:', notifError);
        // Don't fail the request if notification creation fails
      }
    }

    // Schedule DoorDash call when order is accepted (confirmed or preparing)
    // Only schedule if status changed from pending/other to confirmed or preparing
    if ((status === 'confirmed' || status === 'preparing') && 
        oldStatus !== 'confirmed' && oldStatus !== 'preparing') {
      try {
        // Random delay between 20-25 minutes
        const delayMinutes = 20 + Math.random() * 5; // 20-25 minutes
        await scheduleDoorDashCall(req.params.id, delayMinutes);
        console.log(`Scheduled DoorDash call for order ${req.params.id} in ${delayMinutes.toFixed(2)} minutes`);
      } catch (error) {
        console.error('Error scheduling DoorDash call:', error);
        // Don't fail the request if scheduling fails
      }
    }

    // Update delivery status if needed
    if (['picked_up', 'in_transit', 'delivered'].includes(status)) {
      const deliveryStatus = status === 'picked_up' ? 'picked_up' : status === 'in_transit' ? 'in_transit' : 'delivered';
      await query('UPDATE deliveries SET status = $1 WHERE order_id = $2', [deliveryStatus, req.params.id]);
    }

    const updatedOrder = await getOrderWithItems(req.params.id);

    res.json({ order: updatedOrder });
  } catch (error) {
    next(error);
  }
});

async function getOrderWithItems(orderId: string) {
  const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (orderResult.rows.length === 0) return null;

  const order = orderResult.rows[0];
  const itemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  order.items = itemsResult.rows;

  return order;
}

export default router;
