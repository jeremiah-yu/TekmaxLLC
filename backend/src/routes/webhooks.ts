import express, { Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { processGloriaFoodOrder, verifyGloriaFoodWebhook } from '../services/gloriaFood';
import { updateDeliveryFromDoorDash } from '../services/doordashTracking';
import { scheduleDoorDashCall } from '../services/doordash';
import { notifyNewOrder } from '../services/notifications';

const router = express.Router();

// Gloria Food webhook endpoint
router.post('/gloria-food', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-gloria-signature'] as string;
    const apiKey = req.headers['x-api-key'] as string || req.body.api_key;

    if (!apiKey) {
      throw new AppError('API key required', 401);
    }

    // Find webhook config for Gloria Food - check both webhook_configs and restaurant_settings
    let config = await query(
      `SELECT wc.*, r.id as restaurant_id
       FROM webhook_configs wc
       JOIN restaurants r ON wc.restaurant_id = r.id
       WHERE wc.platform = 'gloria_food' 
       AND (wc.api_key = $1 OR wc.api_secret = $1)
       AND wc.is_active = true`,
      [apiKey]
    );

    // If not found in webhook_configs, check restaurant_settings
    if (config.rows.length === 0) {
      config = await query(
        `SELECT rs.*, r.id as restaurant_id, rs.gloria_food_api_key as api_key, rs.gloria_food_master_key as api_secret
         FROM restaurant_settings rs
         JOIN restaurants r ON rs.restaurant_id = r.id
         WHERE (rs.gloria_food_api_key = $1 OR rs.gloria_food_store_id = $1)
         AND rs.is_gloria_food_connected = true`,
        [apiKey]
      );
    }

    if (config.rows.length === 0) {
      throw new AppError('Invalid API key or restaurant not found', 401);
    }

    const webhookConfig = config.rows[0];
    const restaurantId = webhookConfig.restaurant_id;

    // Verify webhook signature (if provided)
    if (signature && webhookConfig.api_secret) {
      const isValid = verifyGloriaFoodWebhook(
        JSON.stringify(req.body),
        signature,
        webhookConfig.api_secret
      );
      if (!isValid) {
        throw new AppError('Invalid webhook signature', 401);
      }
    }

    // Log webhook event
    const eventResult = await query(
      `INSERT INTO webhook_events (webhook_config_id, event_type, payload, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [webhookConfig.id, req.body.event_type || req.body.type || 'order.created', JSON.stringify(req.body)]
    );

    // Process Gloria Food order
    if (req.body.event_type === 'order.created' || req.body.type === 'order.created' || req.body.order) {
      try {
        const order = await processGloriaFoodOrder(req.body.order || req.body, restaurantId);
        
        // Automatically accept the order (set status to 'confirmed')
        await query(
          `UPDATE orders SET status = 'confirmed' WHERE id = $1`,
          [order.id]
        );
        
        // Create notification for new order
        try {
          await notifyNewOrder(order, restaurantId);
        } catch (notifError) {
          console.error('Error creating notification for new order:', notifError);
          // Don't fail the webhook if notification creation fails
        }
        
        // Schedule DoorDash delivery call for 20-25 minutes after order acceptance
        try {
          // Random delay between 20-25 minutes
          const delayMinutes = 20 + Math.random() * 5; // 20-25 minutes
          await scheduleDoorDashCall(order.id, delayMinutes);
          console.log(`Gloria Food order ${order.order_number} (ID: ${order.id}) accepted and DoorDash scheduled in ${delayMinutes.toFixed(2)} minutes`);
        } catch (doorDashError) {
          console.error('Error scheduling DoorDash call for Gloria Food order:', doorDashError);
          // Don't fail the webhook if DoorDash scheduling fails
        }
        
        // Update webhook event status
        await query(
          `UPDATE webhook_events SET status = 'processed' WHERE id = $1`,
          [eventResult.rows[0].id]
        );

        res.json({ 
          received: true, 
          order_id: order.id,
          order_number: order.order_number,
          status: 'confirmed',
          doordash_scheduled: true,
          message: 'Order created and accepted successfully. DoorDash delivery scheduled.' 
        });
      } catch (error) {
        // Update webhook event status
        await query(
          `UPDATE webhook_events SET status = 'failed', error_message = $1 WHERE id = $2`,
          [error instanceof Error ? error.message : 'Unknown error', eventResult.rows[0].id]
        );
        throw error;
      }
    } else {
      res.json({ received: true, message: 'Webhook received but no order to process' });
    }
  } catch (error) {
    next(error);
  }
});

// DoorDash webhook endpoint
router.post('/doordash', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-doordash-signature'] as string;
    const eventType = req.body.event_type || req.body.type;

    // Verify signature (in production, verify DoorDash signature)
    // For now, we'll accept webhooks from DoorDash

    // Log webhook event
    const eventResult = await query(
      `INSERT INTO webhook_events (webhook_config_id, event_type, payload, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [null, eventType || 'unknown', JSON.stringify(req.body)]
    );

    // Handle DoorDash delivery status updates
    if (eventType === 'delivery.status.updated' || req.body.delivery_id) {
      const deliveryId = req.body.delivery_id || req.body.id;
      const status = req.body.status || req.body.delivery_status;
      const trackingUrl = req.body.tracking_url;
      const estimatedPickupTime = req.body.estimated_pickup_time;
      const estimatedDeliveryTime = req.body.estimated_delivery_time;

      if (deliveryId && status) {
        await updateDeliveryFromDoorDash(
          deliveryId,
          status,
          trackingUrl,
          estimatedPickupTime ? new Date(estimatedPickupTime) : undefined,
          estimatedDeliveryTime ? new Date(estimatedDeliveryTime) : undefined
        );

        // Update webhook event status
        await query(
          `UPDATE webhook_events SET status = 'processed' WHERE id = $1`,
          [eventResult.rows[0].id]
        );
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Generic webhook endpoint (no auth required, uses API key in header)
router.post('/:platform', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform } = req.params;
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppError('API key required', 401);
    }

    // Find webhook config
    const config = await query(
      `SELECT * FROM webhook_configs 
       WHERE platform = $1 AND api_key = $2 AND is_active = true`,
      [platform, apiKey]
    );

    if (config.rows.length === 0) {
      throw new AppError('Invalid API key or platform', 401);
    }

    const webhookConfig = config.rows[0];

    // Log webhook event
    await query(
      `INSERT INTO webhook_events (webhook_config_id, event_type, payload, status)
       VALUES ($1, $2, $3, 'pending')`,
      [webhookConfig.id, req.body.type || 'unknown', JSON.stringify(req.body)]
    );

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Webhook config management (requires auth)
router.use(authenticate);

router.get('/configs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let configs;

    if (req.user!.role === 'admin') {
      configs = await query('SELECT * FROM webhook_configs ORDER BY created_at DESC');
    } else if (req.user!.role === 'restaurant_owner') {
      configs = await query(
        'SELECT * FROM webhook_configs WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = $1)',
        [req.user!.id]
      );
    } else {
      throw new AppError('Unauthorized', 403);
    }

    res.json({ configs: configs.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
